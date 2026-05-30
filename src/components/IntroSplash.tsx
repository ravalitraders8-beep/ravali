"use client";

import Image from "next/image";
import { LOGO_PATH, SHOP_NAME } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { userMotivation } from "@/lib/motivation";
import { useLang } from "@/context/LangContext";

/** Opening screen — big logo + motivational quote (replaces white spinner) */
export function IntroSplash() {
  const { lang } = useLang();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="intro-logo-wrap flex flex-col items-center">
        <Image
          src={LOGO_PATH}
          alt={SHOP_NAME}
          width={320}
          height={320}
          priority
          className="intro-logo h-auto w-[min(72vw,280px)] max-w-[280px] object-contain sm:w-[300px]"
        />
        <p className="intro-quote mt-8 max-w-sm text-center text-xl font-black leading-snug text-[#1a2744] sm:text-2xl">
          {t(lang, userMotivation.quote.en, userMotivation.quote.te)}
        </p>
        <p className="intro-tag mt-3 text-center text-base font-bold text-[#e85d00]">
          {t(lang, userMotivation.tagline.en, userMotivation.tagline.te)}
        </p>
      </div>
    </div>
  );
}
