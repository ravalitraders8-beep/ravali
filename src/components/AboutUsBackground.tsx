"use client";

import Image from "next/image";
import { getCategoryWatermarkLines } from "@/lib/category-about";
import { aboutUsWatermarkLines, aboutUsWatermarkLinesEn } from "@/lib/about-us";
import { LOGO_PATH } from "@/lib/constants";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

type AboutUsBackgroundProps = {
  category?: Category;
};

export function AboutUsBackground({ category }: AboutUsBackgroundProps) {
  const { lang } = useLang();
  const lines = category
    ? getCategoryWatermarkLines(category, lang)
    : lang === "en"
      ? aboutUsWatermarkLinesEn
      : aboutUsWatermarkLines;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <Image
        src={LOGO_PATH}
        alt=""
        width={400}
        height={500}
        className="absolute -right-[12%] top-[8%] w-[min(72vw,320px)] opacity-[0.07]"
      />

      <div className="absolute left-3 top-[32%] max-w-[42%] space-y-4 opacity-[0.055]">
        {lines.map((line) => (
          <p
            key={line}
            className="text-right font-black leading-tight text-[#1a2744]"
            style={{ fontSize: line.length > 22 ? "1rem" : "1.35rem" }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
