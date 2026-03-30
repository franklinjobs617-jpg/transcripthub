import io
import logging

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
