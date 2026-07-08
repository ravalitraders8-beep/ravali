"use client";

import { useEffect, useState } from "react";
import { hasSeenIntroSplash, markIntroSplashSeen } from "@/lib/session";

/** Show intro splash once per tab session; skip on refresh/navigation after that. */
export function useIntroSplash(minMs: number): boolean {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (hasSeenIntroSplash()) {
      setDone(true);
      return;
    }
    const id = window.setTimeout(() => {
      markIntroSplashSeen();
      setDone(true);
    }, minMs);
    return () => window.clearTimeout(id);
  }, [minMs]);

  return done;
}
