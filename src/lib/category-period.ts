import type { Category, Lang } from "./types";

export type TargetUnit = "amount" | "bags";

export function getTargetUnit(category: Category): TargetUnit {
  return category.target_unit === "bags" ? "bags" : "amount";
}

export function isBagsCategory(category: Category): boolean {
  return getTargetUnit(category) === "bags";
}

export function formatTargetValue(category: Category, value: number): string {
  const n = Math.round(value);
  if (isBagsCategory(category)) {
    return `${n} bags`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatTargetValueBilingual(
  lang: Lang,
  category: Category,
  value: number
): string {
  const n = Math.round(value);
  if (isBagsCategory(category)) {
    return lang === "te" ? `${n} బ్యాగులు` : `${n} bags`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatQuantityAdded(
  lang: Lang,
  category: Category,
  value: number
): string {
  const n = Math.round(value);
  if (isBagsCategory(category)) {
    return lang === "te" ? `+${n} బ్యాగులు` : `+${n} bags`;
  }
  return `+${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)}`;
}

/** True when date is after category period end (period over) */
export function isPeriodEnded(category: Category, dateStr: string): boolean {
  if (!category.period_end_date) return false;
  const d = dateStr.slice(0, 10);
  return d > category.period_end_date;
}

export function isPeriodNotStarted(category: Category, dateStr: string): boolean {
  if (!category.period_start_date) return false;
  const d = dateStr.slice(0, 10);
  return d < category.period_start_date;
}

export function periodStatus(
  category: Category,
  dateStr: string
): "active" | "not_started" | "ended" {
  if (isPeriodNotStarted(category, dateStr)) return "not_started";
  if (isPeriodEnded(category, dateStr)) return "ended";
  return "active";
}

export function periodOverMessage(lang: Lang): { en: string; te: string } {
  return {
    en: "This period is over. Last month/target period has ended. Update dates in Targets tab or wait for the new period.",
    te: "ఈ కాలం ముగిసింది. గత నెల/లక్ష్య కాలం అయిపోయింది. లక్ష్యాలు ట్యాబ్‌లో తేదీలు మార్చండి.",
  };
}

export function periodNotStartedMessage(lang: Lang): { en: string; te: string } {
  return {
    en: "This period has not started yet. Check start date in Targets.",
    te: "ఈ కాలం ఇంకా మొదలు కాలేదు. లక్ష్యాలు ట్యాబ్‌లో ప్రారంభ తేదీ చూడండి.",
  };
}

export function defaultMonthPeriod(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}
