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
      {showLangToggle && (
        <div className="fixed left-3 top-3 z-50 sm:left-4 sm:top-4">
          <LangToggle />
        </div>
      )}
    </>
  );
}
