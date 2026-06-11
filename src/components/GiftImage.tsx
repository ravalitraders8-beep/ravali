"use client";

import Image from "next/image";

interface GiftImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/** Local /public paths use Next Image; pasted http(s) URLs use native img */
export function GiftImage({ src, alt, width, height, className }: GiftImageProps) {
  const trimmed = src?.trim() || "/gifts/mason-tv.jpg";
  const external = /^https?:\/\//i.test(trimmed);

  if (external) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmed}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
