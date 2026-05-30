"use client";

import { useEffect, useState } from "react";
import { formatINR, getProgressStatus } from "@/lib/currency";
import { labels, progressMessage, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";

interface AmountCardProps {
  amount: number;
  target: number;
  achievementPercent: number;
}

export function AmountCard({ amount, target, achievementPercent }: AmountCardProps) {
  const { lang } = useLang();
  const [display, setDisplay] = useState(0);
  const status = getProgressStatus(achievementPercent);
  const pct = Math.min(100, achievementPercent);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const tVal = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - tVal, 3);
      setDisplay(Math.round(amount * eased));
      if (tVal < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [amount]);

  return (
    <div className="card-visual overflow-hidden bg-gradient-to-br from-[#e85d00] to-[#ff9a4d] p-5 text-white">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl" aria-hidden>
          💰
        </span>
        <p className="text-base font-bold opacity-95">
          {t(lang, labels.thisMonthAmount.en, labels.thisMonthAmount.te)}
        </p>
      </div>

      <div className="my-4 flex justify-center">
        <span className="text-4xl font-black tracking-tight sm:text-5xl">
          {formatINR(display)}
        </span>
      </div>

      <div className="relative mx-auto mb-3 h-4 overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: status.color }}
        />
      </div>

      <div className="flex items-center justify-between text-sm font-bold">
        <span>🎯 {formatINR(target)}</span>
        <span>{Math.round(pct)}%</span>
      </div>

      <p className="mt-3 text-center text-base font-bold opacity-95">
        {progressMessage(lang, achievementPercent)}
      </p>
    </div>
  );
}
