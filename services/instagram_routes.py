import io
import logging

from flask import Blueprint, jsonify, request, send_file

from services.instagram_transcript_service import (
    InstagramTranscriptError,
    build_internal_error,
    get_instagram_content_payload,
    get_instagram_download_payload,
    get_instagram_info_payload,
    get_instagram_thumbnail_binary,
)


instagram_transcript_bp = Blueprint("instagram_transcript", __name__, url_prefix="/api/instagram/transcript")
logger = logging.getLogger("instagram_transcript")


def _error_response(err: InstagramTranscriptError):
    payload = err.to_payload()
    logger.warning(
        "Instagram transcript error: code=%s status=%s message=%s details=%s",
        err.code,
        err.status_code,
        err.message,
        err.details,
    )
    response = jsonify(payload)
    response.status_code = err.status_code
    response.headers["X-Instagram-Error-Code"] = err.code
    return response


@instagram_transcript_bp.route("/info", methods=["POST"])
def instagram_transcript_info():
    try:
        data = request.get_json(silent=True) or {}
        payload = get_instagram_info_payload(
            url=data.get("url", ""),
            preferred_lang=data.get("preferred_lang"),
        )
        return jsonify(payload)
    except InstagramTranscriptError as err:
        return _error_response(err)
    except Exception as exc:
        logger.exception("Unexpected error in /info: %s", exc)
        return _error_response(build_internal_error())


@instagram_transcript_bp.route("/content", methods=["POST"])
def instagram_transcript_content():
    try:
        data = request.get_json(silent=True) or {}
        payload = get_instagram_content_payload(
            url=data.get("url", ""),
            lang=data.get("lang"),
        )
        return jsonify(payload)
    except InstagramTranscriptError as err:
        return _error_response(err)
    except Exception as exc:
        logger.exception("Unexpected error in /content: %s", exc)
        return _error_response(build_internal_error())


@instagram_transcript_bp.route("/download", methods=["GET"])
def instagram_transcript_download():
    try:
        url = request.args.get("url", "")
        lang = request.args.get("lang", "en")
        dl_type = request.args.get("type", "srt")

        binary, mimetype, filename = get_instagram_download_payload(url, lang, dl_type)
        return send_file(
            io.BytesIO(binary),
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename,
        )
    except InstagramTranscriptError as err:
        return _error_response(err)
    except Exception as exc:
        logger.exception("Unexpected error in /download: %s", exc)
        return _error_response(build_internal_error())


@instagram_transcript_bp.route("/thumbnail", methods=["GET"])
def instagram_transcript_thumbnail():
    try:
        url = request.args.get("url", "")
        binary, mimetype = get_instagram_thumbnail_binary(url)
        response = send_file(io.BytesIO(binary), mimetype=mimetype)
        response.headers["Cache-Control"] = "public, max-age=300"
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        return response
    except InstagramTranscriptError as err:
        return _error_response(err)
    except Exception as exc:
        logger.exception("Unexpected error in /thumbnail: %s", exc)
        return _error_response(build_internal_error())

