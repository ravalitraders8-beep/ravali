"use client";

import Image from "next/image";
import { getCategoryWatermarkLines } from "@/lib/category-about";
import { LOGO_EN_PATH, LOGO_TE_PATH } from "@/lib/constants";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

type HelpPanelBackgroundProps = {
  category?: Category;
};

/** Language-specific logo watermark behind help panel */
export function HelpPanelBackground({ category }: HelpPanelBackgroundProps) {
  const { lang } = useLang();
  const lines = category ? getCategoryWatermarkLines(category, lang) : [];
  const logoSrc = lang === "te" ? LOGO_TE_PATH : LOGO_EN_PATH;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <Image
        src={logoSrc}
        alt=""
        width={480}
        height={560}
        className="absolute left-1/2 top-1/2 w-[min(95%,340px)] max-w-none -translate-x-1/2 -translate-y-[42%] opacity-[0.38]"
      />

      <Image
        src={logoSrc}
        alt=""
        width={420}
        height={490}
        className="absolute -bottom-[5%] left-1/2 w-[min(90%,300px)] -translate-x-1/2 opacity-[0.24]"
      />

      {lines.length > 0 && (
        <div className="absolute right-2 top-[32%] max-w-[45%] space-y-3 opacity-[0.18]">
          {lines.map((line) => (
            <p
              key={line}
              className="text-right font-black leading-tight text-[#1a2744]"
              style={{ fontSize: line.length > 20 ? "1.05rem" : "1.25rem" }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/62 to-white/78" />
    </div>
  );
}
