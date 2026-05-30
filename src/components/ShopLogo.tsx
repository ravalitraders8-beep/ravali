"use client";

import Image from "next/image";
import Link from "next/link";
import { LOGO_MARK_PATH, LOGO_PATH, SHOP_NAME } from "@/lib/constants";

const SIZES = {
  sm: { width: 120, height: 60, className: "h-10 w-auto sm:h-11" },
  md: { width: 180, height: 90, className: "h-16 w-auto" },
  lg: { width: 240, height: 120, className: "h-24 w-auto" },
  xl: { width: 320, height: 160, className: "h-28 w-auto max-w-[85vw] sm:h-32" },
} as const;

type ShopLogoProps = {
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
  /** Use on navy/dark headers — transparent logo, no white box */
  onDark?: boolean;
  /** Explicit link — overrides home */
  href?: string;
  /** Auto home link: user → / (scan or dashboard), admin → /admin */
  home?: "user" | "admin" | false;
  /** In-app action instead of navigation (e.g. admin overview tab) */
  onLogoClick?: () => void;
};

export function ShopLogo({
  size = "md",
  className = "",
  priority = false,
  onDark = false,
  href,
  home = "user",
  onLogoClick,
}: ShopLogoProps) {
  const s = SIZES[size];

  const image = (
    <Image
      src={onDark ? LOGO_MARK_PATH : LOGO_PATH}
      alt={SHOP_NAME}
      width={s.width}
      height={s.height}
      priority={priority}
      className={`object-contain ${onDark ? "" : "bg-white"} ${s.className} ${className}`}
    />
  );

  const wrapClass = "inline-flex shrink-0 rounded-lg transition-opacity hover:opacity-90 active:opacity-80";

  if (onLogoClick) {
    return (
      <button
        type="button"
        onClick={onLogoClick}
        className={wrapClass}
        aria-label={SHOP_NAME}
      >
        {image}
      </button>
    );
  }

  const target = href ?? (home === "admin" ? "/admin" : home === "user" ? "/" : undefined);

  if (target) {
    return (
      <Link href={target} className={wrapClass} aria-label={SHOP_NAME}>
        {image}
      </Link>
    );
  }

  return image;
}
