import { isBagsCategory } from "./category-period";
import type { Category, Contractor, Transaction } from "./types";

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function transactionsForDate(
  transactions: Transaction[],
  date: string
): Transaction[] {
  const day = date.slice(0, 10);
  return transactions.filter((tx) => (tx.transaction_date ?? "").slice(0, 10) === day);
}

export function buildDayTransactionsCsv(
  transactions: Transaction[],
  contractors: Contractor[],
  categories: Category[],
  date: string
): string {
  const dayRows = transactionsForDate(transactions, date).sort((a, b) => {
    const nameA =
      contractors.find((c) => c.id === a.contractor_id)?.name_english ?? "";
    const nameB =
      contractors.find((c) => c.id === b.contractor_id)?.name_english ?? "";
    return nameA.localeCompare(nameB);
  });

  const headers = [
    "Date",
    "Name (English)",
    "Name (Telugu)",
    "Phone",
    "Category",
    "Quantity",
    "Unit",
    "Reason",
    "Village",
  ];

  const lines = [headers.join(",")];

  for (const tx of dayRows) {
    const contractor = contractors.find((c) => c.id === tx.contractor_id);
    const category = contractor
      ? categories.find((cat) => cat.id === contractor.category_id)
      : undefined;
    const bags = category ? isBagsCategory(category) : false;

    lines.push(
      [
        (tx.transaction_date ?? date).slice(0, 10),
        csvCell(contractor?.name_english ?? ""),
        csvCell(contractor?.name_telugu ?? ""),
        csvCell(contractor?.phone ?? ""),
        csvCell(category?.name_english ?? ""),
        String(tx.amount),
        bags ? "bags" : "INR",
        csvCell(tx.reason_english),
        csvCell(contractor?.village_english ?? ""),
      ].join(",")
    );
  }

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
