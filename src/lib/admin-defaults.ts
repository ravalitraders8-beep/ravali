const STORAGE_KEY = "ravali_default_add_contractor_category_id";

export function getDefaultAddContractorCategoryId(): string | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(STORAGE_KEY)?.trim();
  return id || null;
}

export function setDefaultAddContractorCategoryId(categoryId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, categoryId);
}

export function clearDefaultAddContractorCategoryId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Pick category for new contractor form: saved default, else first available */
export function resolveAddContractorCategoryId(
  categoryIds: string[],
  savedDefaultId: string | null
): string {
  if (savedDefaultId && categoryIds.includes(savedDefaultId)) {
    return savedDefaultId;
  }
  return categoryIds[0] ?? "";
}
