import { getTranscriptBackendBaseUrl } from "@/lib/transcript-backend";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get("task_id");
        if (!taskId) {
            return Response.json({ ok: false, error: "Missing task_id" }, { status: 400 });
        }

        const baseUrl = getTranscriptBackendBaseUrl();
        const authHeader = request.headers.get("authorization");

        const upstream = await fetch(`${baseUrl}/api/instagram/transcript/task-status?task_id=${taskId}`, {
            method: "GET",
            headers: {
                ...(authHeader ? { authorization: authHeader } : {}),
            },
            cache: "no-store",
        });

        const text = await upstream.text();
        const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";

        return new Response(text, {
            status: upstream.status,
            headers: {
                "content-type": contentType,
            },
        });
    } catch {
        return Response.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Task status service is unavailable." } }, { status: 502 });
    }
}
