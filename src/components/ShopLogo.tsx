import Image from "next/image";
import { LOGO_PATH, SHOP_NAME } from "@/lib/constants";

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
};

export function ShopLogo({ size = "md", className = "", priority = false }: ShopLogoProps) {
  const s = SIZES[size];

  return (
    <Image
      src={LOGO_PATH}
      alt={SHOP_NAME}
      width={s.width}
      height={s.height}
      priority={priority}
      className={`object-contain ${s.className} ${className}`}
    />
  );
}
