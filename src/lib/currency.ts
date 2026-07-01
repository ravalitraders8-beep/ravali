export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrentMonthYear(): string {
  return "ALL_TIME";
}

export function getProgressStatus(percent: number): {
  color: string;
  en: string;
  te: string;
} {
  if (percent >= 100) {
    return {
      color: "#22C55E",
      en: "Target Achieved! 🎉",
      te: "లక్ష్యం సాధించారు! 🎉",
    };
  }
  if (percent >= 67) {
    return {
      color: "#3B82F6",
      en: "Almost there!",
      te: "దగ్గరలో ఉన్నారు!",
    };
  }
  if (percent >= 34) {
    return {
      color: "#FF6B00",
      en: "Good progress",
      te: "మంచి పురోగతి",
    };
  }
  return {
    color: "#EF4444",
    en: "Far from target",
    te: "లక్ష్యం దూరంగా ఉంది",
  };
}

export function getRewardLevelForAmount(
  amount: number,
  levels: { min_amount: number; max_amount: number | null }[]
) {
  const sorted = [...levels].sort((a, b) => b.min_amount - a.min_amount);
  return sorted.find((l) => amount >= l.min_amount) ?? sorted[sorted.length - 1];
}
