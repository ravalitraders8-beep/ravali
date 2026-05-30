"use client";

import Image from "next/image";
import { LOGO_PATH } from "@/lib/constants";

/** Faint main logo behind the help panel content */
export function HelpPanelBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <Image
        src={LOGO_PATH}
        alt=""
        width={360}
        height={360}
        className="absolute left-1/2 top-[10%] w-[min(85%,280px)] -translate-x-1/2 opacity-[0.09]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff8f0]/40 via-[#fff8f0]/75 to-[#fff8f0]/95" />
    </div>
  );
}
