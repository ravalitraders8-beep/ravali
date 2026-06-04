import { englishToTelugu } from "./transliterate";

let inflight: AbortController | null = null;

/** Same rules as backend — API first, local fallback if offline */
export async function transliterateToTelugu(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (inflight) inflight.abort();
  inflight = new AbortController();

  try {
    const res = await fetch("/api/public/transliterate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal: inflight.signal,
    });
    const data = (await res.json()) as { telugu?: string };
    if (res.ok && data.telugu) return data.telugu;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return englishToTelugu(trimmed);
    }
  }

  return englishToTelugu(trimmed);
}
