"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AdminLangToggle } from "./AdminLangToggle";
import { BilingualField } from "./BilingualField";
import { LoadingSpinner } from "./LoadingSpinner";
import { MemberSearchPicker } from "./MemberSearchPicker";
import { CategoryGiftPlanEditor } from "./CategoryGiftPlanEditor";
import { adminLabels, ta } from "@/lib/admin-i18n";
import { subscribeCache } from "@/lib/api-cache";
import { adminPostAction, fetchAdminBundle } from "@/lib/api-client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ShopLogo } from "./ShopLogo";
import { LOGO_PATH, SHOP_NAME } from "@/lib/constants";
import { formatINR } from "@/lib/currency";
import {
  formatQuantityAdded,
  formatTargetValueBilingual,
  isBagsCategory,
  periodStatus,
} from "@/lib/category-period";
import { useLang } from "@/context/LangContext";
import { pickBilingual, t, teluguLabel } from "@/lib/i18n";
import { transliterateToTelugu } from "@/lib/transliterate-client";
import {
  getDefaultAddContractorCategoryId,
  resolveAddContractorCategoryId,
  setDefaultAddContractorCategoryId,
} from "@/lib/admin-defaults";
import { clearAdminPinSession } from "@/lib/session";
import { phoneTelHref } from "@/lib/phone-utils";
import {
  buildDayTransactionsCsv,
  downloadTextFile,
  transactionsForDate,
} from "@/lib/export-transactions";
import {
  deriveCategoryMonthlyTarget,
  getCategoryGifts,
  getGiftTargetAmount,
  newEmptyGiftRow,
  nextUnusedRank,
  parseCategoryRewards,
  rankEmoji,
  resolveGiftPosition,
  sortGiftsByPosition,
  validateRewardsDraft,
  type CategoryGift,
} from "@/lib/category-gifts";
import { TRANSACTION_REASONS } from "@/lib/types";
import type { Category, Contractor, RewardLevel, Transaction } from "@/lib/types";

async function bilingualForSave(english: string, telugu: string) {
  const en = english.trim();
  if (!en) return { english: "", telugu: "" };
  const te = telugu.trim();
  if (te && te !== en) return { english: en, telugu: te };
  const { telugu: auto } = await transliterateToTelugu(en);
  return { english: en, telugu: auto };
}

type Tab = "overview" | "contractors" | "registry" | "amounts" | "leaderboard" | "targets";

const TABS: { key: Tab; icon: string; label: keyof typeof adminLabels }[] = [
  { key: "overview", icon: "📊", label: "overview" },
  { key: "contractors", icon: "👷", label: "contractors" },
  { key: "registry", icon: "👥", label: "registry" },
  { key: "amounts", icon: "₹", label: "amounts" },
  { key: "leaderboard", icon: "🏆", label: "leaderboard" },
  { key: "targets", icon: "🎯", label: "targets" },
];

/** Bottom bar on mobile — 4 main tabs + Menu for the rest */
const MOBILE_MAIN_TAB_KEYS: Tab[] = ["overview", "amounts", "contractors", "registry"];
const MOBILE_MENU_TAB_KEYS: Tab[] = ["leaderboard", "targets"];

const MOBILE_MAIN_TABS = MOBILE_MAIN_TAB_KEYS.map((key) => TABS.find((t) => t.key === key)!);
const MOBILE_MENU_TABS = MOBILE_MENU_TAB_KEYS.map((key) => TABS.find((t) => t.key === key)!);

const MOBILE_NAV_SHORT: Partial<Record<Tab, keyof typeof adminLabels>> = {
  overview: "mobileNavOverview",
  amounts: "mobileNavAmounts",
  contractors: "mobileNavContractors",
  registry: "mobileNavRegister",
};

export function AdminDashboard() {
  const { lang } = useLang();
  const L = (key: keyof typeof adminLabels) => {
    const entry = adminLabels[key];
    if (!entry?.en) return String(key);
    return ta(lang, entry.en, entry.te ?? entry.en);
  };

  const [tab, setTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalActive: number;
    monthTotalAmount: number;
    topContractor: { name_telugu: string; amount: number } | null;
    targetAchievedCount: number;
    leaderboard: Array<{
      name_telugu: string;
      total_amount: number;
      category_telugu: string;
      category_english?: string;
    }>;
  } | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rewardLevels, setRewardLevels] = useState<RewardLevel[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newContractor, setNewContractor] = useState({
    name_english: "",
    name_telugu: "",
    phone: "",
    village_english: "",
    village_telugu: "",
    category_id: "",
  });
  const [editingContractorId, setEditingContractorId] = useState<string | null>(null);
  const [editContractor, setEditContractor] = useState({
    name_english: "",
    name_telugu: "",
    phone: "",
    village_english: "",
    village_telugu: "",
    category_id: "",
  });
  const [txForm, setTxForm] = useState({
    contractor_id: "",
    amount: 5000,
    reasonIdx: 0,
    transaction_date: "",
  });
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txCategoryId, setTxCategoryId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [registrySearch, setRegistrySearch] = useState("");
  const [contractorsSearch, setContractorsSearch] = useState("");
  const [txExportDate, setTxExportDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rewardsDraft, setRewardsDraft] = useState<Record<string, CategoryGift[]>>({});
  const [deliverContractorId, setDeliverContractorId] = useState("");
  const [deliverGiftId, setDeliverGiftId] = useState("");
  const [defaultAddCategoryId, setDefaultAddCategoryId] = useState<string | null>(null);
  const contractorName = (c: Contractor) =>
    pickBilingual(lang, c.name_english, c.name_telugu);

  useEffect(() => {
    setDefaultAddCategoryId(getDefaultAddContractorCategoryId());
  }, []);

  const saveDefaultAddCategory = (categoryId: string) => {
    setDefaultAddContractorCategoryId(categoryId);
    setDefaultAddCategoryId(categoryId);
    setNewContractor((p) => ({ ...p, category_id: categoryId }));
  };

  const resetNewContractorForm = (categoryId: string) => {
    setNewContractor({
      name_english: "",
      name_telugu: "",
      phone: "",
      village_english: "",
      village_telugu: "",
      category_id: categoryId,
    });
  };

  const categoryName = (cat: Category) =>
    pickBilingual(lang, cat.name_english, cat.name_telugu);

  const activeContractors = useMemo(
    () => contractors.filter((c) => c.is_active),
    [contractors]
  );

  const contractorsSorted = useMemo(
    () =>
      [...contractors].sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return contractorName(a).localeCompare(contractorName(b));
      }),
    [contractors, lang]
  );

  const contractorsListFiltered = useMemo(() => {
    const q = contractorsSearch.trim().toLowerCase();
    if (!q) return contractorsSorted;
    return contractorsSorted.filter((c) => {
      const cat = categories.find((catRow) => catRow.id === c.category_id);
      const catLabel = cat
        ? `${cat.name_english} ${cat.name_telugu}`.toLowerCase()
        : "";
      return (
        c.name_english.toLowerCase().includes(q) ||
        c.name_telugu.includes(q) ||
        c.phone.includes(q) ||
        c.village_english.toLowerCase().includes(q) ||
        c.village_telugu.includes(q) ||
        catLabel.includes(q)
      );
    });
  }, [contractorsSorted, contractorsSearch, categories]);

  const registryList = useMemo(() => {
    let list = activeContractors;
    if (categoryFilter !== "all") {
      list = list.filter((c) => c.category_id === categoryFilter);
    }
    const q = registrySearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const cat = categories.find((catRow) => catRow.id === c.category_id);
        const catLabel = cat
          ? `${cat.name_english} ${cat.name_telugu}`.toLowerCase()
          : "";
        return (
          c.name_english.toLowerCase().includes(q) ||
          c.name_telugu.includes(q) ||
          c.phone.includes(q) ||
          c.village_english.toLowerCase().includes(q) ||
          c.village_telugu.includes(q) ||
          catLabel.includes(q)
        );
      });
    }
    return [...list].sort((a, b) =>
      contractorName(a).localeCompare(contractorName(b))
    );
  }, [activeContractors, categoryFilter, registrySearch, categories, lang]);

  const txContractors = useMemo(() => {
    if (!txCategoryId) return activeContractors;
    return activeContractors.filter((c) => c.category_id === txCategoryId);
  }, [activeContractors, txCategoryId]);

  const txExportDayCount = useMemo(
    () => transactionsForDate(transactions, txExportDate).length,
    [transactions, txExportDate]
  );

  const categoryUsage = useMemo(() => {
    return categories.map((cat) => {
      const inCategory = activeContractors.filter((c) => c.category_id === cat.id);
      const registered = inCategory.length;
      const loggedInOnce = inCategory.filter((c) => c.first_login_at).length;
      return { cat, registered, loggedInOnce };
    });
  }, [categories, activeContractors]);

  const totalLoggedInOnce = useMemo(
    () => activeContractors.filter((c) => c.first_login_at).length,
    [activeContractors]
  );

  const txCategory = useMemo(
    () => categories.find((c) => c.id === txCategoryId),
    [categories, txCategoryId]
  );

  const txPeriodState = useMemo(() => {
    if (!txCategory || !txForm.transaction_date) return "active" as const;
    return periodStatus(txCategory, txForm.transaction_date);
  }, [txCategory, txForm.transaction_date]);

  const resetTxForm = useCallback(() => {
    setEditingTxId(null);
    const defaultCat =
      categories.find((cat) => activeContractors.some((c) => c.category_id === cat.id))?.id ??
      categories[0]?.id ??
      "";
    const filtered = activeContractors.filter((c) => c.category_id === defaultCat);
    setTxCategoryId(defaultCat);
    setTxForm({
      contractor_id: filtered[0]?.id ?? activeContractors[0]?.id ?? "",
      amount: 5000,
      reasonIdx: 0,
      transaction_date: new Date().toISOString().slice(0, 10),
    });
  }, [activeContractors, categories]);

  const startEditTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    const idx = TRANSACTION_REASONS.findIndex((r) => r.en === tx.reason_english);
    const contractor = contractors.find((c) => c.id === tx.contractor_id);
    const catId = contractor?.category_id ?? categories[0]?.id ?? "";
    setTxCategoryId(catId);
    setTxForm({
      contractor_id: tx.contractor_id,
      amount: Number(tx.amount),
      reasonIdx: idx >= 0 ? idx : 0,
      transaction_date: tx.transaction_date.slice(0, 10),
    });
    setTab("amounts");
  };

  const handleTxCategoryChange = (categoryId: string) => {
    setTxCategoryId(categoryId);
    const filtered = activeContractors.filter((c) => c.category_id === categoryId);
    setTxForm((p) => ({
      ...p,
      contractor_id: filtered.some((c) => c.id === p.contractor_id)
        ? p.contractor_id
        : (filtered[0]?.id ?? ""),
    }));
  };

  const deleteTransaction = async (id: string) => {
    if (!window.confirm(L("confirmDeleteTx"))) return;
    const { ok, data } = await adminPostAction({ action: "delete_transaction", id });
    if (!ok) {
      showToast(String(data.message ?? data.error ?? L("failed")));
      return;
    }
    showToast(L("deleted"));
    if (editingTxId === id) resetTxForm();
    await loadAll(true);
  };

  const saveTransaction = async () => {
    if (!txForm.contractor_id) {
      showToast(L("noContractorsInCategory"));
      return;
    }
    if (!editingTxId && txCategory && txPeriodState === "ended") {
      showToast(L("periodOver"));
      return;
    }
    if (!editingTxId && txCategory && txPeriodState === "not_started") {
      showToast(L("periodNotStarted"));
      return;
    }
    const r = TRANSACTION_REASONS[txForm.reasonIdx];
    const payload = {
      contractor_id: txForm.contractor_id,
      amount: txForm.amount,
      reason_english: r.en,
      reason_telugu: r.te,
      transaction_date: txForm.transaction_date,
    };
    if (editingTxId) {
      const ok = await postAction({ action: "update_transaction", id: editingTxId, ...payload });
      if (ok) resetTxForm();
    } else {
      const ok = await postAction({ action: "add_transaction", ...payload });
      if (ok) resetTxForm();
    }
  };

  const startEditContractor = (c: Contractor) => {
    setEditingContractorId(c.id);
    setEditContractor({
      name_english: c.name_english,
      name_telugu: c.name_telugu,
      phone: c.phone,
      village_english: c.village_english,
      village_telugu: c.village_telugu,
      category_id: c.category_id ?? categories[0]?.id ?? "",
    });
  };

  const cancelEditContractor = () => {
    setEditingContractorId(null);
  };

  const saveEditContractor = async () => {
    if (!editingContractorId) return;
    const name = await bilingualForSave(
      editContractor.name_english,
      editContractor.name_telugu
    );
    const village = await bilingualForSave(
      editContractor.village_english || name.english,
      editContractor.village_telugu
    );
    if (!name.english || editContractor.phone.length < 10) {
      showToast(L("failed"));
      return;
    }

    const ok = await postAction({
      action: "update_contractor",
      id: editingContractorId,
      name_english: name.english,
      name_telugu: name.telugu,
      phone: editContractor.phone,
      village_english: village.english,
      village_telugu: village.telugu,
      category_id: editContractor.category_id,
    });
    if (ok) {
      setEditingContractorId(null);
    }
  };

  const setContractorActive = async (id: string, is_active: boolean) => {
    const confirmKey = is_active ? "confirmActivate" : "confirmDeactivate";
    const msg = adminLabels[confirmKey];
    if (!window.confirm(ta(lang, msg.en, msg.te))) return;

    const { ok, data } = await adminPostAction({
      action: "update_contractor",
      id,
      is_active,
    });
    if (!ok) {
      showToast(String(data.message ?? data.error ?? L("failed")));
      return;
    }
    showToast(is_active ? L("reactivated") : L("deactivated"));
    await loadAll(true);
  };

  const deleteContractor = async (id: string) => {
    const msg = adminLabels.confirmDeleteContractor;
    if (!window.confirm(ta(lang, msg.en, msg.te))) return;

    const { ok, data } = await adminPostAction({
      action: "delete_contractor",
      id,
    });
    if (!ok) {
      showToast(String(data.message ?? data.error ?? L("failed")));
      return;
    }
    if (editingContractorId === id) setEditingContractorId(null);
    showToast(L("deleted"));
    await loadAll(true);
  };

  const resetBalance = async (id: string) => {
    if (!window.confirm(ta(lang, "Are you sure you want to reset the balance to 0?", "మీరు ఖచ్చితంగా బ్యాలెన్స్‌ను 0కి రీసెట్ చేయాలనుకుంటున్నారా?"))) return;
    const { ok, data } = await adminPostAction({
      action: "reset_contractor_balance",
      contractor_id: id,
    });
    if (!ok) {
      showToast(String(data.message ?? data.error ?? L("failed")));
      return;
    }
    showToast("Balance Reset");
    await loadAll(true);
  };

  const syncRewardsDraft = useCallback((cats: Category[]) => {
    const draft: Record<string, CategoryGift[]> = {};
    for (const cat of cats) {
      draft[cat.id] = getCategoryGifts(cat);
    }
    setRewardsDraft(draft);
  }, []);

  const setCategoryGifts = (catId: string, gifts: CategoryGift[]) => {
    setRewardsDraft((prev) => ({
      ...prev,
      [catId]: sortGiftsByPosition(gifts),
    }));
  };

  const addGiftRow = (cat: Category) => {
    const existing = rewardsDraft[cat.id] ?? [];
    const row = newEmptyGiftRow(cat, nextUnusedRank(existing));
    setCategoryGifts(cat.id, [...existing, row]);
  };

  const readCategoryPlanFromForm = (cat: Category) => {
    const rewards = rewardsDraft[cat.id] ?? [];
    const targetVal = deriveCategoryMonthlyTarget(rewards, cat);
    const period_start_date =
      (document.getElementById(`period-start-${cat.id}`) as HTMLInputElement)?.value ??
      cat.period_start_date?.slice(0, 10) ??
      "";
    const period_end_date =
      (document.getElementById(`period-end-${cat.id}`) as HTMLInputElement)?.value ??
      cat.period_end_date?.slice(0, 10) ??
      "";
    return { targetVal, period_start_date, period_end_date };
  };

  const saveCategoryPlan = async (
    cat: Category,
    rewardsOverride?: CategoryGift[],
    options?: { silentToast?: boolean }
  ): Promise<boolean> => {
    const { targetVal, period_start_date, period_end_date } = readCategoryPlanFromForm(cat);
    const rewards = rewardsOverride ?? rewardsDraft[cat.id] ?? [];

    const validation = validateRewardsDraft(rewards, cat);
    if (!validation.ok) {
      showToast(validation.message);
      return false;
    }

    const { ok, data } = await adminPostAction({
      action: "save_category_plan",
      category_id: cat.id,
      monthly_target_amount: targetVal,
      period_start_date,
      period_end_date,
      target_unit: isBagsCategory(cat) ? "bags" : "amount",
      category_rewards: validation.cleaned,
    });

    if (!ok) {
      showToast(String((data as { message?: string }).message ?? L("failed")));
      return false;
    }

    const saved = data as Category;
    if (saved?.id) {
      setRewardsDraft((prev) => ({
        ...prev,
        [cat.id]: parseCategoryRewards(saved.category_rewards),
      }));
    }
    if (!options?.silentToast) showToast(L("saved"));
    await loadAll(true);
    return true;
  };

  const removeGiftRow = async (cat: Category, index: number) => {
    const msg = adminLabels.confirmRemoveGift;
    if (!window.confirm(ta(lang, msg.en, msg.te))) return;

    const next = (rewardsDraft[cat.id] ?? []).filter((_, i) => i !== index);
    setRewardsDraft((prev) => ({ ...prev, [cat.id]: next }));

    const ok = await saveCategoryPlan(cat, next, { silentToast: true });
    if (ok) showToast(L("giftRemoved"));
  };

  const loadAll = useCallback(async (force = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const { stats: s, data } = await fetchAdminBundle(force);
      setStats(s);
      const cats = (data.categories as Category[]) ?? [];
      setContractors((data.contractors as Contractor[]) ?? []);
      setCategories(cats);
      syncRewardsDraft(cats);
      setRewardLevels((data.rewardLevels as RewardLevel[]) ?? []);
      setTransactions((data.transactions as Transaction[]) ?? []);
      setRewards((data.rewards as Array<Record<string, unknown>>) ?? []);
      const savedDefault = getDefaultAddContractorCategoryId();
      if (savedDefault) setDefaultAddCategoryId(savedDefault);
      const addCatId = resolveAddContractorCategoryId(
        cats.map((c) => c.id),
        savedDefault
      );
      setNewContractor((p) => ({
        ...p,
        category_id: p.category_id || addCatId,
      }));
      const active = ((data.contractors as Contractor[]) ?? []).filter((c) => c.is_active);
      setDeliverContractorId((prev) =>
        prev && active.some((c) => c.id === prev) ? prev : (active[0]?.id ?? "")
      );
      const defaultCat =
        cats.find((cat) => active.some((c) => c.category_id === cat.id))?.id ?? cats[0]?.id ?? "";
      setTxCategoryId((prev) =>
        prev && active.some((c) => c.category_id === prev) ? prev : defaultCat
      );
      setTxForm((p) => {
        const catId =
          p.contractor_id &&
          active.find((c) => c.id === p.contractor_id)?.category_id
            ? active.find((c) => c.id === p.contractor_id)!.category_id
            : defaultCat;
        const filtered = active.filter((c) => c.category_id === catId);
        return {
          ...p,
          contractor_id:
            p.contractor_id && active.some((c) => c.id === p.contractor_id)
              ? p.contractor_id
              : (filtered[0]?.id ?? active[0]?.id ?? ""),
          transaction_date: p.transaction_date || new Date().toISOString().slice(0, 10),
        };
      });
    } catch (err) {
      const body = err as { status?: number; message?: string };
      if (body.status === 401) {
        setLoadError(ta(lang, adminLabels.sessionExpired.en, adminLabels.sessionExpired.te));
      } else if (body.message) {
        setLoadError(body.message);
      } else {
        setLoadError(ta(lang, adminLabels.failed.en, adminLabels.failed.te));
      }
    } finally {
      setLoading(false);
    }
  }, [lang, syncRewardsDraft]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch from Supabase
    void loadAll(true);
    return subscribeCache((tags) => {
      if (tags.some((t) => t === CACHE_TAGS.ADMIN || t === CACHE_TAGS.CONTRACTOR)) {
        void loadAll(true);
      }
    });
  }, [loadAll]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const downloadDayTransactions = () => {
    if (txExportDayCount === 0) {
      showToast(L("noTransactionsOnDay"));
      return;
    }
    const csv = buildDayTransactionsCsv(
      transactions,
      contractors,
      categories,
      txExportDate
    );
    downloadTextFile(`ravali-transactions-${txExportDate}.csv`, csv);
  };

  const postAction = async (body: Record<string, unknown>) => {
    const { ok, data } = await adminPostAction(body);
    if (!ok) {
      showToast(String(data.message ?? data.error ?? L("failed")));
      return false;
    }
    showToast(L("saved"));
    await loadAll(true);
    return true;
  };

  const logout = () => {
    clearAdminPinSession();
    window.location.href = "/";
  };

  const goToTab = (key: Tab) => {
    setTab(key);
    setMobileMenuOpen(false);
  };

  const mobileMenuActive = MOBILE_MENU_TAB_KEYS.includes(tab);

  if (loading && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <LoadingSpinner message={L("loading")} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f5] p-6">
        <span className="text-4xl">⚠️</span>
        <p className="max-w-md text-center text-lg font-bold">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadAll(true)}
          className="btn-big rounded-2xl bg-[#e85d00] px-8 text-white"
        >
          {L("tryAgain")}
        </button>
      </div>
    );
  }

  const rankedLeaderboard = (stats?.leaderboard ?? []).filter(
    (e) => Number(e.total_amount) > 0
  );

  const chartData = rankedLeaderboard.slice(0, 8).map((e) => ({
    name: e.name_telugu.slice(0, 8),
    amount: Number(e.total_amount),
  }));

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-xl md:bottom-6">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a2744] text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <ShopLogo size="sm" onDark onLogoClick={() => goToTab("overview")} />
            <h1 className="truncate text-base font-black sm:text-lg">{L("admin")}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AdminLangToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-xl font-bold md:hidden ${
                mobileMenuActive || mobileMenuOpen
                  ? "bg-white text-[#e85d00]"
                  : "bg-white/20 text-white"
              }`}
              aria-label={L("menu")}
              aria-expanded={mobileMenuOpen}
            >
              ☰
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden min-h-[40px] rounded-xl bg-white/20 px-4 text-sm font-bold sm:block"
            >
              {L("logout")}
            </button>
          </div>
        </div>

        {/* Mobile menu — drops down from header */}
        {mobileMenuOpen && (
          <div className="border-t border-white/20 bg-[#1a2744] px-4 py-3 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MENU_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => goToTab(t.key)}
                  className={`flex min-h-[48px] items-center gap-2 rounded-xl px-3 text-left text-sm font-bold ${
                    tab === t.key ? "bg-white text-[#e85d00]" : "bg-white/15 text-white"
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  {L(t.label)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-big mt-2 w-full rounded-xl bg-red-500/20 text-sm font-bold text-red-100"
            >
              {L("logout")}
            </button>
          </div>
        )}

        {/* Desktop tabs */}
        <nav className="hidden border-t border-white/20 md:block">
          <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 py-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${
                  tab === t.key ? "bg-white text-[#e85d00]" : "text-white/90 hover:bg-white/15"
                }`}
              >
                <span>{t.icon}</span>
                {L(t.label)}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        {tab === "overview" && stats && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard label={L("activeContractors")} value={stats.totalActive} />
              <StatCard label={L("loggedInOnce")} value={totalLoggedInOnce} />
              <StatCard label={L("monthTotal")} value={formatINR(stats.monthTotalAmount)} small />
              <StatCard
                label={L("topContractor")}
                value={stats.topContractor?.name_telugu ?? "—"}
                small
              />
              <StatCard label={L("targetAchieved")} value={stats.targetAchievedCount} />
            </div>
            <Panel title={L("activeUsersByCategory")}>
              <p className="mb-4 text-center text-sm font-medium text-gray-600">
                {L("categoryUsageHint")}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {categoryUsage.map(({ cat, registered, loggedInOnce }) => (
                  <div
                    key={cat.id}
                    className="flex flex-col items-center rounded-2xl border-2 border-gray-100 bg-gray-50 p-4"
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="mt-2 text-center text-xs font-bold text-gray-700">
                      {categoryName(cat)}
                    </span>
                    <div className="mt-3 flex w-full gap-2">
                      <div className="flex-1 rounded-xl bg-white px-2 py-2 text-center shadow-sm">
                        <p className="text-xl font-black text-[#1a2744]">{registered}</p>
                        <p className="text-[10px] font-bold text-gray-500">{L("registeredPhones")}</p>
                      </div>
                      <div className="flex-1 rounded-xl bg-orange-50 px-2 py-2 text-center shadow-sm">
                        <p className="text-xl font-black text-[#e85d00]">{loggedInOnce}</p>
                        <p className="text-[10px] font-bold text-gray-500">
                          {L("loggedInAtLeastOnce")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title={L("monthTotal")}>
              {chartData.length === 0 ? (
                <p className="py-12 text-center text-gray-500">{L("noContractors")}</p>
              ) : (
              <div className="h-56 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} fontSize={11} />
                    <Tooltip formatter={(v) => formatINR(Number(v))} />
                    <Bar dataKey="amount" fill="#e85d00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              )}
            </Panel>
          </>
        )}

        {tab === "contractors" && (
          <>
            <Panel title={L("addContractor")}>
              <p className="mb-3 rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-900">
                {L("loginHint")}
              </p>
              <p className="mb-4 rounded-xl bg-orange-50 p-3 text-sm font-medium text-orange-900">
                {L("typeEnglishHint")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <BilingualField
                    englishLabel={L("name")}
                    teluguLabel={`${L("name")} (Auto)`}
                    englishValue={newContractor.name_english}
                    teluguValue={newContractor.name_telugu}
                    onEnglishChange={(v) => setNewContractor((p) => ({ ...p, name_english: v }))}
                    onTeluguChange={(v) => setNewContractor((p) => ({ ...p, name_telugu: v }))}
                    englishPlaceholder="Rohith Kumar"
                    required
                  />
                </div>
                <label className="block text-sm font-bold">
                  {L("phone")} *
                  <input
                    value={newContractor.phone}
                    onChange={(e) =>
                      setNewContractor((p) => ({
                        ...p,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    inputMode="numeric"
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  />
                </label>
                <div className="block text-sm font-bold">
                  <span>{L("category")}</span>
                  <select
                    value={newContractor.category_id}
                    onChange={(e) => saveDefaultAddCategory(e.target.value)}
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {pickBilingual(lang, c.name_english, c.name_telugu)}
                        {defaultAddCategoryId === c.id ? " ★" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs font-medium text-gray-600">
                    {L("defaultCategoryHint")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => saveDefaultAddCategory(c.id)}
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${
                          defaultAddCategoryId === c.id
                            ? "bg-[#e85d00] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-orange-100"
                        }`}
                        title={L("setDefaultCategory")}
                      >
                        {c.icon}{" "}
                        {defaultAddCategoryId === c.id ? "★ " : ""}
                        {pickBilingual(lang, c.name_english, c.name_telugu)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <BilingualField
                    englishLabel={L("village")}
                    teluguLabel={`${L("village")} (Auto)`}
                    englishValue={newContractor.village_english}
                    teluguValue={newContractor.village_telugu}
                    onEnglishChange={(v) =>
                      setNewContractor((p) => ({ ...p, village_english: v }))
                    }
                    onTeluguChange={(v) =>
                      setNewContractor((p) => ({ ...p, village_telugu: v }))
                    }
                    englishPlaceholder="Palakurthy"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const name = await bilingualForSave(
                      newContractor.name_english,
                      newContractor.name_telugu
                    );
                    const village = await bilingualForSave(
                      newContractor.village_english || name.english,
                      newContractor.village_telugu
                    );
                    if (!name.english || newContractor.phone.length < 10) {
                      showToast(L("failed"));
                      return;
                    }

                    const ok = await postAction({
                      action: "add_contractor",
                      ...newContractor,
                      name_english: name.english,
                      name_telugu: name.telugu,
                      village_english: village.english,
                      village_telugu: village.telugu,
                    });
                    if (ok) {
                      const keepCat =
                        newContractor.category_id ||
                        defaultAddCategoryId ||
                        categories[0]?.id ||
                        "";
                      resetNewContractorForm(keepCat);
                    }
                  }}
                  className="btn-big sm:col-span-2 rounded-2xl bg-[#e85d00] text-white"
                >
                  ➕ {L("addContractorBtn")}
                </button>
              </div>
            </Panel>

            {editingContractorId && (
              <Panel title={L("editContractor")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <BilingualField
                      englishLabel={L("name")}
                      teluguLabel={`${L("name")} (Auto)`}
                      englishValue={editContractor.name_english}
                      teluguValue={editContractor.name_telugu}
                      onEnglishChange={(v) =>
                        setEditContractor((p) => ({ ...p, name_english: v }))
                      }
                      onTeluguChange={(v) => setEditContractor((p) => ({ ...p, name_telugu: v }))}
                      englishPlaceholder="Rohith Kumar"
                      required
                    />
                  </div>
                  <label className="block text-sm font-bold">
                    {L("phone")} *
                    <input
                      value={editContractor.phone}
                      onChange={(e) =>
                        setEditContractor((p) => ({
                          ...p,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                      inputMode="numeric"
                      className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                    />
                  </label>
                  <label className="block text-sm font-bold">
                    {L("category")}
                    <select
                      value={editContractor.category_id}
                      onChange={(e) =>
                        setEditContractor((p) => ({ ...p, category_id: e.target.value }))
                      }
                      className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {categoryName(cat)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <BilingualField
                      englishLabel={L("village")}
                      teluguLabel={`${L("village")} (Auto)`}
                      englishValue={editContractor.village_english}
                      teluguValue={editContractor.village_telugu}
                      onEnglishChange={(v) =>
                        setEditContractor((p) => ({ ...p, village_english: v }))
                      }
                      onTeluguChange={(v) =>
                        setEditContractor((p) => ({ ...p, village_telugu: v }))
                      }
                      englishPlaceholder="Palakurthy"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveEditContractor()}
                    className="btn-big rounded-2xl bg-[#e85d00] text-white"
                  >
                    {L("saveContractor")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditContractor}
                    className="btn-big rounded-2xl border-2 border-gray-200 font-bold text-gray-600"
                  >
                    {L("cancelEdit")}
                  </button>
                </div>
              </Panel>
            )}

            <Panel title={`${L("contractorsList")} (${contractorsListFiltered.length})`}>
              {contractors.length > 0 && (
                <>
                  <label className="mb-4 block text-sm font-bold text-gray-800">
                    {L("searchRegistry")}
                    <input
                      type="search"
                      value={contractorsSearch}
                      onChange={(e) => setContractorsSearch(e.target.value)}
                      placeholder={L("searchContractor")}
                      className="mt-2 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4 text-base"
                      autoComplete="off"
                    />
                  </label>
                  {contractorsSearch.trim() && (
                    <p className="-mt-2 mb-4 text-center text-xs font-semibold text-gray-500">
                      {contractorsListFiltered.length} {L("searchFound")}
                    </p>
                  )}
                </>
              )}
              {contractors.length === 0 ? (
                <p className="py-8 text-center text-gray-500">{L("noContractors")}</p>
              ) : contractorsListFiltered.length === 0 ? (
                <p className="py-8 text-center text-gray-500">{L("noSearchResults")}</p>
              ) : (
                contractorsListFiltered.map((c) => {
                  const tel = phoneTelHref(c.phone);
                  return (
                  <div
                    key={c.id}
                    className={`mb-3 flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center ${
                      c.is_active
                        ? "border-gray-100 bg-gray-50"
                        : "border-gray-200 bg-gray-100 opacity-90"
                    } ${editingContractorId === c.id ? "ring-2 ring-[#e85d00]" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-black">{contractorName(c)}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            c.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {c.is_active ? L("active") : L("inactive")}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-500">📞 {c.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tel && (
                        <a
                          href={tel}
                          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 text-sm font-bold text-white shadow-sm active:bg-green-700"
                        >
                          📞 {L("callMember")}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => startEditContractor(c)}
                        className="min-h-[44px] rounded-xl bg-white px-4 text-sm font-bold shadow-sm"
                      >
                        ✏️ {L("edit")}
                      </button>
                      {c.is_active ? (
                        <button
                          type="button"
                          onClick={() => void setContractorActive(c.id, false)}
                          className="min-h-[44px] rounded-xl bg-amber-100 px-4 text-sm font-bold text-amber-900"
                        >
                          {L("deactivate")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void setContractorActive(c.id, true)}
                          className="min-h-[44px] rounded-xl bg-green-100 px-4 text-sm font-bold text-green-800"
                        >
                          {L("activate")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void deleteContractor(c.id)}
                        className="min-h-[44px] rounded-xl bg-red-100 px-4 text-sm font-bold text-red-700"
                      >
                        🗑️ {L("delete")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void resetBalance(c.id)}
                        className="min-h-[44px] rounded-xl bg-blue-100 px-4 text-sm font-bold text-blue-700"
                      >
                        🔄 Reset Balance
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </Panel>
          </>
        )}

        {tab === "registry" && (
          <>
            <Panel title={L("registrationCounts")}>
              <p className="mb-4 text-center text-2xl font-black text-[#e85d00]">
                {L("totalRegistered")}: {activeContractors.length}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 transition-colors ${
                    categoryFilter === "all"
                      ? "border-[#e85d00] bg-orange-50"
                      : "border-gray-100 bg-gray-50 hover:border-orange-200"
                  }`}
                >
                  <span className="text-3xl">👥</span>
                  <span className="mt-1 text-2xl font-black text-[#e85d00]">
                    {activeContractors.length}
                  </span>
                  <span className="text-xs font-bold text-gray-600">{L("filterAll")}</span>
                </button>
                {categories.map((cat) => {
                  const count = activeContractors.filter((c) => c.category_id === cat.id).length;
                  const isDefaultAdd = defaultAddCategoryId === cat.id;
                  return (
                    <div key={cat.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`flex w-full flex-col items-center rounded-2xl border-2 p-4 transition-colors ${
                          categoryFilter === cat.id
                            ? "border-[#e85d00] bg-orange-50"
                            : "border-gray-100 bg-gray-50 hover:border-orange-200"
                        }`}
                      >
                        <span className="text-3xl">{cat.icon}</span>
                        <span className="mt-1 text-2xl font-black text-[#e85d00]">{count}</span>
                        <span className="text-center text-xs font-bold text-gray-600">
                          {categoryName(cat)}
                        </span>
                        {isDefaultAdd && (
                          <span className="mt-1 text-[10px] font-bold text-[#e85d00]">
                            ★ {L("defaultCategory")}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveDefaultAddCategory(cat.id)}
                        className={`absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isDefaultAdd
                            ? "bg-[#e85d00] text-white"
                            : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-200"
                        }`}
                        title={L("setDefaultCategory")}
                        aria-label={L("setDefaultCategory")}
                      >
                        ★
                      </button>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <label className="block text-sm font-bold text-gray-800">
                {L("searchRegistry")}
                <input
                  type="search"
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder={L("searchContractor")}
                  className="mt-2 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4 text-base"
                  autoComplete="off"
                />
              </label>
              {registrySearch.trim() && (
                <p className="mt-2 text-center text-xs font-semibold text-gray-500">
                  {registryList.length} {L("searchFound")}
                </p>
              )}
            </div>

            <Panel
              title={`${L("contractorsByCategory")}${
                categoryFilter !== "all"
                  ? (() => {
                      const cat = categories.find((c) => c.id === categoryFilter);
                      return cat ? ` — ${categoryName(cat)}` : "";
                    })()
                  : ""
              } (${registryList.length})`}
            >
              {registryList.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  {registrySearch.trim() ? L("noSearchResults") : L("noMembers")}
                </p>
              ) : (
                registryList.map((c) => {
                  const tel = phoneTelHref(c.phone);
                  return (
                  <div
                    key={c.id}
                    className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black">{contractorName(c)}</p>
                      <p className="truncate text-xs text-gray-500">
                        {c.categories
                          ? categoryName(c.categories as Category)
                          : categories.find((cat) => cat.id === c.category_id)?.icon}{" "}
                        • {c.phone} • {pickBilingual(lang, c.village_english, c.village_telugu)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {L("date")}: {c.joined_date?.slice(0, 10) ?? "—"}
                      </p>
                    </div>
                    {tel && (
                      <a
                        href={tel}
                        className="flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-black text-white shadow-sm active:bg-green-700 sm:min-w-[120px]"
                        aria-label={`${L("callMember")} ${c.phone}`}
                      >
                        📞 {L("callMember")}
                      </a>
                    )}
                  </div>
                  );
                })
              )}
            </Panel>
          </>
        )}

        {tab === "amounts" && (
          <>
            <Panel title={editingTxId ? L("updateTransaction") : L("addAmount")}>
              {txCategory && txPeriodState === "ended" && !editingTxId && (
                <p className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-center text-sm font-bold text-red-700">
                  {L("periodOver")}
                </p>
              )}
              {txCategory && txPeriodState === "not_started" && !editingTxId && (
                <p className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-center text-sm font-bold text-amber-900">
                  {L("periodNotStarted")}
                </p>
              )}
              {txCategory?.period_start_date && txCategory?.period_end_date && (
                <p className="mb-4 text-center text-xs font-semibold text-gray-500">
                  {L("periodStart")}: {txCategory.period_start_date} — {L("periodEnd")}:{" "}
                  {txCategory.period_end_date}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-bold sm:col-span-2">
                  {L("category")}
                  <select
                    value={txCategoryId}
                    onChange={(e) => handleTxCategoryChange(e.target.value)}
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {categoryName(cat)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <span className="block text-sm font-bold">{L("contractors")}</span>
                  <MemberSearchPicker
                    members={txContractors}
                    categories={categories}
                    value={txForm.contractor_id}
                    onChange={(contractor_id) =>
                      setTxForm((p) => ({ ...p, contractor_id }))
                    }
                    disabled={txContractors.length === 0}
                    lockedCategoryId={txCategoryId || undefined}
                    emptyMessage={L("noContractorsInCategory")}
                  />
                </div>
                <label className="block text-sm font-bold">
                  {txCategory && isBagsCategory(txCategory) ? L("bags") : L("amount")}
                  <input
                    type="number"
                    min={1}
                    value={txForm.amount}
                    onChange={(e) => setTxForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  />
                </label>
                <label className="block text-sm font-bold">
                  {L("date")}
                  <input
                    type="date"
                    value={txForm.transaction_date}
                    onChange={(e) =>
                      setTxForm((p) => ({ ...p, transaction_date: e.target.value }))
                    }
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  />
                </label>
                <label className="block text-sm font-bold sm:col-span-2">
                  {L("reason")}
                  <select
                    value={txForm.reasonIdx}
                    onChange={(e) =>
                      setTxForm((p) => ({ ...p, reasonIdx: Number(e.target.value) }))
                    }
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  >
                    {TRANSACTION_REASONS.map((r, i) => (
                      <option key={r.en} value={i}>
                        {t(lang, r.en, r.te)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void saveTransaction()}
                  disabled={
                    !txForm.contractor_id ||
                    (!editingTxId && (txPeriodState === "ended" || txPeriodState === "not_started"))
                  }
                  className="btn-big sm:col-span-2 rounded-2xl bg-[#e85d00] text-white disabled:opacity-50"
                >
                  {editingTxId ? L("updateTransaction") : L("saveTransaction")}
                </button>
                {editingTxId && (
                  <button
                    type="button"
                    onClick={resetTxForm}
                    className="btn-big sm:col-span-2 rounded-2xl border-2 border-gray-300 bg-white text-gray-700"
                  >
                    {L("cancelEdit")}
                  </button>
                )}
              </div>
            </Panel>
            <Panel title={L("recentTx")}>
              {transactions.length > 0 && (
                <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-600">
                    {L("downloadDayHint")}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm font-bold text-gray-800">
                      {L("downloadDayList")}
                      <input
                        type="date"
                        value={txExportDate}
                        onChange={(e) => setTxExportDate(e.target.value)}
                        className="mt-2 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4 text-base"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={downloadDayTransactions}
                      className="btn-big min-h-[48px] rounded-2xl bg-[#1a2744] px-6 text-white sm:shrink-0"
                    >
                      ⬇️ {L("downloadDayCsv")}
                    </button>
                  </div>
                  <p className="mt-2 text-center text-xs font-semibold text-gray-500">
                    {txExportDayCount} {L("transactionsOnDay")}
                  </p>
                </div>
              )}
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  {ta(lang, "No transactions yet", "ఇంకా మొత్తం లేదు")}
                </p>
              ) : (
              transactions.slice(0, 20).map((tx) => {
                const c = contractors.find((x) => x.id === tx.contractor_id);
                const cat = c
                  ? categories.find((catRow) => catRow.id === c.category_id)
                  : undefined;
                const amountLabel =
                  cat && isBagsCategory(cat)
                    ? formatQuantityAdded(lang, cat, Number(tx.amount))
                    : `+${formatINR(Number(tx.amount))}`;
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-2 border-b border-gray-100 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {c ? contractorName(c) : "—"} —{" "}
                        {pickBilingual(lang, tx.reason_english, tx.reason_telugu)}
                      </p>
                      <p className="text-xs text-gray-400">{tx.transaction_date?.slice(0, 10)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-green-600">{amountLabel}</span>
                      <button
                        type="button"
                        onClick={() => startEditTx(tx)}
                        className="min-h-[40px] rounded-xl bg-blue-50 px-3 text-sm font-bold text-blue-700"
                      >
                        ✏️ {L("edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTransaction(tx.id)}
                        className="min-h-[40px] rounded-xl bg-red-50 px-3 text-sm font-bold text-red-700"
                      >
                        🗑️ {L("delete")}
                      </button>
                    </div>
                  </div>
                );
              })
              )}
            </Panel>
          </>
        )}

        {tab === "leaderboard" && stats && (
          <Panel title={L("leaderboard")}>
            {rankedLeaderboard.length === 0 ? (
              <p className="py-12 text-center text-gray-500">{L("noContractors")}</p>
            ) : (
              rankedLeaderboard.map((e, i) => (
              <div key={e.name_telugu + i} className="flex items-center gap-3 border-b border-gray-100 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-black text-[#e85d00]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{teluguLabel(e.name_telugu)}</p>
                  <p className="text-xs text-gray-500">{teluguLabel(e.category_telugu)}</p>
                </div>
                <span className="shrink-0 font-black">{formatINR(Number(e.total_amount))}</span>
              </div>
            ))
            )}
            {rankedLeaderboard.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                const canvas = document.createElement("canvas");
                const leaders = rankedLeaderboard.slice(0, 10);
                canvas.width = 600;
                canvas.height = 120 + leaders.length * 44;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                try {
                  const logo = new Image();
                  logo.src = LOGO_PATH;
                  await new Promise<void>((resolve, reject) => {
                    logo.onload = () => resolve();
                    logo.onerror = reject;
                  });
                  const logoH = 70;
                  const logoW = (logo.width / logo.height) * logoH;
                  ctx.drawImage(logo, (canvas.width - logoW) / 2, 10, logoW, logoH);
                } catch {
                  ctx.fillStyle = "#1a2744";
                  ctx.font = "bold 22px sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText(SHOP_NAME, canvas.width / 2, 45);
                }
                ctx.textAlign = "left";
                ctx.fillStyle = "#333";
                ctx.font = "18px sans-serif";
                leaders.forEach((e, i) => {
                  ctx.fillText(
                    `${i + 1}. ${e.name_telugu} — ${formatINR(Number(e.total_amount))}`,
                    20,
                    110 + i * 44
                  );
                });
                const link = document.createElement("a");
                link.download = "ravali-winners.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
              }}
              className="btn-big mt-4 w-full rounded-2xl bg-green-600 text-white"
            >
              {L("exportWhatsapp")}
            </button>
            )}
          </Panel>
        )}

        {tab === "targets" && (
          <>
            <Panel title={L("categoryTargets")}>
              <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-900">
                {ta(
                  lang,
                  "Each card can have a different target (e.g. 600 bags for 1st, 300 for 2nd). Save when done.",
                  "ప్రతి కార్డ్ లో వేరే లక్ష్యం (ఉదా. 1వ — 600, 2వ — 300). అయిపోతే సేవ్."
                )}
              </p>
              {categories.map((cat) => {
                const giftRows = rewardsDraft[cat.id] ?? [];
                return (
                  <div
                    key={cat.id}
                    className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-lg font-black">{categoryName(cat)}</span>
                      {isBagsCategory(cat) && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-[#e85d00]">
                          {L("bags")}
                        </span>
                      )}
                    </div>

                    <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-2">
                      <label className="block text-sm font-bold">
                        {L("periodStart")}
                        <input
                          type="date"
                          defaultValue={cat.period_start_date?.slice(0, 10) ?? ""}
                          id={`period-start-${cat.id}`}
                          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                        />
                      </label>
                      <label className="block text-sm font-bold">
                        {L("periodEnd")}
                        <input
                          type="date"
                          defaultValue={cat.period_end_date?.slice(0, 10) ?? ""}
                          id={`period-end-${cat.id}`}
                          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                        />
                      </label>
                    </div>

                    <CategoryGiftPlanEditor
                      category={cat}
                      gifts={giftRows}
                      onGiftsChange={(gifts) => setCategoryGifts(cat.id, gifts)}
                      onAddGift={() => addGiftRow(cat)}
                      onRemoveGift={(idx) => void removeGiftRow(cat, idx)}
                      onSave={() => void saveCategoryPlan(cat)}
                    />

                    <button
                      type="button"
                      onClick={() => void saveCategoryPlan(cat)}
                      className="btn-big mt-4 w-full rounded-2xl bg-[#e85d00] text-white"
                    >
                      💾 {L("savePlan")}
                    </button>
                    <p className="mt-2 text-center text-xs font-medium text-gray-500">
                      {ta(
                        lang,
                        "Saves target, dates, and all gifts to database — contractors see this in the app.",
                        "లక్ష్యం, తేదీలు, బహుమతులు సేవ్ — App లో కనిపిస్తాయి."
                      )}
                    </p>
                  </div>
                );
              })}
            </Panel>

            <DeliverCategoryGiftPanel
              lang={lang}
              L={L}
              contractors={contractors}
              categories={categories}
              rewardsDraft={rewardsDraft}
              deliverContractorId={deliverContractorId}
              setDeliverContractorId={setDeliverContractorId}
              deliverGiftId={deliverGiftId}
              setDeliverGiftId={setDeliverGiftId}
              contractorName={contractorName}
              postAction={postAction}
              rewards={rewards}
            />
          </>
        )}

      </main>

      {/* Mobile bottom nav — 4 main tabs only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
        <div className="grid grid-cols-4 gap-0 px-2 pb-1 pt-1.5">
          {MOBILE_MAIN_TABS.map((t) => {
            const shortKey = MOBILE_NAV_SHORT[t.key];
            const label = shortKey ? L(shortKey) : L(t.label).split(" ")[0];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => goToTab(t.key)}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1.5 rounded-xl px-1 pb-0.5 pt-1 text-[11px] font-bold leading-tight ${
                  tab === t.key ? "bg-orange-50 text-[#e85d00]" : "text-gray-600"
                }`}
              >
                <span className="text-[22px] leading-none">{t.icon}</span>
                <span className="max-w-full truncate text-center">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function parseDeliveredGiftLabel(
  r: Record<string, unknown>,
  lang: import("@/lib/types").Lang
): string {
  const notes = r.notes;
  if (typeof notes === "string") {
    try {
      const p = JSON.parse(notes) as {
        type?: string;
        gift_name_english?: string;
        gift_name_telugu?: string;
      };
      if (p.type === "category_gift") {
        return pickBilingual(
          lang,
          p.gift_name_english ?? "",
          p.gift_name_telugu ?? p.gift_name_english ?? ""
        );
      }
    } catch {
      /* plain notes */
    }
  }
  const rl = r.reward_levels as {
    level_name_english?: string;
    level_name_telugu?: string;
    icon?: string;
  } | null;
  if (rl) {
    return `${rl.icon ?? ""} ${pickBilingual(
      lang,
      rl.level_name_english ?? "",
      rl.level_name_telugu ?? ""
    )}`.trim();
  }
  return "";
}

function DeliverCategoryGiftPanel({
  lang,
  L,
  contractors,
  categories,
  rewardsDraft,
  deliverContractorId,
  setDeliverContractorId,
  deliverGiftId,
  setDeliverGiftId,
  contractorName,
  postAction,
  rewards,
}: {
  lang: import("@/lib/types").Lang;
  L: (key: keyof typeof adminLabels) => string;
  contractors: Contractor[];
  categories: Category[];
  rewardsDraft: Record<string, CategoryGift[]>;
  deliverContractorId: string;
  setDeliverContractorId: (id: string) => void;
  deliverGiftId: string;
  setDeliverGiftId: (id: string) => void;
  contractorName: (c: Contractor) => string;
  postAction: (body: Record<string, unknown>) => void;
  rewards: Array<Record<string, unknown>>;
}) {
  const active = contractors.filter((c) => c.is_active);
  const deliverContractor = active.find((c) => c.id === deliverContractorId);
  const deliverCategory = categories.find((c) => c.id === deliverContractor?.category_id);
  const draft = deliverCategory ? rewardsDraft[deliverCategory.id] : undefined;
  const deliverGifts = deliverCategory
    ? sortGiftsByPosition(
        draft && draft.length > 0 ? draft : getCategoryGifts(deliverCategory)
      )
    : [];

  const selectedGift =
    deliverGifts.find((g) => g.id === deliverGiftId) ?? deliverGifts[0] ?? null;

  useEffect(() => {
    if (deliverGifts.length === 0) {
      if (deliverGiftId) setDeliverGiftId("");
      return;
    }
    if (!deliverGifts.some((g) => g.id === deliverGiftId)) {
      setDeliverGiftId(deliverGifts[0].id);
    }
  }, [deliverGifts, deliverGiftId, setDeliverGiftId]);

  return (
    <>
      <Panel title={L("deliverRewards")}>
        <p className="mb-3 text-xs font-semibold text-gray-600">
          {ta(
            lang,
            "Gifts listed here are the same as Targets & gifts you saved for that trade.",
            "ఇక్కడ లక్ష్యం ట్యాబ్ లో సేవ్ చేసిన బహుమతులే కనిపిస్తాయి."
          )}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            {L("selectMember")}
            <select
              value={deliverContractorId}
              onChange={(e) => {
                setDeliverContractorId(e.target.value);
                setDeliverGiftId("");
              }}
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 px-4"
            >
              {active.map((c) => (
                <option key={c.id} value={c.id}>
                  {contractorName(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            {L("selectGiftDeliver")}
            <select
              value={selectedGift?.id ?? ""}
              onChange={(e) => setDeliverGiftId(e.target.value)}
              disabled={deliverGifts.length === 0}
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 px-4 disabled:opacity-50"
            >
              {deliverGifts.length === 0 ? (
                <option value="">
                  {ta(lang, "No gifts — save Targets first", "బహుమతులు లేవు — లక్ష్యం సేవ్ చేయండి")}
                </option>
              ) : (
                deliverGifts.map((g) => {
                  const pos = resolveGiftPosition(g, deliverGifts);
                  const target = deliverCategory
                    ? formatTargetValueBilingual(
                        lang,
                        deliverCategory,
                        getGiftTargetAmount(g, deliverCategory)
                      )
                    : "";
                  return (
                    <option key={g.id} value={g.id}>
                      {rankEmoji(pos)}{" "}
                      {pickBilingual(lang, g.name_english, g.name_telugu)}
                      {target ? ` (${target})` : ""}
                    </option>
                  );
                })
              )}
            </select>
          </label>
          <button
            type="button"
            disabled={!deliverContractorId || !selectedGift}
            onClick={() => {
              if (!selectedGift) return;
              postAction({
                action: "deliver_category_gift",
                contractor_id: deliverContractorId,
                category_gift_id: selectedGift.id,
                gift_name_english: selectedGift.name_english,
                gift_name_telugu: selectedGift.name_telugu,
              });
            }}
            className="btn-big sm:col-span-2 rounded-2xl bg-[#1a2744] text-white disabled:opacity-50"
          >
            {L("markDelivered")}
          </button>
        </div>
      </Panel>
      <Panel title={L("rewardHistory")}>
        {rewards.length === 0 ? (
          <p className="py-6 text-center text-gray-500">{L("noContractors")}</p>
        ) : (
          rewards.map((r) => (
            <div key={String(r.id)} className="border-b border-gray-100 py-3 text-sm">
              {(r.contractors as { name_telugu: string })?.name_telugu} —{" "}
              {parseDeliveredGiftLabel(r, lang) || "—"} ✅
            </div>
          ))
        )}
      </Panel>
    </>
  );
}

function StatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className={`font-black text-[#e85d00] ${small ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-black text-gray-900">{title}</h2>
      {children}
    </div>
  );
}
