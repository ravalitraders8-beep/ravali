"use client";

import { useEffect, useState } from "react";
import { BilingualField } from "./BilingualField";
import { GiftImage } from "./GiftImage";
import { adminLabels, ta } from "@/lib/admin-i18n";
import {
  formatGiftPosition,
  getGiftTargetAmount,
  getGiftImagePresetsForCategory,
  normalizeGiftImageSrc,
  MAX_GIFT_RANKS,
  presetGiftNames,
  rankEmoji,
  resolveGiftPosition,
  sortGiftsByPosition,
  type CategoryGift,
} from "@/lib/category-gifts";
import { formatTargetValueBilingual, isBagsCategory } from "@/lib/category-period";
import { useLang } from "@/context/LangContext";
import type { Category } from "@/lib/types";

interface CategoryGiftPlanEditorProps {
  category: Category;
  gifts: CategoryGift[];
  onGiftsChange: (gifts: CategoryGift[]) => void;
  onAddGift: () => void;
  onRemoveGift: (index: number) => void;
  onSave: () => void;
}

export function CategoryGiftPlanEditor({
  category,
  gifts,
  onGiftsChange,
  onAddGift,
  onRemoveGift,
  onSave,
}: CategoryGiftPlanEditorProps) {
  const { lang } = useLang();
  const L = (key: keyof typeof adminLabels) => {
    const entry = adminLabels[key];
    if (!entry?.en) return String(key);
    return ta(lang, entry.en, entry.te ?? entry.en);
  };

  const sorted = sortGiftsByPosition(gifts ?? []);
  const imagePresets = getGiftImagePresetsForCategory(category);
  const categoryDefault = Math.max(
    1,
    Math.round(Number(category.monthly_target_amount) || 0) || 100
  );
  const targetLabel = isBagsCategory(category) ? L("targetBags") : L("targetAmount");

  const usedRanks = (excludeIndex?: number) => {
    const set = new Set<number>();
    gifts.forEach((g, i) => {
      if (i === excludeIndex) return;
      set.add(resolveGiftPosition(g, gifts));
    });
    return set;
  };

  const updateRow = (index: number, patch: Partial<CategoryGift>) => {
    const list = [...gifts];
    list[index] = { ...list[index], ...patch };
    onGiftsChange(sortGiftsByPosition(list));
  };

  const [targetInputs, setTargetInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setTargetInputs((prev) => {
      const next = { ...prev };
      for (const g of gifts) {
        if (next[g.id] === undefined) {
          const n = g.target_amount && g.target_amount > 0 ? g.target_amount : categoryDefault;
          next[g.id] = String(n);
        }
      }
      return next;
    });
  }, [gifts, categoryDefault, category.id]);

  const setRank = (index: number, rank: number) => {
    const r = Math.max(1, Math.min(MAX_GIFT_RANKS, Math.round(rank)));
    updateRow(index, { min_value: r });
  };

  const setTargetInput = (giftId: string, index: number, raw: string) => {
    setTargetInputs((prev) => ({ ...prev, [giftId]: raw }));
    const n = Math.round(Number(raw.replace(/\D/g, "")) || 0);
    if (n > 0) updateRow(index, { target_amount: n });
  };

  const setPreset = (index: number, imageSrc: string) => {
    const preset = imagePresets.find((p) => p.value === imageSrc);
    const names = preset ? presetGiftNames(preset) : null;
    updateRow(index, {
      image_src: imageSrc,
      ...(names ?? {}),
    });
  };

  const setImageUrl = (index: number, raw: string) => {
    const normalized = normalizeGiftImageSrc(raw);
    if (normalized) updateRow(index, { image_src: normalized });
    else if (!raw.trim()) updateRow(index, { image_src: imagePresets[0]?.value ?? "" });
  };

  const cardUnlockLine = (gift: CategoryGift, rank: number) => {
    const targetDisplay = formatTargetValueBilingual(
      lang,
      category,
      getGiftTargetAmount(gift, category)
    );
    return L("giftCardUnlock")
      .replace("{rank}", formatGiftPosition(lang, rank))
      .replace("{target}", targetDisplay);
  };

  const targetInputValue = (gift: CategoryGift) =>
    targetInputs[gift.id] ??
    String(gift.target_amount && gift.target_amount > 0 ? gift.target_amount : categoryDefault);

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-600">{L("giftPlanHint")}</p>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 py-10 text-center">
          <p className="text-sm font-semibold text-gray-600">{L("noGiftsYet")}</p>
          <button
            type="button"
            onClick={onAddGift}
            className="btn-big mt-4 rounded-2xl bg-[#e85d00] px-8 text-white"
          >
            + {L("addTargetAndGift")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((g, cardIndex) => {
            const index = gifts.findIndex((x) => x.id === g.id);
            if (index < 0) return null;
            const rank = resolveGiftPosition(g, gifts);
            const taken = usedRanks(index);
            const duplicate = taken.has(rank);

            return (
              <article
                key={g.id}
                className={`overflow-hidden rounded-2xl border-2 bg-white shadow-sm ${
                  duplicate ? "border-red-400" : "border-orange-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-orange-100 bg-[#1a2744] px-3 py-2.5 text-white">
                  <span className="text-sm font-black uppercase tracking-wide text-orange-200">
                    {L("giftCardTitle")} #{cardIndex + 1}
                  </span>
                  <span className="text-lg font-black">
                    {rankEmoji(rank)} {formatGiftPosition(lang, rank)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveGift(index)}
                    className="rounded-lg bg-red-500/90 px-2 py-1 text-xs font-bold"
                    aria-label={L("delete")}
                  >
                    🗑️
                  </button>
                </div>

                {duplicate && (
                  <p className="bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700">
                    {L("duplicateRank")}
                  </p>
                )}

                <div className="space-y-3 border-b border-orange-100 bg-orange-50/80 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-bold text-[#1a2744]">
                      {targetLabel}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={targetInputValue(g)}
                        onChange={(e) => setTargetInput(g.id, index, e.target.value)}
                        className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-orange-200 bg-white px-4 text-lg font-black"
                        placeholder={String(categoryDefault)}
                      />
                    </label>
                    <label className="block text-sm font-bold text-[#1a2744]">
                      {L("selectRank")}
                      <select
                        value={rank}
                        onChange={(e) => setRank(index, Number(e.target.value))}
                        className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-orange-200 bg-white px-3 text-base font-bold"
                      >
                        {Array.from({ length: MAX_GIFT_RANKS }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n} disabled={taken.has(n)}>
                            {formatGiftPosition(lang, n)}
                            {taken.has(n) ? ` (${L("rankUsed")})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-center text-xs font-semibold text-[#1a2744]">
                    {cardUnlockLine(g, rank)}
                  </p>
                </div>

                <div className="grid gap-3 p-3 sm:grid-cols-[120px_1fr]">
                  <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-3">
                    <p className="mb-2 text-xs font-black uppercase text-gray-500">
                      {L("giftPreview")}
                    </p>
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-white">
                      <GiftImage
                        src={g.image_src}
                        alt={g.name_english}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-center text-sm font-black text-[#1a2744]">
                      {g.name_english || "—"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-[#1a2744]">
                      {L("giftImageUrl")}
                      <input
                        type="url"
                        value={g.image_src}
                        onChange={(e) => setImageUrl(index, e.target.value)}
                        placeholder="https://example.com/tv-photo.jpg"
                        className="mt-1 min-h-[44px] w-full rounded-xl border-2 border-gray-200 px-3 text-sm font-semibold"
                      />
                      <span className="mt-1 block text-xs font-medium text-gray-500">
                        {L("giftImageUrlHint")}
                      </span>
                    </label>

                    <div>
                      <p className="mb-1.5 text-xs font-black uppercase text-gray-500">
                        {L("giftDesign")}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {imagePresets.map((p) => {
                          const active = g.image_src === p.value;
                          return (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setPreset(index, p.value)}
                              className={`flex flex-col items-center rounded-xl border-2 p-2 transition-all ${
                                active
                                  ? "border-[#e85d00] bg-orange-50 ring-2 ring-[#e85d00]"
                                  : "border-gray-200 bg-white hover:border-orange-300"
                              }`}
                            >
                              <GiftImage
                                src={p.value}
                                alt={p.labelEn}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                              <span className="mt-1 text-[10px] font-bold leading-tight">
                                {lang === "te" ? p.labelTe : p.labelEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <BilingualField
                      compact
                      englishLabel={L("giftNameEn")}
                      teluguLabel={L("giftNameTe")}
                      englishValue={g.name_english}
                      teluguValue={g.name_telugu}
                      englishPlaceholder="TV Gift"
                      onEnglishChange={(v) => updateRow(index, { name_english: v })}
                      onTeluguChange={(te) => updateRow(index, { name_telugu: te })}
                    />

                    <BilingualField
                      compact
                      englishLabel={L("giftPlanEn")}
                      teluguLabel={L("giftPlanTe")}
                      englishValue={g.description_english ?? ""}
                      teluguValue={g.description_telugu ?? ""}
                      englishPlaceholder="e.g. June 2026 mason reward plan"
                      onEnglishChange={(v) => updateRow(index, { description_english: v })}
                      onTeluguChange={(te) => updateRow(index, { description_telugu: te })}
                    />
                  </div>
                </div>

                <div className="border-t border-orange-100 bg-gray-50 p-3">
                  <button
                    type="button"
                    onClick={onSave}
                    className="btn-big w-full rounded-xl bg-[#e85d00] text-white"
                  >
                    💾 {L("saveCard")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {sorted.length > 0 && (
        <button
          type="button"
          onClick={onAddGift}
          disabled={gifts.length >= MAX_GIFT_RANKS}
          className="w-full rounded-2xl border-2 border-dashed border-[#e85d00] bg-orange-50 py-4 text-sm font-black text-[#e85d00] disabled:opacity-50"
        >
          + {L("addTargetAndGift")}
        </button>
      )}
    </div>
  );
}
