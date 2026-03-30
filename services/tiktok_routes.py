import io
import json
import logging
from urllib.parse import urlparse

from flask import Blueprint, jsonify, request, send_file

from services.tiktok_transcript_service import (
    TikTokTranscriptError,
    build_internal_error,
    get_tiktok_content_payload,
    get_tiktok_download_payload,
    get_tiktok_info_payload,
)


tiktok_transcript_bp = Blueprint("tiktok_transcript", __name__, url_prefix="/api/tiktok/transcript")
logger = logging.getLogger("tiktok_transcript")
_MAX_LOG_CHARS = 8000


def _truncate_log_text(value: str, max_chars: int = _MAX_LOG_CHARS) -> str:
    text = value or ""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "...(truncated)"


def _safe_host(url_value: str) -> str:
    return (urlparse(url_value or "").hostname or "").lower()


def _log_info_debug(payload: dict) -> None:
    video = payload.get("video") or {}
    debug_steps = payload.get("debug_steps") or []
    direct_url = str(video.get("direct_media_url") or "")
    summary = {
        "direct_media_source": video.get("direct_media_source"),
        "direct_media_format_id": video.get("direct_media_format_id"),
        "direct_media_host": _safe_host(direct_url),
        "direct_media_url": direct_url,
        "worker_media_url": video.get("worker_media_url"),
        "debug_steps_count": len(debug_steps) if isinstance(debug_steps, list) else 0,
    }
    logger.warning("TikTok /info summary: %s", _truncate_log_text(json.dumps(summary, ensure_ascii=False)))
    if isinstance(debug_steps, list):
        logger.warning(
            "TikTok /info debug_steps: %s",
            _truncate_log_text(json.dumps(debug_steps, ensure_ascii=False)),
        )


def _log_content_debug(payload: dict) -> None:
    debug_steps = payload.get("debug_steps") or []
    asr_error = payload.get("asr_error")
    summary = {
        "source": payload.get("source"),
        "asr_provider": payload.get("asr_provider"),
        "transcript_available": payload.get("transcript_available"),
        "asr_error": asr_error,
        "debug_steps_count": len(debug_steps) if isinstance(debug_steps, list) else 0,
    }
    logger.warning("TikTok /content summary: %s", _truncate_log_text(json.dumps(summary, ensure_ascii=False)))
    if isinstance(debug_steps, list):
        logger.warning(
            "TikTok /content debug_steps: %s",
            _truncate_log_text(json.dumps(debug_steps, ensure_ascii=False)),
        )


def _error_response(err: TikTokTranscriptError):
    payload = err.to_payload()
    logger.warning(
        "TikTok transcript error: code=%s status=%s message=%s details=%s",
        err.code,
        err.status_code,
        err.message,
        err.details,
    )
    response = jsonify(payload)
    response.status_code = err.status_code
    response.headers["X-TikTok-Error-Code"] = err.code
    return response


@tiktok_transcript_bp.route("/info", methods=["POST"])
def tiktok_transcript_info():
    try:
        data = request.get_json(silent=True) or {}
        payload = get_tiktok_info_payload(
            url=data.get("url", ""),
            preferred_lang=data.get("preferred_lang"),
        )
        _log_info_debug(payload)
        return jsonify(payload)
    except TikTokTranscriptError as err:
        return _error_response(err)
    except Exception as exc:
        logger.exception("Unexpected error in /info: %s", exc)
        return _error_response(build_internal_error())


@tiktok_transcript_bp.route("/content", methods=["POST"])
def tiktok_transcript_content():
    try:
        data = request.get_json(silent=True) or {}
        payload = get_tiktok_content_payload(
            url=data.get("url", ""),
            lang=data.get("lang"),
        )
        _log_content_debug(payload)
        return jsonify(payload)
    except TikTokTranscriptError as err:
        return _error_response(err)
    except Exception as exc:
        logger.exception("Unexpected error in /content: %s", exc)
        return _error_response(build_internal_error())


@tiktok_transcript_bp.route("/download", methods=["GET"])
def tiktok_transcript_download():
    try:
        url = request.args.get("url", "")
        lang = request.args.get("lang", "en")
        dl_type = request.args.get("type", "srt")

        binary, mimetype, filename = get_tiktok_download_payload(url, lang, dl_type)
        return send_file(
            io.BytesIO(binary),
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename,
        )
    except TikTokTranscriptError as err:
        return _error_response(err)
    except Exception as exc:
        logger.exception("Unexpected error in /download: %s", exc)
        return _error_response(build_internal_error())
