import { englishToTelugu } from "./transliterate";

let inflight: AbortController | null = null;

export type TransliterateResult = {
  telugu: string;
  source: "google" | "local";
};

/** Backend uses Google Translate when configured; local fallback if offline */
export async function transliterateToTelugu(text: string): Promise<TransliterateResult> {
  const trimmed = text.trim();
  if (!trimmed) return { telugu: "", source: "local" };

  if (inflight) inflight.abort();
  inflight = new AbortController();

  try {
    const res = await fetch("/api/public/transliterate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal: inflight.signal,
    });
    const data = (await res.json()) as {
      telugu?: string;
      source?: "google" | "local";
    };
    if (res.ok && data.telugu) {
      return {
        telugu: data.telugu,
        source: data.source === "google" ? "google" : "local",
      };
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { telugu: englishToTelugu(trimmed), source: "local" };
    }
  }

  return { telugu: englishToTelugu(trimmed), source: "local" };
}
