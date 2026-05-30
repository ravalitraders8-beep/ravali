"use client";

import Image from "next/image";
import { getCategoryWatermarkLines } from "@/lib/category-about";
import { LOGO_EN_PATH } from "@/lib/constants";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

type HelpPanelBackgroundProps = {
  category?: Category;
};

/** Full RAVALI TRADERS English logo visible behind help panel content */
export function HelpPanelBackground({ category }: HelpPanelBackgroundProps) {
  const { lang } = useLang();
  const lines = category ? getCategoryWatermarkLines(category, lang) : [];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Main English logo — centered, clearly visible */}
      <Image
        src={LOGO_EN_PATH}
        alt=""
        width={480}
        height={560}
        className="absolute left-1/2 top-1/2 w-[min(95%,340px)] max-w-none -translate-x-1/2 -translate-y-[42%] opacity-[0.38]"
      />

      {/* Soft duplicate lower — fills scroll area as user reads */}
      <Image
        src={LOGO_EN_PATH}
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

      {/* Light scrim — keeps text readable while logo stays visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff8f0]/45 via-[#fff8f0]/62 to-[#fff8f0]/78" />
    </div>
  );
}
