"use client";

import Image from "next/image";
import Link from "next/link";
import { LOGO_PATH, SHOP_NAME } from "@/lib/constants";

const SIZES = {
  sm: { width: 120, height: 60, className: "h-10 w-auto sm:h-11" },
  md: { width: 180, height: 90, className: "h-16 w-auto" },
  lg: { width: 240, height: 120, className: "h-24 w-auto" },
  xl: { width: 320, height: 160, className: "h-28 w-auto max-w-[85vw] sm:h-32" },
} as const;

const DARK_SIZES = {
  sm: "h-9 w-auto",
  md: "h-14 w-auto",
  lg: "h-20 w-auto",
  xl: "h-24 w-auto max-w-[85vw] sm:h-28",
} as const;

type ShopLogoProps = {
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
  /** Navy/dark headers — full logo on white pill for contrast */
  onDark?: boolean;
  href?: string;
  home?: "user" | "admin" | false;
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
      src={LOGO_PATH}
      alt={SHOP_NAME}
      width={s.width}
      height={s.height}
      priority={priority}
      className={`object-contain ${onDark ? DARK_SIZES[size] : `bg-white ${s.className}`} ${className}`}
    />
  );

  const content = onDark ? (
    <span className="inline-flex items-center justify-center rounded-xl bg-white px-2 py-1 shadow-md">
      {image}
    </span>
  ) : (
    image
  );

  const wrapClass =
    "inline-flex shrink-0 rounded-xl transition-opacity hover:opacity-90 active:opacity-80";

  if (onLogoClick) {
    return (
      <button type="button" onClick={onLogoClick} className={wrapClass} aria-label={SHOP_NAME}>
        {content}
      </button>
    );
  }

  const target = href ?? (home === "admin" ? "/admin" : home === "user" ? "/" : undefined);

  if (target) {
    return (
      <Link href={target} className={wrapClass} aria-label={SHOP_NAME}>
        {content}
      </Link>
    );
  }

  return content;
}
