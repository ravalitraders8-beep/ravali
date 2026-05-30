"use client";

import { AboutUsBackground } from "./AboutUsBackground";
import { SideHelpButton } from "./SideHelpButton";
import { LangToggle } from "@/context/LangContext";
import type { Category } from "@/lib/types";

type UserPageExtrasProps = {
  helpBottomOffset?: string;
  showLangToggle?: boolean;
  category?: Category;
};

export function UserPageExtras({
  helpBottomOffset = "bottom-24",
  showLangToggle = true,
  category,
}: UserPageExtrasProps) {
  return (
    <>
      <AboutUsBackground category={category} />
      <SideHelpButton bottomOffset={helpBottomOffset} category={category} />
      {/* Desktop only — mobile lang toggle lives in page header (centered, away from logo) */}
      {showLangToggle && (
        <div className="fixed right-3 top-3 z-50 hidden sm:block sm:right-4 sm:top-4">
          <LangToggle />
        </div>
      )}
    </>
  );
}

/** Centered language switch for mobile headers (below top edge, above logo) */
export function MobileHeaderLangToggle() {
  return (
    <div className="mb-3 flex justify-center sm:hidden">
      <LangToggle onDark />
    </div>
  );
}
