"use client";

import { useEffect, useRef, useState } from "react";
import { englishToTelugu } from "@/lib/transliterate";

interface BilingualFieldProps {
  englishLabel: string;
  teluguLabel: string;
  englishValue: string;
  teluguValue: string;
  onEnglishChange: (value: string) => void;
  onTeluguChange: (value: string) => void;
  englishPlaceholder?: string;
  required?: boolean;
}

export function BilingualField({
  englishLabel,
  teluguLabel,
  englishValue,
  teluguValue,
  onEnglishChange,
  onTeluguChange,
  englishPlaceholder,
  required,
}: BilingualFieldProps) {
  const [manualTelugu, setManualTelugu] = useState(false);
  const prevEnglish = useRef(englishValue);

  useEffect(() => {
    if (englishValue !== prevEnglish.current) {
      prevEnglish.current = englishValue;
      if (!manualTelugu && englishValue.trim()) {
        onTeluguChange(englishToTelugu(englishValue));
      }
    }
  }, [englishValue, manualTelugu, onTeluguChange]);

  const handleEnglish = (value: string) => {
    onEnglishChange(value);
    if (!manualTelugu) {
      onTeluguChange(value.trim() ? englishToTelugu(value) : "");
    }
  };

  const handleTelugu = (value: string) => {
    setManualTelugu(true);
    onTeluguChange(value);
  };

  const resetAuto = () => {
    setManualTelugu(false);
    if (englishValue.trim()) {
      onTeluguChange(englishToTelugu(englishValue));
    }
  };

  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
      <label className="block text-sm font-semibold text-gray-800">
        {englishLabel}
        {required && <span className="text-red-500"> *</span>}
        <input
          type="text"
          value={englishValue}
          onChange={(e) => handleEnglish(e.target.value)}
          placeholder={englishPlaceholder}
          className="mt-1 min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-base"
        />
      </label>

      <div className="mt-3">
        <label className="block text-sm font-semibold text-[#FF6B00]">
          {teluguLabel}
          {required && <span className="text-red-500"> *</span>}
          <span className="ml-2 text-xs font-normal text-gray-500">
            {manualTelugu ? "✏️ edited" : "✨ auto"}
          </span>
        </label>
        <input
          type="text"
          value={teluguValue}
          onChange={(e) => handleTelugu(e.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-[#FF6B00]/30 bg-white px-4 text-lg font-medium text-gray-900"
          placeholder="తెలుగు ఇక్కడ కనిపిస్తుంది..."
        />
        {manualTelugu && englishValue.trim() && (
          <button
            type="button"
            onClick={resetAuto}
            className="mt-2 text-xs font-semibold text-[#FF6B00] underline"
          >
            Reset to auto Telugu | ఆటో తెలుగు కు తిరిగి
          </button>
        )}
      </div>

      {englishValue && teluguValue && (
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-center text-sm font-bold text-gray-700">
          👁 {englishValue} | {teluguValue}
        </p>
      )}
    </div>
  );
}
