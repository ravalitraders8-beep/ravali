"use client";

import { formatINR } from "@/lib/currency";
import { labels, t } from "@/lib/i18n";
import { useLang } from "@/context/LangContext";
import type { Transaction } from "@/lib/types";

const REASON_ICONS = ["🎉", "📦", "⭐", "🏆", "💪", "✅"];

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const { lang } = useLang();

  return (
    <div className="card-visual bg-white p-5">
      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="text-3xl">📋</span>
        <h2 className="text-2xl font-black text-gray-900">
          {t(lang, labels.myHistory.en, labels.myHistory.te)}
        </h2>
      </div>

      {transactions.length === 0 ? (
        <div className="py-10 text-center">
          <span className="text-5xl">📭</span>
          <p className="mt-4 text-xl text-gray-500">
            {t(lang, labels.noHistory.en, labels.noHistory.te)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className="flex min-h-[72px] items-center gap-4 rounded-2xl border-2 border-green-100 bg-green-50 p-4"
            >
              <span className="text-3xl">{REASON_ICONS[i % REASON_ICONS.length]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-gray-800">
                  {lang === "te" ? tx.reason_telugu : tx.reason_english}
                </p>
                <p className="text-base text-gray-500">
                  {new Date(tx.transaction_date).toLocaleDateString("te-IN")}
                </p>
              </div>
              <span className="text-2xl font-black text-green-700">
                +{formatINR(Number(tx.amount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
