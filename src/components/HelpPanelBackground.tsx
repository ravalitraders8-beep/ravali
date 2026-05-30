"use client";

import Image from "next/image";
import { getCategoryWatermarkLines } from "@/lib/category-about";
import { LOGO_PATH } from "@/lib/constants";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

type HelpPanelBackgroundProps = {
  category?: Category;
};

/** Visible logo + trade text watermark behind help panel */
export function HelpPanelBackground({ category }: HelpPanelBackgroundProps) {
  const { lang } = useLang();
  const lines = category ? getCategoryWatermarkLines(category, lang) : [];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Main logo — thicker / more visible */}
      <Image
        src={LOGO_PATH}
        alt=""
        width={400}
        height={400}
        className="absolute left-1/2 top-[6%] w-[min(92%,320px)] -translate-x-1/2 opacity-[0.28]"
      />

      {/* Second logo lower — fills bottom area */}
      <Image
        src={LOGO_PATH}
        alt=""
        width={360}
        height={360}
        className="absolute -bottom-[8%] left-1/2 w-[min(88%,300px)] -translate-x-1/2 opacity-[0.22]"
      />

      {lines.length > 0 && (
        <div className="absolute right-2 top-[38%] max-w-[48%] space-y-3 opacity-[0.2]">
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

      {/* Light scrim so text stays readable — not too heavy */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff8f0]/55 via-[#fff8f0]/72 to-[#fff8f0]/88" />
    </div>
  );
}
