import {
  getGoogleTranslateApiKey,
  isGoogleTranslateConfigured,
} from "@/lib/env";

export { isGoogleTranslateConfigured };

const TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

/**
 * Google Cloud Translation API — English → Telugu (same engine as translate.google.com).
 * Requires GOOGLE_TRANSLATE_API_KEY in .env (enable Cloud Translation API in Google Cloud).
 */
export async function translateEnglishToTeluguGoogle(
  text: string
): Promise<string | null> {
  const apiKey = getGoogleTranslateApiKey();
  if (!apiKey || !text.trim()) return null;

  try {
    const res = await fetch(`${TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text.trim(),
        source: "en",
        target: "te",
        format: "text",
      }),
      cache: "no-store",
    });

    const data = (await res.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> };
      error?: { message?: string };
    };

    if (!res.ok) {
      console.error("[google-translate]", data.error?.message ?? res.status);
      return null;
    }

    const translated = data.data?.translations?.[0]?.translatedText?.trim();
    if (!translated) return null;

    return translated;
  } catch (e) {
    console.error("[google-translate]", e);
    return null;
  }
}
