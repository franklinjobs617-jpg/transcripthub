export type KieTranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

type KieWordToken = {
  start?: unknown;
  end?: unknown;
  text?: unknown;
  type?: unknown;
};

type KieResultObject = {
  language_code?: unknown;
  text?: unknown;
  words?: unknown;
};

type KieResultPayload = {
  resultObject?: KieResultObject;
};

export type ParsedKieTranscript = {
  languageCode?: string;
  transcriptText: string;
  segments: KieTranscriptSegment[];
};

function parseNumber(value: unknown): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

function cleanSegmentText(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;!?，。！？；：])/g, "$1")
    .replace(/([([{（【])\s+/g, "$1")
    .replace(/\s+([)\]}）】])/g, "$1")
    .trim();
}

function buildSegmentsFromWords(words: KieWordToken[]): KieTranscriptSegment[] {
  if (!words.length) return [];

  const segments: KieTranscriptSegment[] = [];
  let currentText = "";
  let currentStart: number | null = null;
  let currentEnd: number | null = null;

  const flush = () => {
    const text = cleanSegmentText(currentText);
    if (!text) {
      currentText = "";
      currentStart = null;
      currentEnd = null;
      return;
    }

    const safeStart = currentStart ?? 0;
    const safeEnd =
      currentEnd !== null && currentEnd > safeStart ? currentEnd : safeStart;

    segments.push({
      start: Math.max(0, safeStart),
      end: Math.max(0, safeEnd),
      text,
    });

    currentText = "";
    currentStart = null;
    currentEnd = null;
  };

  for (let index = 0; index < words.length; index += 1) {
    const token = words[index];
    const tokenText = String(token.text ?? "");
    const tokenType = String(token.type ?? "word").trim().toLowerCase();
    const tokenStart = parseNumber(token.start);
    const tokenEnd = parseNumber(token.end);

    if (currentStart === null && tokenStart !== null) {
      currentStart = tokenStart;
    }
    if (tokenEnd !== null) {
      currentEnd = tokenEnd;
    } else if (tokenStart !== null) {
      currentEnd = Math.max(currentEnd ?? tokenStart, tokenStart);
    }

    if (tokenType === "spacing") {
      currentText += tokenText || " ";
    } else {
      currentText += tokenText;
    }

    const nextToken = words[index + 1];
    const nextStart = parseNumber(nextToken?.start);
    const sentenceBoundary = /[.!?。！？]\s*$/.test(currentText);
    const longGap =
      currentEnd !== null &&
      nextStart !== null &&
      nextStart - currentEnd >= 1.0;
    const overLength = currentText.length >= 140;
    const sentenceReady =
      sentenceBoundary && cleanSegmentText(currentText).length >= 28;

    if (longGap || overLength || sentenceReady) {
      flush();
    }
  }

  flush();
  return segments;
}

function extractResultObject(rawResult: unknown): KieResultObject {
  const payload = rawResult as KieResultPayload | undefined;
  return payload?.resultObject || {};
}

export function parseKieTranscriptResult(
  rawResult: unknown,
  transcriptTextRaw?: string | null
): ParsedKieTranscript {
  const resultObject = extractResultObject(rawResult);
  const words = Array.isArray(resultObject.words)
    ? (resultObject.words as KieWordToken[])
    : [];

  const segments = buildSegmentsFromWords(words);
  const fallbackText = String(transcriptTextRaw || resultObject.text || "").trim();
  const transcriptText =
    fallbackText || segments.map((item) => item.text).join(" ").trim();
  const languageCodeRaw = resultObject.language_code;
  const languageCode =
    typeof languageCodeRaw === "string" ? languageCodeRaw.trim() : undefined;

  return {
    languageCode,
    transcriptText,
    segments,
  };
}
