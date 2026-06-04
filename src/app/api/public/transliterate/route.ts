import { NextResponse } from "next/server";
import { isGoogleTranslateConfigured } from "@/lib/google-translate";
import { sanitizeTeluguOutput, toTeluguAccurate } from "@/lib/transliterate";

export async function POST(request: Request) {
  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const text = String(body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({
      telugu: "",
      english: "",
      source: "local",
      googleConfigured: isGoogleTranslateConfigured(),
    });
  }

  const { telugu, source } = await toTeluguAccurate(text);

  return NextResponse.json({
    english: text,
    telugu: sanitizeTeluguOutput(telugu),
    source,
    googleConfigured: isGoogleTranslateConfigured(),
  });
}
