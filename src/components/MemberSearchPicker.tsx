"use client";

import { useEffect, useMemo, useState } from "react";
import { adminLabels, ta } from "@/lib/admin-i18n";
import { useLang } from "@/context/LangContext";
import { pickBilingual } from "@/lib/i18n";
import type { Category, Contractor, Lang } from "@/lib/types";

export interface MemberSearchPickerProps {
  members: Contractor[];
  categories: Category[];
  value: string;
  onChange: (contractorId: string) => void;
  disabled?: boolean;
  lockedCategoryId?: string;
  emptyMessage?: string;
}

function villageKey(c: Contractor): string {
  return `${c.village_english.trim()}|${c.village_telugu.trim()}`;
}

function villageLabel(c: Contractor, lang: Lang): string {
  const te = c.village_telugu.trim();
  const en = c.village_english.trim();
  if (lang === "te") return te || en || "—";
  return en || te || "—";
}

export function MemberSearchPicker({
  members,
  categories,
  value,
  onChange,
  disabled = false,
  lockedCategoryId,
  emptyMessage,
}: MemberSearchPickerProps) {
  const { lang } = useLang();
  const L = (key: keyof typeof adminLabels) =>
    ta(lang, adminLabels[key].en, adminLabels[key].te);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [villageFilter, setVillageFilter] = useState<string>("all");

  const memberName = (c: Contractor) =>
    pickBilingual(lang, c.name_english, c.name_telugu);

  const categoryName = (cat: Category) =>
    pickBilingual(lang, cat.name_english, cat.name_telugu);

  const selected = members.find((m) => m.id === value);

  const lockedCategory = lockedCategoryId
    ? categories.find((c) => c.id === lockedCategoryId)
    : undefined;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const villageOptions = useMemo(() => {
    const map = new Map<string, Contractor>();
    for (const m of members) {
      const key = villageKey(m);
      if (!map.has(key)) map.set(key, m);
    }
    return [...map.entries()]
      .map(([key, c]) => ({ key, label: villageLabel(c, lang) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [members, lang]);

  const categoryOptions = useMemo(() => {
    if (lockedCategoryId) return [];
    const ids = new Set(members.map((m) => m.category_id));
    return categories.filter((c) => ids.has(c.id));
  }, [members, categories, lockedCategoryId]);

  const filtered = useMemo(() => {
    let list = [...members];
    if (!lockedCategoryId && categoryFilter !== "all") {
      list = list.filter((m) => m.category_id === categoryFilter);
    }
    if (villageFilter !== "all") {
      list = list.filter((m) => villageKey(m) === villageFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => {
        const cat = categories.find((row) => row.id === m.category_id);
        const catLabel = cat
          ? `${cat.name_english} ${cat.name_telugu}`.toLowerCase()
          : "";
        return (
          m.name_english.toLowerCase().includes(q) ||
          m.name_telugu.includes(q) ||
          m.phone.includes(q) ||
          m.village_english.toLowerCase().includes(q) ||
          m.village_telugu.includes(q) ||
          catLabel.includes(q)
        );
      });
    }
    return list.sort((a, b) => memberName(a).localeCompare(memberName(b)));
  }, [
    members,
    categoryFilter,
    villageFilter,
    search,
    lockedCategoryId,
    categories,
    lang,
  ]);

  const openPicker = () => {
    if (disabled || members.length === 0) return;
    setSearch("");
    setVillageFilter("all");
    if (!lockedCategoryId) setCategoryFilter("all");
    setOpen(true);
  };

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || members.length === 0}
        className="mt-1 flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 text-left transition-colors hover:border-[#e85d00] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-base font-black text-[#1a2744]">
                {memberName(selected)}
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-gray-500">
                📞 {selected.phone} · {villageLabel(selected, lang)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-gray-500">
              {members.length === 0
                ? (emptyMessage ?? L("noContractorsInCategory"))
                : L("pickMember")}
            </span>
          )}
        </span>
        <span className="shrink-0 text-2xl text-gray-400" aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-[#fff8f0]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-picker-title"
        >
          <header className="shrink-0 bg-[#1a2744] px-4 pb-4 pt-3 text-white shadow-md">
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-white/15 text-lg font-black"
                aria-label={L("back")}
              >
                ←
              </button>
              <div className="min-w-0 flex-1">
                <h2 id="member-picker-title" className="truncate text-lg font-black">
                  {L("selectMember")}
                </h2>
                {lockedCategory && (
                  <p className="truncate text-sm font-semibold opacity-90">
                    {lockedCategory.icon} {categoryName(lockedCategory)}
                  </p>
                )}
              </div>
            </div>

            <div className="mx-auto mt-4 max-w-lg">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L("searchMemberPicker")}
                autoFocus
                className="min-h-[52px] w-full rounded-2xl border-0 bg-white px-4 text-base font-bold text-[#1a2744] shadow-inner placeholder:font-semibold placeholder:text-gray-400"
              />
            </div>
          </header>

          <div className="shrink-0 border-b border-orange-100 bg-white px-4 py-3 shadow-sm">
            <div className="mx-auto max-w-lg space-y-3">
              {!lockedCategoryId && categoryOptions.length > 1 && (
                <div>
                  <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-gray-500">
                    {L("filterByTrade")}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                    <FilterChip
                      active={categoryFilter === "all"}
                      onClick={() => setCategoryFilter("all")}
                      label={L("filterAll")}
                    />
                    {categoryOptions.map((cat) => (
                      <FilterChip
                        key={cat.id}
                        active={categoryFilter === cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        label={`${cat.icon} ${categoryName(cat)}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {villageOptions.length > 1 && (
                <div>
                  <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-gray-500">
                    {L("filterByVillage")}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                    <FilterChip
                      active={villageFilter === "all"}
                      onClick={() => setVillageFilter("all")}
                      label={L("filterAll")}
                    />
                    {villageOptions.map((v) => (
                      <FilterChip
                        key={v.key}
                        active={villageFilter === v.key}
                        onClick={() => setVillageFilter(v.key)}
                        label={v.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-sm font-bold text-[#e85d00]">
                {filtered.length} {L("searchFound")}
              </p>
            </div>
          </div>

          <ul className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto px-4 py-3">
            {filtered.length === 0 ? (
              <li className="rounded-2xl bg-white py-12 text-center text-base font-bold text-gray-500">
                {L("noSearchResults")}
              </li>
            ) : (
              filtered.map((m) => {
                const cat = categories.find((c) => c.id === m.category_id);
                const isSelected = m.id === value;
                return (
                  <li key={m.id} className="mb-2">
                    <button
                      type="button"
                      onClick={() => pick(m.id)}
                      className={`flex w-full min-h-[72px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-[#e85d00] bg-orange-50"
                          : "border-gray-100 bg-white hover:border-orange-200"
                      }`}
                    >
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                        style={{
                          backgroundColor: cat ? `${cat.color_hex}22` : "#f3f4f6",
                        }}
                      >
                        {cat?.icon ?? "👷"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-black text-[#1a2744]">
                          {memberName(m)}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold text-gray-600">
                          📞 {m.phone}
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-gray-500">
                          📍 {villageLabel(m, lang)}
                          {!lockedCategoryId && cat
                            ? ` · ${categoryName(cat)}`
                            : ""}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="shrink-0 text-2xl text-[#e85d00]" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        active
          ? "bg-[#e85d00] text-white shadow-sm"
          : "bg-gray-100 text-[#1a2744] hover:bg-orange-50"
      }`}
    >
      {label}
    </button>
  );
}
