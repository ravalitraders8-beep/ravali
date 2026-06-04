"use client";

import { useCallback, useRef, useState } from "react";
import { englishToTelugu } from "@/lib/transliterate";
import { transliterateToTelugu } from "@/lib/transliterate-client";

interface BilingualFieldProps {
  englishLabel: string;
  teluguLabel: string;
  englishValue: string;
  teluguValue: string;
  onEnglishChange: (value: string) => void;
  onTeluguChange: (value: string) => void;
  englishPlaceholder?: string;
  required?: boolean;
  compact?: boolean;
}

const DEBOUNCE_MS = 320;

export function BilingualField({
  englishLabel,
  teluguLabel,
  englishValue,
  teluguValue,
  onEnglishChange,
  onTeluguChange,
  englishPlaceholder,
  required,
  compact = false,
}: BilingualFieldProps) {
  const [manualTelugu, setManualTelugu] = useState(false);
  const [transliterating, setTransliterating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const applyAutoTelugu = useCallback(
    async (english: string) => {
      const trimmed = english.trim();
      if (!trimmed) {
        onTeluguChange("");
        return;
      }
      const id = ++requestIdRef.current;
      setTransliterating(true);
      try {
        const te = await transliterateToTelugu(trimmed);
        if (requestIdRef.current === id) {
          onTeluguChange(te);
        }
      } finally {
        if (requestIdRef.current === id) setTransliterating(false);
      }
    },
    [onTeluguChange]
  );

  const handleEnglish = (value: string) => {
    onEnglishChange(value);

    if (manualTelugu) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      onTeluguChange("");
      setTransliterating(false);
      return;
    }

    onTeluguChange(englishToTelugu(value));

    debounceRef.current = setTimeout(() => {
      void applyAutoTelugu(value);
    }, DEBOUNCE_MS);
  };

  const handleTelugu = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setManualTelugu(true);
    onTeluguChange(value);
  };

  const resetAuto = () => {
    setManualTelugu(false);
    if (englishValue.trim()) {
      void applyAutoTelugu(englishValue);
    }
  };

  const inputClass = compact
    ? "mt-0.5 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
    : "mt-1 min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-base";
  const teluguInputClass = compact
    ? "mt-0.5 w-full rounded-lg border-2 border-[#FF6B00]/30 bg-white px-2 py-1.5 text-base font-medium text-gray-900"
    : "mt-1 min-h-[48px] w-full rounded-xl border-2 border-[#FF6B00]/30 bg-white px-4 text-lg font-medium text-gray-900";

  return (
    <div
      className={
        compact
          ? "sm:col-span-2"
          : "rounded-xl border border-orange-100 bg-orange-50/40 p-3"
      }
    >
      <label className={`block font-semibold text-gray-800 ${compact ? "text-xs" : "text-sm"}`}>
        {englishLabel}
        {required && <span className="text-red-500"> *</span>}
        <input
          type="text"
          value={englishValue}
          onChange={(e) => handleEnglish(e.target.value)}
          placeholder={englishPlaceholder}
          className={inputClass}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <div className={compact ? "mt-2" : "mt-3"}>
        <label className={`block font-semibold text-[#FF6B00] ${compact ? "text-xs" : "text-sm"}`}>
          {teluguLabel}
          {required && <span className="text-red-500"> *</span>}
          <span className="ml-1 text-xs font-normal text-gray-500">
            {manualTelugu ? "✏️" : transliterating ? "…" : "✨ auto"}
          </span>
        </label>
        <input
          type="text"
          value={teluguValue}
          onChange={(e) => handleTelugu(e.target.value)}
          className={teluguInputClass}
          placeholder="తెలుగు ఇక్కడ కనిపిస్తుంది..."
          lang="te"
          autoComplete="off"
        />
        {manualTelugu && englishValue.trim() && (
          <button
            type="button"
            onClick={resetAuto}
            className="mt-1 text-xs font-semibold text-[#FF6B00] underline"
          >
            {compact ? "Auto Telugu" : "Reset to auto Telugu | ఆటో తెలుగు కు తిరిగి"}
          </button>
        )}
      </div>

      {!compact && englishValue && teluguValue && (
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-center text-sm font-bold text-gray-700">
          👁 {englishValue} | {teluguValue}
        </p>
      )}
    </div>
  );
}
