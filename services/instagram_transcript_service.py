import html
import io
import json
import os
import random
import re
import string
import subprocess
import tempfile
import time
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse, urlunparse

import requests
import yt_dlp

try:
    from curl_cffi import requests as curl_requests  # type: ignore
except Exception:  # pragma: no cover
    curl_requests = None


INFO_CACHE_TTL = 1800  # 30 min
SUBTITLE_CACHE_TTL = 3600  # 60 min
ASR_TIMEOUT_SECONDS = int(os.getenv("INSTAGRAM_ASR_TIMEOUT_SECONDS", "180"))
ASR_MAX_BYTES = int(os.getenv("INSTAGRAM_ASR_MAX_BYTES", str(24 * 1024 * 1024)))
ASR_RAW_MAX_BYTES = int(os.getenv("INSTAGRAM_ASR_RAW_MAX_BYTES", str(128 * 1024 * 1024)))
ASR_FFMPEG_TIMEOUT_SECONDS = int(os.getenv("INSTAGRAM_ASR_FFMPEG_TIMEOUT_SECONDS", "180"))
ASR_MODEL = os.getenv("HF_ASR_MODEL", "openai/whisper-large-v3")
ASR_API_URL = os.getenv("HF_ASR_URL", "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3")
ASR_LEGACY_API_URL = os.getenv("HF_ASR_LEGACY_URL", "https://api-inference.huggingface.co/models/openai/whisper-large-v3")
INSTAGRAM_IMPERSONATE_TARGET = os.getenv("INSTAGRAM_IMPERSONATE_TARGET", "chrome")
INSTAGRAM_APP_INFO = os.getenv(
    "INSTAGRAM_APP_INFO",
    "",
).strip()
INSTAGRAM_ENABLE_YTDLP_CLI_FALLBACK = os.getenv("INSTAGRAM_ENABLE_YTDLP_CLI_FALLBACK", "1") == "1"
INSTAGRAM_YTDLP_CLI_TIMEOUT_SECONDS = int(os.getenv("INSTAGRAM_YTDLP_CLI_TIMEOUT_SECONDS", "120"))

_instagram_info_cache: Dict[str, Tuple[float, dict]] = {}
_instagram_subtitle_cache: Dict[str, Tuple[float, dict]] = {}
_AUDIO_EXTENSIONS = {"mp3", "wav", "flac", "ogg", "opus", "webm", "m4a", "aac"}


class InstagramTranscriptError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[dict] = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details

    def to_payload(self) -> dict:
        payload = {"ok": False, "error": {"code": self.code, "message": self.message}}
        if self.details is not None:
            payload["error"]["details"] = self.details
        return payload


def normalize_instagram_url(raw_url: str) -> str:
    if not isinstance(raw_url, str) or not raw_url.strip():
        raise InstagramTranscriptError("INVALID_URL", "A valid URL is required.", 400)

    url = raw_url.strip()
    parsed = urlparse(url)
    if not parsed.scheme:
        parsed = urlparse(f"https://{url}")

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise InstagramTranscriptError("INVALID_URL", "Invalid URL format.", 400)

    host = parsed.netloc.split(":")[0].lower()
    if "instagram.com" not in host:
        raise InstagramTranscriptError(
            "UNSUPPORTED_PLATFORM",
            "Only Instagram URLs are supported for this endpoint.",
            400,
        )

    normalized = urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            parsed.query,
            "",
        )
    )
    return normalized


def _map_extraction_error(exc: Exception) -> InstagramTranscriptError:
    message = str(exc)
    lower_message = message.lower()

    if "private" in lower_message or "login" in lower_message:
        return InstagramTranscriptError(
            "PRIVATE_OR_LOGIN_REQUIRED",
            "This Instagram video is private or requires login.",
            403,
        )
    if "geo" in lower_message or "country" in lower_message or "region" in lower_message:
        return InstagramTranscriptError(
            "GEO_RESTRICTED",
            "This Instagram video is not available in your region.",
            403,
        )
    if "not available" in lower_message or "unavailable" in lower_message:
        return InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "This Instagram video is unavailable.",
            404,
            {"raw_error": message[:500]},
        )

    if "impersonate" in lower_message and "unsupported" in lower_message:
        return InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "Failed to load this Instagram video right now.",
            502,
            {"raw_error": message[:500]},
        )

    return InstagramTranscriptError(
        "VIDEO_UNAVAILABLE",
        "Failed to fetch Instagram video metadata.",
        502,
        {"raw_error": message[:500]},
    )


def _get_info_proxy_url() -> Optional[str]:
    env_proxy = os.getenv("INSTAGRAM_INFO_PROXY_URL", "").strip()
    if env_proxy:
        return env_proxy

    if os.getenv("INSTAGRAM_ENABLE_BUILTIN_PROXY", "1") != "1":
        return None

    # Matches the existing dynamic proxy behavior in app.py, but used only for info extraction.
    customer_id = "B_48472"
    password = "vaug9887"
    country = "US"
    gateway = "gate1.ipweb.cc"
    port = "7778"
    session_id = "".join(random.choices(string.ascii_letters + string.digits, k=12))
    username = f"{customer_id}_{country}___5_{session_id}"
    return f"http://{username}:{password}@{gateway}:{port}"


def _ydl_options(
    proxy_url: Optional[str] = None,
    use_impersonate: bool = True,
    use_app_info: bool = True,
) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": 25,
        "retries": 2,
        "fragment_retries": 2,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            )
        },
    }

    if use_impersonate:
        opts["impersonate"] = INSTAGRAM_IMPERSONATE_TARGET

    if use_app_info and INSTAGRAM_APP_INFO:
        opts["extractor_args"] = {"instagram": {"app_info": [INSTAGRAM_APP_INFO]}}

    # Explicitly disable env/system proxies when proxy_url is None.
    opts["proxy"] = proxy_url if proxy_url is not None else ""

    return opts


def _cache_get(cache: Dict[str, Tuple[float, dict]], key: str, ttl: int) -> Optional[dict]:
    if key not in cache:
        return None
    ts, data = cache[key]
    if time.time() - ts > ttl:
        cache.pop(key, None)
        return None
    return data


def _cache_set(cache: Dict[str, Tuple[float, dict]], key: str, value: dict) -> None:
    cache[key] = (time.time(), value)


def _extract_info_once(
    normalized_url: str,
    proxy_url: Optional[str],
    use_impersonate: bool,
    use_app_info: bool,
) -> dict:
    try:
        with yt_dlp.YoutubeDL(
            _ydl_options(
                proxy_url=proxy_url,
                use_impersonate=use_impersonate,
                use_app_info=use_app_info,
            )
        ) as ydl:
            return ydl.extract_info(normalized_url, download=False)
    except Exception as exc:
        raise _map_extraction_error(exc) from exc


def _extract_info_via_ytdlp_cli_once(
    normalized_url: str,
    use_app_info: bool,
) -> dict:
    cli_cmd = [
        "yt-dlp",
        "--proxy",
        "",
        "--impersonate",
        INSTAGRAM_IMPERSONATE_TARGET,
        "--dump-single-json",
        "--skip-download",
        normalized_url,
    ]
    if use_app_info and INSTAGRAM_APP_INFO:
        cli_cmd.extend(["--extractor-args", f"instagram:app_info={INSTAGRAM_APP_INFO}"])

    try:
        completed = subprocess.run(
            cli_cmd,
            capture_output=True,
            text=True,
            timeout=INSTAGRAM_YTDLP_CLI_TIMEOUT_SECONDS,
            check=False,
        )
    except FileNotFoundError as exc:
        raise InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "yt-dlp CLI is not available on server PATH.",
            502,
            {"transport": "yt_dlp_cli"},
        ) from exc
    except Exception as exc:
        raise InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "yt-dlp CLI metadata extraction failed.",
            502,
            {"transport": "yt_dlp_cli", "error": str(exc)[:300]},
        ) from exc

    stdout = (completed.stdout or "").strip()
    stderr = (completed.stderr or "").strip()

    if completed.returncode != 0 or not stdout:
        raise InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "yt-dlp CLI metadata extraction failed.",
            502,
            {
                "transport": "yt_dlp_cli",
                "returncode": completed.returncode,
                "stderr_tail": stderr[-500:] if stderr else "",
            },
        )

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        lines = [line.strip() for line in stdout.splitlines() if line.strip()]
        parsed = None
        for line in reversed(lines):
            if not line.startswith("{"):
                continue
            try:
                parsed = json.loads(line)
                break
            except json.JSONDecodeError:
                continue
        if not isinstance(parsed, dict):
            raise InstagramTranscriptError(
                "VIDEO_UNAVAILABLE",
                "yt-dlp CLI returned invalid metadata JSON.",
                502,
                {"transport": "yt_dlp_cli", "stdout_tail": stdout[-500:]},
            )
        payload = parsed

    if not isinstance(payload, dict):
        raise InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "yt-dlp CLI returned empty metadata.",
            502,
            {"transport": "yt_dlp_cli"},
        )
    return payload


def _extract_info_via_ytdlp_cli(normalized_url: str) -> dict:
    last_error: Optional[InstagramTranscriptError] = None
    for use_app_info in (True, False):
        try:
            return _extract_info_via_ytdlp_cli_once(normalized_url, use_app_info=use_app_info)
        except InstagramTranscriptError as err:
            last_error = err
            continue
    if last_error is not None:
        raise last_error
    raise InstagramTranscriptError(
        "VIDEO_UNAVAILABLE",
        "yt-dlp CLI metadata extraction failed.",
        502,
        {"transport": "yt_dlp_cli"},
    )


def _extract_info(normalized_url: str, force_refresh: bool = False) -> dict:
    cache_key = f"instagram:{normalized_url}"
    if not force_refresh:
        cached = _cache_get(_instagram_info_cache, cache_key, INFO_CACHE_TTL)
        if cached is not None:
            return cached

    proxy_url = _get_info_proxy_url()
    last_error: Optional[InstagramTranscriptError] = None
    info = None
    attempt_matrix = [
        {"proxy": None, "use_impersonate": True, "use_app_info": True},
        {"proxy": None, "use_impersonate": True, "use_app_info": False},
        {"proxy": None, "use_impersonate": False, "use_app_info": False},
    ]
    if proxy_url:
        attempt_matrix.extend(
            [
                {"proxy": proxy_url, "use_impersonate": True, "use_app_info": True},
                {"proxy": proxy_url, "use_impersonate": True, "use_app_info": False},
                {"proxy": proxy_url, "use_impersonate": False, "use_app_info": False},
            ]
        )

    for attempt in attempt_matrix:
        try:
            info = _extract_info_once(
                normalized_url,
                attempt["proxy"],
                attempt["use_impersonate"],
                attempt["use_app_info"],
            )
            break
        except InstagramTranscriptError as err:
            last_error = err
            continue

    if info is None and INSTAGRAM_ENABLE_YTDLP_CLI_FALLBACK:
        try:
            info = _extract_info_via_ytdlp_cli(normalized_url)
        except InstagramTranscriptError as cli_err:
            last_error = cli_err

    if info is None:
        if last_error is not None:
            raise last_error
        raise InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "Failed to fetch instagram video metadata.",
            502,
        )

    if not isinstance(info, dict):
        raise InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "Failed to read instagram video metadata.",
            502,
        )

    _cache_set(_instagram_info_cache, cache_key, info)
    return info


def _collect_languages(info: dict) -> List[dict]:
    languages: List[dict] = []
    seen_codes = set()

    for source_key, source_name in (("subtitles", "manual"), ("automatic_captions", "automatic")):
        source_map = info.get(source_key) or {}
        if not isinstance(source_map, dict):
            continue
        for code, items in source_map.items():
            if code in seen_codes:
                continue
            label = code
            if isinstance(items, list) and items:
                first_item = items[0]
                if isinstance(first_item, dict):
                    label = first_item.get("name") or code
            languages.append({"code": code, "label": label, "source": source_name})
            seen_codes.add(code)

    return languages


def _english_code(available_codes: List[str]) -> Optional[str]:
    if "en" in available_codes:
        return "en"
    for code in available_codes:
        if code.lower().startswith("en"):
            return code
    return None


def _resolve_language(requested_lang: Optional[str], available_codes: List[str]) -> Tuple[str, List[str]]:
    if not available_codes:
        raise InstagramTranscriptError(
            "NO_SUBTITLE",
            "No subtitles are available for this instagram video.",
            404,
        )

    requested = (requested_lang or "en").strip() or "en"
    first_available = available_codes[0]
    en_code = _english_code(available_codes)

    fallback_order = [requested]
    if en_code and en_code not in fallback_order:
        fallback_order.append(en_code)
    if first_available not in fallback_order:
        fallback_order.append(first_available)

    if requested in available_codes:
        return requested, fallback_order
    if en_code is not None:
        return en_code, fallback_order
    return first_available, fallback_order


def _format_priority(item: dict) -> int:
    ext = str(item.get("ext", "")).lower()
    if ext == "vtt":
        return 0
    if ext == "srt":
        return 1
    return 2


def _pick_subtitle_track(info: dict, lang_code: str) -> Tuple[str, str]:
    sources = [
        ("subtitles", info.get("subtitles") or {}),
        ("automatic_captions", info.get("automatic_captions") or {}),
    ]

    for _, source_map in sources:
        if not isinstance(source_map, dict):
            continue
        tracks = source_map.get(lang_code) or []
        usable_tracks = [track for track in tracks if isinstance(track, dict) and track.get("url")]
        usable_tracks.sort(key=_format_priority)
        if usable_tracks:
            best = usable_tracks[0]
            return best["url"], str(best.get("ext", "vtt")).lower()

    raise InstagramTranscriptError(
        "LANG_NOT_AVAILABLE",
        "Subtitle track is not available for the selected language.",
        404,
        {"lang": lang_code},
    )


def _download_subtitle_text(subtitle_url: str) -> str:
    try:
        response = requests.get(subtitle_url, timeout=30)
        response.raise_for_status()
        return response.text or ""
    except Exception as exc:
        raise InstagramTranscriptError(
            "SUBTITLE_FETCH_FAILED",
            "Failed to download subtitle content.",
            502,
        ) from exc


def _strip_tags(value: str) -> str:
    text = re.sub(r"<[^>]+>", "", value)
    return html.unescape(text).strip()


def _parse_time_to_seconds(value: str) -> float:
    clean = value.strip().replace(",", ".")
    parts = clean.split(":")

    try:
        if len(parts) == 3:
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = float(parts[2])
            return hours * 3600 + minutes * 60 + seconds
        if len(parts) == 2:
            minutes = int(parts[0])
            seconds = float(parts[1])
            return minutes * 60 + seconds
        return float(clean)
    except ValueError:
        return 0.0


def _seconds_to_srt(seconds_value: float) -> str:
    safe = max(0.0, seconds_value)
    total_ms = int(round(safe * 1000))
    hours = total_ms // 3_600_000
    minutes = (total_ms % 3_600_000) // 60_000
    seconds = (total_ms % 60_000) // 1000
    millis = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"


def _seconds_to_vtt(seconds_value: float) -> str:
    safe = max(0.0, seconds_value)
    total_ms = int(round(safe * 1000))
    hours = total_ms // 3_600_000
    minutes = (total_ms % 3_600_000) // 60_000
    seconds = (total_ms % 60_000) // 1000
    millis = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{millis:03d}"


def _parse_vtt_or_srt_to_segments(raw_text: str) -> List[dict]:
    lines = raw_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    segments: List[dict] = []
    current_start: Optional[float] = None
    current_end: Optional[float] = None
    buffer: List[str] = []

    timestamp_pattern = re.compile(
        r"(?P<start>\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}|\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*"
        r"(?P<end>\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}|\d{1,2}:\d{2}[.,]\d{1,3})"
    )

    def flush() -> None:
        nonlocal current_start, current_end, buffer
        if current_start is None or current_end is None:
            buffer = []
            return
        text = _strip_tags(" ".join(line.strip() for line in buffer if line.strip()))
        if text:
            segments.append(
                {
                    "start": round(current_start, 3),
                    "end": round(max(current_end, current_start), 3),
                    "text": text,
                }
            )
        current_start = None
        current_end = None
        buffer = []

    for line in lines:
        stripped = line.strip()

        if not stripped:
            flush()
            continue

        if stripped.upper() == "WEBVTT" or stripped.startswith("NOTE"):
            continue

        if stripped.isdigit() and current_start is None:
            continue

        match = timestamp_pattern.search(stripped)
        if match:
            flush()
            current_start = _parse_time_to_seconds(match.group("start"))
            current_end = _parse_time_to_seconds(match.group("end"))
            continue

        if current_start is not None:
            buffer.append(stripped)

    flush()

    if segments:
        return segments

    plain_lines = [_strip_tags(line) for line in lines if line.strip() and "-->" not in line]
    plain_lines = [line for line in plain_lines if line]
    fallback_segments = []
    for idx, text in enumerate(plain_lines):
        start = float(idx * 2)
        fallback_segments.append({"start": start, "end": start + 2.0, "text": text})
    return fallback_segments


def _segments_to_srt(segments: List[dict]) -> str:
    blocks = []
    for idx, seg in enumerate(segments, start=1):
        start = float(seg.get("start", 0.0))
        end = float(seg.get("end", start + 2.0))
        if end <= start:
            end = start + 2.0
        text = str(seg.get("text", "")).strip()
        blocks.append(
            "\n".join(
                [
                    str(idx),
                    f"{_seconds_to_srt(start)} --> {_seconds_to_srt(end)}",
                    text,
                    "",
                ]
            )
        )
    return "\n".join(blocks).strip() + "\n"


def _segments_to_vtt(segments: List[dict]) -> str:
    blocks = ["WEBVTT", ""]
    for seg in segments:
        start = float(seg.get("start", 0.0))
        end = float(seg.get("end", start + 2.0))
        if end <= start:
            end = start + 2.0
        text = str(seg.get("text", "")).strip()
        blocks.append(f"{_seconds_to_vtt(start)} --> {_seconds_to_vtt(end)}")
        blocks.append(text)
        blocks.append("")
    return "\n".join(blocks).strip() + "\n"


def _sanitize_filename(value: str) -> str:
    safe = re.sub(r'[\\/*?:"<>|]', "_", value).strip()
    if not safe:
        safe = "instagram_transcript"
    return safe[:120]


def _subtitle_cache_key(normalized_url: str, lang: str, output_type: str) -> str:
    return f"instagram:{normalized_url}:{lang}:{output_type}"


def _format_rank_for_media(item: dict) -> int:
    ext = str(item.get("ext", "")).lower()
    if ext == "m4a":
        return 0
    if ext == "mp3":
        return 1
    if ext == "webm":
        return 2
    if ext == "mp4":
        return 3
    return 5


def _safe_number(value: object, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _choose_audio_candidate(info: dict) -> Optional[dict]:
    formats = info.get("formats") or []
    if not isinstance(formats, list):
        return None

    audio_only = []
    audio_video = []
    for item in formats:
        if not isinstance(item, dict) or not item.get("url"):
            continue
        acodec = str(item.get("acodec", "none"))
        vcodec = str(item.get("vcodec", "none"))
        if acodec == "none":
            continue
        if vcodec == "none":
            audio_only.append(item)
        else:
            audio_video.append(item)

    def sort_key(item: dict):
        filesize = _safe_number(item.get("filesize") or item.get("filesize_approx"), 0.0)
        bitrate = _safe_number(item.get("abr") or item.get("tbr"), 0.0)
        width = _safe_number(item.get("width"), 0.0)
        height = _safe_number(item.get("height"), 0.0)
        score_size = filesize if filesize > 0 else (bitrate if bitrate > 0 else (width * height if width and height else 1e12))
        return (_format_rank_for_media(item), -score_size)

    if audio_only:
        audio_only.sort(key=sort_key)
        return {"kind": "audio_only", "format": audio_only[0]}

    if audio_video:
        audio_video.sort(key=sort_key)
        return {"kind": "video_with_audio", "format": audio_video[0]}

    return None


def _cookie_header_from_ydlp_cookie(raw_cookie: str) -> str:
    if not raw_cookie:
        return ""
    ignored = {"domain", "path", "expires", "max-age", "samesite", "secure", "httponly"}
    pairs = []
    for token in raw_cookie.split(";"):
        token = token.strip()
        if "=" not in token:
            continue
        key, value = token.split("=", 1)
        key = key.strip()
        if key.lower() in ignored:
            continue
        pairs.append(f"{key}={value.strip()}")
    return "; ".join(pairs)


def _download_media_no_proxy(media_candidate: dict) -> Tuple[bytes, str]:
    fmt = media_candidate["format"]
    media_url = fmt.get("url")
    if not media_url:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "Audio media URL is unavailable for this instagram video.",
            404,
        )

    headers = dict(fmt.get("http_headers") or {})
    cookie_header = _cookie_header_from_ydlp_cookie(str(fmt.get("cookies") or ""))
    if cookie_header and "Cookie" not in headers:
        headers["Cookie"] = cookie_header

    curl_attempt_details: Optional[dict] = None

    # Prefer curl_cffi with browser impersonation to reduce instagram CDN 403 on direct broadband.
    if curl_requests is not None:
        try:
            response = curl_requests.get(
                media_url,
                headers=headers,
                timeout=45,
                impersonate=INSTAGRAM_IMPERSONATE_TARGET,
                proxies={},
            )
            status_code = getattr(response, "status_code", None)
            if status_code and status_code >= 400:
                raise InstagramTranscriptError(
                    "ASR_MEDIA_UNAVAILABLE",
                    "Failed to download media over direct broadband.",
                    502,
                    {"status_code": status_code, "mode": "direct", "transport": "curl_cffi"},
                )
            media_bytes = response.content or b""
            if len(media_bytes) > ASR_RAW_MAX_BYTES:
                raise InstagramTranscriptError(
                    "ASR_MEDIA_TOO_LARGE",
                    "Media is too large for ASR fallback. Try a shorter clip.",
                    413,
                    {"max_bytes": ASR_RAW_MAX_BYTES},
                )
            if not media_bytes:
                raise InstagramTranscriptError(
                    "ASR_MEDIA_UNAVAILABLE",
                    "Downloaded media is empty.",
                    502,
                    {"mode": "direct", "transport": "curl_cffi"},
                )
            media_ext = str(fmt.get("ext") or "mp4").lower()
            return media_bytes, media_ext
        except InstagramTranscriptError as err:
            curl_attempt_details = err.details or {"transport": "curl_cffi"}
        except Exception as exc:
            curl_attempt_details = {"transport": "curl_cffi", "exception": str(exc)[:200]}
    else:
        curl_attempt_details = {"transport": "curl_cffi", "available": False}

    session = requests.Session()
    session.trust_env = False  # Hard guarantee: media download does not use environment proxies.
    try:
        with session.get(media_url, headers=headers, timeout=45, stream=True) as response:
            response.raise_for_status()

            buffer = io.BytesIO()
            for chunk in response.iter_content(chunk_size=1024 * 128):
                if not chunk:
                    continue
                buffer.write(chunk)
                if buffer.tell() > ASR_RAW_MAX_BYTES:
                    raise InstagramTranscriptError(
                        "ASR_MEDIA_TOO_LARGE",
                        "Media is too large for ASR fallback. Try a shorter clip.",
                        413,
                        {"max_bytes": ASR_RAW_MAX_BYTES},
                    )

            media_bytes = buffer.getvalue()
            if not media_bytes:
                raise InstagramTranscriptError(
                    "ASR_MEDIA_UNAVAILABLE",
                    "Downloaded media is empty.",
                    502,
                )
            media_ext = str(fmt.get("ext") or "mp4").lower()
            return media_bytes, media_ext
    except InstagramTranscriptError:
        raise
    except requests.exceptions.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else None
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "Failed to download media over direct broadband.",
            502,
            {
                "status_code": status_code,
                "mode": "direct",
                "transport": "requests",
                "curl_attempt": curl_attempt_details,
            },
        ) from exc
    except Exception as exc:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "Failed to download media over direct broadband.",
            502,
            {
                "mode": "direct",
                "transport": "requests",
                "curl_attempt": curl_attempt_details,
            },
        ) from exc
    finally:
        session.close()


def _read_downloaded_media_file(temp_dir: str, transport: str) -> Tuple[bytes, str]:
    files = [
        os.path.join(temp_dir, file_name)
        for file_name in os.listdir(temp_dir)
        if os.path.isfile(os.path.join(temp_dir, file_name))
    ]
    if not files:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            f"{transport} fallback produced no media file.",
            502,
            {"transport": transport},
        )

    files.sort(key=lambda path: os.path.getsize(path))
    file_path = files[0]
    file_size = os.path.getsize(file_path)
    if file_size > ASR_RAW_MAX_BYTES:
        raise InstagramTranscriptError(
            "ASR_MEDIA_TOO_LARGE",
            "Media is too large for ASR fallback. Try a shorter clip.",
            413,
            {"max_bytes": ASR_RAW_MAX_BYTES, "transport": transport},
        )

    with open(file_path, "rb") as file_reader:
        media_bytes = file_reader.read()

    if not media_bytes:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            f"{transport} fallback downloaded empty media.",
            502,
            {"transport": transport},
        )
    media_ext = os.path.splitext(file_path)[1].lstrip(".").lower() or "mp4"
    return media_bytes, media_ext


def _download_media_via_ytdlp_no_proxy_once(
    source_url: str,
    format_selector: str,
    use_app_info: bool,
) -> Tuple[bytes, str]:
    with tempfile.TemporaryDirectory(prefix="instagram_media_") as temp_dir:
        outtmpl = os.path.join(temp_dir, "media.%(ext)s")
        opts = _ydl_options(proxy_url=None, use_impersonate=True, use_app_info=use_app_info)
        opts.update(
            {
                "proxy": "",
                "skip_download": False,
                "format": format_selector,
                "noplaylist": True,
                "outtmpl": outtmpl,
            }
        )

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([source_url])
        except Exception as exc:
            raise InstagramTranscriptError(
                "ASR_MEDIA_UNAVAILABLE",
                "yt-dlp no-proxy media fallback failed.",
                502,
                {
                    "transport": "yt_dlp_py",
                    "format_selector": format_selector,
                    "use_app_info": use_app_info,
                    "error": str(exc)[:300],
                },
            ) from exc

        return _read_downloaded_media_file(temp_dir, "yt_dlp_py")


def _download_media_via_ytdlp_no_proxy(info: dict, media_candidate: dict) -> Tuple[bytes, str]:
    source_url = str(info.get("original_url") or info.get("webpage_url") or "").strip()
    format_id = str(media_candidate.get("format", {}).get("format_id") or "").strip()
    if not source_url:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "No valid source URL for yt-dlp no-proxy fallback.",
            502,
            {"transport": "yt_dlp_py"},
        )

    selectors: List[str] = [
        "bestaudio[acodec!=none]/bestaudio/best*[acodec!=none][vcodec=none]/best*[acodec!=none]/best",
        "best*[acodec!=none][vcodec=none]/best*[height<=720][acodec!=none]/best*[acodec!=none]/best",
    ]
    if format_id:
        selectors.append(format_id)
    selectors.append("best")

    last_error: Optional[InstagramTranscriptError] = None
    for selector in selectors:
        for use_app_info in (True, False):
            try:
                return _download_media_via_ytdlp_no_proxy_once(
                    source_url=source_url,
                    format_selector=selector,
                    use_app_info=use_app_info,
                )
            except InstagramTranscriptError as err:
                last_error = err
                continue

    if last_error is not None:
        raise last_error
    raise InstagramTranscriptError(
        "ASR_MEDIA_UNAVAILABLE",
        "yt-dlp no-proxy media fallback failed.",
        502,
        {"transport": "yt_dlp_py"},
    )


def _download_media_via_ytdlp_cli_no_proxy(info: dict, media_candidate: dict) -> Tuple[bytes, str]:
    source_url = str(info.get("original_url") or info.get("webpage_url") or "").strip()
    format_id = str(media_candidate.get("format", {}).get("format_id") or "").strip()
    if not source_url:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "No valid source URL for yt-dlp CLI fallback.",
            502,
            {"transport": "yt_dlp_cli"},
        )

    selectors: List[str] = [
        "bestaudio[acodec!=none]/bestaudio/best*[acodec!=none][vcodec=none]/best*[acodec!=none]/best",
        "best*[acodec!=none][vcodec=none]/best*[height<=720][acodec!=none]/best*[acodec!=none]/best",
    ]
    if format_id:
        selectors.append(format_id)
    selectors.append("best")

    last_error: Optional[InstagramTranscriptError] = None
    for selector in selectors:
        for use_app_info in (True, False):
            with tempfile.TemporaryDirectory(prefix="instagram_media_cli_") as temp_dir:
                output_template = os.path.join(temp_dir, "media.%(ext)s")
                cli_cmd = [
                    "yt-dlp",
                    "--proxy",
                    "",
                    "--impersonate",
                    INSTAGRAM_IMPERSONATE_TARGET,
                    "--no-playlist",
                    "--format",
                    selector,
                    "--output",
                    output_template,
                    source_url,
                ]
                if use_app_info and INSTAGRAM_APP_INFO:
                    cli_cmd.extend(["--extractor-args", f"instagram:app_info={INSTAGRAM_APP_INFO}"])

                try:
                    completed = subprocess.run(
                        cli_cmd,
                        capture_output=True,
                        text=True,
                        timeout=INSTAGRAM_YTDLP_CLI_TIMEOUT_SECONDS,
                        check=False,
                    )
                except FileNotFoundError as exc:
                    raise InstagramTranscriptError(
                        "ASR_MEDIA_UNAVAILABLE",
                        "yt-dlp CLI is not available on server PATH.",
                        502,
                        {"transport": "yt_dlp_cli"},
                    ) from exc
                except Exception as exc:
                    last_error = InstagramTranscriptError(
                        "ASR_MEDIA_UNAVAILABLE",
                        "yt-dlp CLI media fallback failed.",
                        502,
                        {
                            "transport": "yt_dlp_cli",
                            "format_selector": selector,
                            "use_app_info": use_app_info,
                            "error": str(exc)[:300],
                        },
                    )
                    continue

                if completed.returncode != 0:
                    last_error = InstagramTranscriptError(
                        "ASR_MEDIA_UNAVAILABLE",
                        "yt-dlp CLI media fallback failed.",
                        502,
                        {
                            "transport": "yt_dlp_cli",
                            "format_selector": selector,
                            "use_app_info": use_app_info,
                            "returncode": completed.returncode,
                            "stderr_tail": (completed.stderr or "")[-500:],
                        },
                    )
                    continue

                try:
                    return _read_downloaded_media_file(temp_dir, "yt_dlp_cli")
                except InstagramTranscriptError as err:
                    last_error = err
                    continue

    if last_error is not None:
        raise last_error
    raise InstagramTranscriptError(
        "ASR_MEDIA_UNAVAILABLE",
        "yt-dlp CLI media fallback failed.",
        502,
        {"transport": "yt_dlp_cli"},
    )


def _download_media_with_fallback(info: dict, media_candidate: dict) -> Tuple[bytes, str]:
    direct_error: Optional[InstagramTranscriptError] = None
    ytdlp_py_error: Optional[InstagramTranscriptError] = None
    ytdlp_cli_error: Optional[InstagramTranscriptError] = None

    try:
        return _download_media_no_proxy(media_candidate)
    except InstagramTranscriptError as err:
        direct_error = err

    try:
        return _download_media_via_ytdlp_no_proxy(info, media_candidate)
    except InstagramTranscriptError as err:
        ytdlp_py_error = err

    if INSTAGRAM_ENABLE_YTDLP_CLI_FALLBACK:
        try:
            return _download_media_via_ytdlp_cli_no_proxy(info, media_candidate)
        except InstagramTranscriptError as err:
            ytdlp_cli_error = err

    raise InstagramTranscriptError(
        "ASR_MEDIA_UNAVAILABLE",
        "Failed to download media over direct broadband.",
        502,
        {
            "mode": "direct",
            "transport": "multi",
            "direct_attempt": direct_error.details if direct_error else None,
            "ytdlp_py_attempt": ytdlp_py_error.details if ytdlp_py_error else None,
            "ytdlp_cli_attempt": ytdlp_cli_error.details if ytdlp_cli_error else None,
        },
    )


def _normalize_media_for_asr(media_bytes: bytes, media_ext: str) -> Tuple[bytes, str]:
    ext = (media_ext or "").strip().lower().lstrip(".")
    if ext in _AUDIO_EXTENSIONS:
        return media_bytes, ext

    if not media_bytes:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "Downloaded media is empty before ASR normalization.",
            502,
        )

    with tempfile.TemporaryDirectory(prefix="instagram_asr_media_") as temp_dir:
        input_ext = ext or "mp4"
        input_path = os.path.join(temp_dir, f"input.{input_ext}")
        output_path = os.path.join(temp_dir, "audio.mp3")

        with open(input_path, "wb") as writer:
            writer.write(media_bytes)

        cmd = [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            input_path,
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-b:a",
            "96k",
            output_path,
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=ASR_FFMPEG_TIMEOUT_SECONDS,
                check=False,
            )
        except FileNotFoundError as exc:
            raise InstagramTranscriptError(
                "ASR_MEDIA_UNAVAILABLE",
                "ffmpeg is not installed on server. Cannot normalize media for ASR.",
                502,
                {"transport": "ffmpeg", "input_ext": ext},
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise InstagramTranscriptError(
                "ASR_MEDIA_UNAVAILABLE",
                "ffmpeg timed out while converting media for ASR.",
                502,
                {"transport": "ffmpeg", "input_ext": ext},
            ) from exc

        if result.returncode != 0:
            raise InstagramTranscriptError(
                "ASR_MEDIA_UNAVAILABLE",
                "Failed to convert media to audio for ASR.",
                502,
                {
                    "transport": "ffmpeg",
                    "input_ext": ext,
                    "stderr_tail": (result.stderr or "")[-500:],
                },
            )

        if not os.path.exists(output_path):
            raise InstagramTranscriptError(
                "ASR_MEDIA_UNAVAILABLE",
                "Audio conversion finished but output file is missing.",
                502,
                {"transport": "ffmpeg", "input_ext": ext},
            )

        output_size = os.path.getsize(output_path)
        if output_size > ASR_MAX_BYTES:
            raise InstagramTranscriptError(
                "ASR_MEDIA_TOO_LARGE",
                "Converted audio is too large for ASR fallback. Try a shorter clip.",
                413,
                {"max_bytes": ASR_MAX_BYTES, "transport": "ffmpeg", "input_ext": ext},
            )

        with open(output_path, "rb") as reader:
            audio_bytes = reader.read()

    if not audio_bytes:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "Converted audio is empty.",
            502,
            {"transport": "ffmpeg", "input_ext": ext},
        )
    return audio_bytes, "mp3"


def _transcribe_media_with_huggingface(
    media_bytes: bytes,
    filename: str,
    media_ext: str,
    requested_lang: str,
) -> Tuple[List[dict], str]:
    hf_token = os.getenv("HF_API_TOKEN", "").strip()
    if not hf_token:
        raise InstagramTranscriptError(
            "ASR_NOT_CONFIGURED",
            "HF_API_TOKEN is not configured. Cannot run HuggingFace ASR fallback.",
            503,
        )

    content_type = _infer_media_content_type(media_ext)
    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": content_type,
    }

    endpoints: List[str] = []
    if ASR_API_URL:
        endpoints.append(ASR_API_URL)
    if ASR_LEGACY_API_URL and ASR_LEGACY_API_URL not in endpoints:
        endpoints.append(ASR_LEGACY_API_URL)

    session = requests.Session()
    session.trust_env = False
    try:
        last_details: Optional[dict] = None

        for endpoint in endpoints:
            try:
                response = session.post(
                    endpoint,
                    headers=headers,
                    data=media_bytes,
                    timeout=ASR_TIMEOUT_SECONDS,
                )
            except Exception as exc:
                last_details = {
                    "provider": "huggingface",
                    "endpoint": endpoint,
                    "error": str(exc)[:500],
                }
                continue

            if response.status_code >= 400:
                last_details = {
                    "provider": "huggingface",
                    "endpoint": endpoint,
                    "status_code": response.status_code,
                    "error": (response.text or "")[:500],
                }
                continue

            try:
                payload = response.json()
            except ValueError:
                raise InstagramTranscriptError(
                    "ASR_FAILED",
                    "HuggingFace ASR returned invalid JSON.",
                    502,
                    {
                        "provider": "huggingface",
                        "endpoint": endpoint,
                        "status_code": response.status_code,
                        "response_preview": (response.text or "")[:500],
                    },
                )

            text = str(
                payload.get("text")
                or payload.get("transcript")
                or payload.get("generated_text")
                or ""
            ).strip()

            raw_segments = payload.get("segments") or payload.get("chunks") or []
            segments: List[dict] = []
            if isinstance(raw_segments, list):
                for item in raw_segments:
                    if not isinstance(item, dict):
                        continue
                    seg_text = str(item.get("text") or item.get("transcript") or "").strip()
                    if not seg_text:
                        continue
                    start_val = item.get("start")
                    end_val = item.get("end")
                    if isinstance(item.get("timestamp"), list) and len(item.get("timestamp")) >= 2:
                        start_val = item.get("timestamp")[0]
                        end_val = item.get("timestamp")[1]
                    segments.append(
                        {
                            "start": round(_safe_number(start_val, 0.0), 3),
                            "end": round(_safe_number(end_val, 0.0), 3),
                            "text": seg_text,
                        }
                    )

            if not segments and text:
                segments = [{"start": 0.0, "end": 0.0, "text": text}]
            if not text and segments:
                text = "\n".join(seg["text"] for seg in segments if seg.get("text"))

            if not text:
                raise InstagramTranscriptError(
                    "ASR_FAILED",
                    "HuggingFace ASR returned empty transcript.",
                    502,
                    {
                        "provider": "huggingface",
                        "endpoint": endpoint,
                        "status_code": response.status_code,
                        "requested_lang": requested_lang,
                    },
                )

            return segments, text

        raise InstagramTranscriptError(
            "ASR_FAILED",
            "HuggingFace ASR request failed.",
            502,
            last_details or {"provider": "huggingface"},
        )
    finally:
        session.close()

def _infer_media_content_type(media_ext: str) -> str:
    ext = (media_ext or "").strip().lower().lstrip(".")
    mapping = {
        "mp3": "audio/mpeg",
        "mpeg": "audio/mpeg",
        "m4a": "audio/m4a",
        "mp4": "video/mp4",
        "wav": "audio/wav",
        "flac": "audio/flac",
        "ogg": "audio/ogg",
        "opus": "audio/ogg",
        "webm": "audio/webm",
        "aac": "audio/aac",
    }
    return mapping.get(ext, "application/octet-stream")


def _build_media_probe(info: dict) -> dict:
    candidate = _choose_audio_candidate(info)
    if not candidate:
        return {
            "audio_only_available": False,
            "direct_download_candidate": None,
        }

    fmt = candidate["format"]
    return {
        "audio_only_available": candidate["kind"] == "audio_only",
        "direct_download_candidate": {
            "kind": candidate["kind"],
            "ext": fmt.get("ext"),
            "format_id": fmt.get("format_id"),
            "filesize": fmt.get("filesize") or fmt.get("filesize_approx"),
            "tbr": fmt.get("tbr"),
            "abr": fmt.get("abr"),
        },
    }


def get_instagram_info_payload(url: str, preferred_lang: Optional[str] = None) -> dict:
    normalized_url = normalize_instagram_url(url)
    info = _extract_info(normalized_url)
    languages = _collect_languages(info)
    available_codes = [item["code"] for item in languages]

    default_lang = ""
    fallback_order: List[str] = []
    if languages:
        default_lang, fallback_order = _resolve_language(preferred_lang, available_codes)
    elif preferred_lang:
        fallback_order = [preferred_lang]

    return {
        "ok": True,
        "platform": "instagram",
        "video": {
            "id": info.get("id"),
            "title": info.get("title"),
            "thumbnail": info.get("thumbnail"),
            "duration": info.get("duration"),
            "uploader": info.get("uploader"),
        },
        "subtitle": {
            "available": len(languages) > 0,
            "languages": languages,
            "default_lang": default_lang,
            "fallback_order": fallback_order,
        },
        "media_probe": _build_media_probe(info),
    }


def _build_raw_bundle(info: dict, requested_lang: Optional[str]) -> Optional[dict]:
    languages = _collect_languages(info)
    available_codes = [item["code"] for item in languages]
    if not available_codes:
        return None

    lang_used, fallback_order = _resolve_language(requested_lang, available_codes)
    subtitle_url, ext = _pick_subtitle_track(info, lang_used)
    raw_text = _download_subtitle_text(subtitle_url)
    if not raw_text.strip():
        return None

    segments = _parse_vtt_or_srt_to_segments(raw_text)
    full_text = "\n".join(seg["text"] for seg in segments if seg.get("text"))

    return {
        "title": info.get("title") or "instagram_transcript",
        "thumbnail": info.get("thumbnail"),
        "lang_used": lang_used,
        "fallback_order": fallback_order,
        "segments": segments,
        "full_text": full_text,
        "raw_text": raw_text,
        "ext": ext,
        "source": "raw",
    }


def _build_asr_bundle(info: dict, requested_lang: Optional[str]) -> dict:
    candidate = _choose_audio_candidate(info)
    if not candidate:
        raise InstagramTranscriptError(
            "ASR_MEDIA_UNAVAILABLE",
            "No media format with audio is available for ASR fallback.",
            404,
        )

    media_bytes, media_ext = _download_media_with_fallback(info, candidate)
    media_bytes, media_ext = _normalize_media_for_asr(media_bytes, media_ext)
    file_name = f"{_sanitize_filename(str(info.get('id') or 'instagram'))}.{media_ext}"
    asr_provider = "huggingface"
    requested = (requested_lang or "en").strip() or "en"

    transcript_available = True
    asr_error: Optional[dict] = None
    try:
        segments, full_text = _transcribe_media_with_huggingface(media_bytes, file_name, media_ext, requested)
    except Exception as exc:
        transcript_available = False
        segments = [{"start": 0.0, "end": 0.0, "text": "Audio extracted successfully. Transcription failed."}]
        full_text = "Audio extracted successfully. Transcription failed."

        if isinstance(exc, InstagramTranscriptError):
            asr_error = {"code": exc.code, "message": exc.message}
            if getattr(exc, "details", None) is not None:
                asr_error["details"] = exc.details
        else:
            asr_error = {"code": "ASR_FAILED", "message": "Transcription failed after audio extraction."}

    return {
        "title": info.get("title") or "instagram_transcript",
        "thumbnail": info.get("thumbnail"),
        "lang_used": requested,
        "fallback_order": [requested],
        "segments": segments,
        "full_text": full_text,
        "raw_text": "",
        "ext": "txt",
        "source": "asr" if transcript_available else "audio_extracted",
        "asr_provider": asr_provider,
        "transcript_available": transcript_available,
        "asr_error": asr_error,
    }


def _build_content_bundle(normalized_url: str, requested_lang: Optional[str]) -> dict:
    info = _extract_info(normalized_url)

    raw_bundle = _build_raw_bundle(info, requested_lang)
    if raw_bundle is not None:
        return raw_bundle

    try:
        return _build_asr_bundle(info, requested_lang)
    except InstagramTranscriptError as first_err:
        if first_err.code != "ASR_MEDIA_UNAVAILABLE":
            raise

        # Signed media URLs can expire quickly; refresh metadata and retry once.
        refreshed_info = _extract_info(normalized_url, force_refresh=True)
        refreshed_raw = _build_raw_bundle(refreshed_info, requested_lang)
        if refreshed_raw is not None:
            return refreshed_raw

        try:
            return _build_asr_bundle(refreshed_info, requested_lang)
        except InstagramTranscriptError as second_err:
            if second_err.code == "ASR_MEDIA_UNAVAILABLE":
                raise InstagramTranscriptError(
                    "ASR_MEDIA_UNAVAILABLE",
                    "Failed to download media over direct broadband after one refresh retry.",
                    502,
                    {
                        "first_attempt": first_err.details,
                        "second_attempt": second_err.details,
                    },
                ) from second_err
            raise


def get_instagram_content_payload(url: str, lang: Optional[str] = None) -> dict:
    normalized_url = normalize_instagram_url(url)
    requested_lang = (lang or "en").strip() or "en"
    cache_key = _subtitle_cache_key(normalized_url, requested_lang, "content")
    cached = _cache_get(_instagram_subtitle_cache, cache_key, SUBTITLE_CACHE_TTL)
    if cached is not None:
        return cached

    bundle = _build_content_bundle(normalized_url, requested_lang)
    full_text = bundle["full_text"]
    payload = {
        "ok": True,
        "platform": "instagram",
        "lang_used": bundle["lang_used"],
        "source": bundle["source"],
        "asr_provider": bundle.get("asr_provider"),
        "transcript_available": bundle.get("transcript_available", True),
        "asr_error": bundle.get("asr_error"),
        "video": {
            "title": bundle["title"],
            "thumbnail": bundle["thumbnail"],
        },
        "content": {
            "segments": bundle["segments"],
            "full_text": full_text,
            "line_count": len([line for line in full_text.split("\n") if line.strip()]),
            "char_count": len(full_text),
        },
    }
    _cache_set(_instagram_subtitle_cache, cache_key, payload)
    return payload


def get_instagram_download_payload(url: str, lang: Optional[str], output_type: str) -> Tuple[bytes, str, str]:
    normalized_url = normalize_instagram_url(url)
    requested_lang = (lang or "en").strip() or "en"
    dl_type = (output_type or "srt").strip().lower()
    if dl_type not in {"srt", "txt", "vtt"}:
        raise InstagramTranscriptError(
            "INVALID_URL",
            "Download type must be one of: srt, txt, vtt.",
            400,
        )

    cache_key = _subtitle_cache_key(normalized_url, requested_lang, dl_type)
    cached = _cache_get(_instagram_subtitle_cache, cache_key, SUBTITLE_CACHE_TTL)
    if cached is not None:
        return cached["binary"], cached["mimetype"], cached["filename"]

    bundle = _build_content_bundle(normalized_url, requested_lang)
    segments = bundle["segments"]

    if dl_type == "txt":
        data_text = bundle["full_text"]
        mimetype = "text/plain; charset=utf-8"
    elif dl_type == "vtt":
        data_text = _segments_to_vtt(segments)
        mimetype = "text/vtt; charset=utf-8"
    else:
        data_text = _segments_to_srt(segments)
        mimetype = "application/x-subrip; charset=utf-8"

    safe_title = _sanitize_filename(bundle["title"])
    filename = f"{safe_title}.{bundle['lang_used']}.{dl_type}"
    binary = data_text.encode("utf-8")
    _cache_set(
        _instagram_subtitle_cache,
        cache_key,
        {"binary": binary, "mimetype": mimetype, "filename": filename},
    )
    return binary, mimetype, filename


def get_instagram_thumbnail_binary(raw_url: str) -> Tuple[bytes, str]:
    if not isinstance(raw_url, str) or not raw_url.strip():
        raise InstagramTranscriptError(
            "INVALID_URL",
            "A valid thumbnail URL is required.",
            400,
        )

    candidate = raw_url.strip()
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise InstagramTranscriptError(
            "INVALID_URL",
            "Invalid thumbnail URL format.",
            400,
        )

    host = parsed.netloc.split(":")[0].lower()
    if ("instagram" not in host) and ("fbcdn" not in host):
        raise InstagramTranscriptError(
            "UNSUPPORTED_PLATFORM",
            "Unsupported thumbnail host.",
            400,
        )

    session = requests.Session()
    session.trust_env = False
    try:
        response = session.get(
            candidate,
            timeout=20,
            allow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/140.0.0.0 Safari/537.36"
                ),
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                "Referer": "https://www.instagram.com/",
            },
        )
        if response.status_code >= 400:
            raise InstagramTranscriptError(
                "VIDEO_UNAVAILABLE",
                "Thumbnail image is unavailable.",
                404,
                {"status_code": response.status_code},
            )

        content = response.content or b""
        if not content:
            raise InstagramTranscriptError(
                "VIDEO_UNAVAILABLE",
                "Thumbnail image is empty.",
                404,
            )

        mime = (response.headers.get("content-type") or "image/jpeg").split(";")[0].strip()
        return content, mime
    except InstagramTranscriptError:
        raise
    except Exception as exc:
        raise InstagramTranscriptError(
            "VIDEO_UNAVAILABLE",
            "Failed to fetch thumbnail image.",
            404,
            {"error": str(exc)[:200]},
        ) from exc
    finally:
        session.close()


def build_internal_error() -> InstagramTranscriptError:
    return InstagramTranscriptError(
        "INTERNAL_ERROR",
        "Unexpected server error while processing instagram transcript request.",
        500,
    )




