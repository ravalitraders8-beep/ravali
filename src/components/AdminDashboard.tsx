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
import { adminLabels, ta } from "@/lib/admin-i18n";
import { subscribeCache } from "@/lib/api-cache";
import { adminPostAction, fetchAdminBundle } from "@/lib/api-client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ShopLogo } from "./ShopLogo";
import { LOGO_PATH, SHOP_NAME } from "@/lib/constants";
import { formatINR } from "@/lib/currency";
import { useLang } from "@/context/LangContext";
import { englishToTelugu } from "@/lib/transliterate";
import { downloadQR, generateQRImageWithName } from "@/lib/qr-utils";
import { clearAdminPinSession } from "@/lib/session";
import { TRANSACTION_REASONS } from "@/lib/types";
import type { Category, Contractor, RewardLevel, Transaction } from "@/lib/types";

type Tab = "overview" | "contractors" | "registry" | "amounts" | "leaderboard" | "rewards" | "targets" | "qr";

const TABS: { key: Tab; icon: string; label: keyof typeof adminLabels }[] = [
  { key: "overview", icon: "📊", label: "overview" },
  { key: "contractors", icon: "👷", label: "contractors" },
  { key: "registry", icon: "📋", label: "registry" },
  { key: "amounts", icon: "₹", label: "amounts" },
  { key: "leaderboard", icon: "🏆", label: "leaderboard" },
  { key: "rewards", icon: "🎁", label: "rewards" },
  { key: "targets", icon: "🎯", label: "targets" },
  { key: "qr", icon: "📱", label: "qr" },
];

/** Bottom bar on mobile — 4 main tabs + Menu for the rest */
const MOBILE_MAIN_TAB_KEYS: Tab[] = ["overview", "amounts", "contractors", "qr"];
const MOBILE_MENU_TAB_KEYS: Tab[] = ["registry", "leaderboard", "rewards", "targets"];

const MOBILE_MAIN_TABS = MOBILE_MAIN_TAB_KEYS.map((key) => TABS.find((t) => t.key === key)!);
const MOBILE_MENU_TABS = MOBILE_MENU_TAB_KEYS.map((key) => TABS.find((t) => t.key === key)!);

export function AdminDashboard() {
  const { lang } = useLang();
  const L = (key: keyof typeof adminLabels) =>
    ta(lang, adminLabels[key].en, adminLabels[key].te);

  const [tab, setTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalActive: number;
    monthTotalAmount: number;
    topContractor: { name_telugu: string; amount: number } | null;
    targetAchievedCount: number;
    leaderboard: Array<{ name_telugu: string; total_amount: number; category_telugu: string }>;
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
  const [txForm, setTxForm] = useState({
    contractor_id: "",
    amount: 5000,
    reasonIdx: 0,
    transaction_date: "",
  });
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txCategoryId, setTxCategoryId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [qrCategoryFilter, setQrCategoryFilter] = useState<string>("all");
  const [qrSearch, setQrSearch] = useState("");
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState<{
    url: string;
    token: string;
    name: string;
    subtitle: string;
  } | null>(null);

  const contractorName = (c: Contractor) =>
    lang === "te" ? c.name_telugu : c.name_english;

  const categoryName = (cat: Category) =>
    lang === "te" ? cat.name_telugu : cat.name_english;

  const activeContractors = useMemo(
    () => contractors.filter((c) => c.is_active),
    [contractors]
  );

  const registryList = useMemo(() => {
    let list = activeContractors;
    if (categoryFilter !== "all") {
      list = list.filter((c) => c.category_id === categoryFilter);
    }
    return [...list].sort((a, b) =>
      contractorName(a).localeCompare(contractorName(b))
    );
  }, [activeContractors, categoryFilter, lang]);

  const qrContractorList = useMemo(() => {
    let list = activeContractors;
    if (qrCategoryFilter !== "all") {
      list = list.filter((c) => c.category_id === qrCategoryFilter);
    }
    const q = qrSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name_english.toLowerCase().includes(q) ||
          c.name_telugu.includes(q) ||
          c.phone.includes(q) ||
          c.qr_token.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      contractorName(a).localeCompare(contractorName(b))
    );
  }, [activeContractors, qrCategoryFilter, qrSearch, lang]);

  const txContractors = useMemo(() => {
    if (!txCategoryId) return activeContractors;
    return activeContractors.filter((c) => c.category_id === txCategoryId);
  }, [activeContractors, txCategoryId]);

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

  const loadAll = useCallback(async (force = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const { stats: s, data } = await fetchAdminBundle(force);
      setStats(s);
      const cats = (data.categories as Category[]) ?? [];
      setContractors((data.contractors as Contractor[]) ?? []);
      setCategories(cats);
      setRewardLevels((data.rewardLevels as RewardLevel[]) ?? []);
      setTransactions((data.transactions as Transaction[]) ?? []);
      setRewards((data.rewards as Array<Record<string, unknown>>) ?? []);
      setNewContractor((p) => ({ ...p, category_id: p.category_id || cats[0]?.id || "" }));
      const active = ((data.contractors as Contractor[]) ?? []).filter((c) => c.is_active);
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
  }, [lang]);

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

  const showContractorQr = async (c: Contractor) => {
    setSelectedQrId(c.id);
    setQrLoading(true);
    setQrPreview(null);
    try {
      const url = await generateQRImageWithName(
        c.qr_token,
        c.name_english,
        c.name_telugu
      );
      setQrPreview({
        url,
        token: c.qr_token,
        name: c.name_english,
        subtitle: c.name_telugu,
      });
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrFullscreen = () => {
    setQrPreview(null);
    setSelectedQrId(null);
    setQrLoading(false);
  };

  const previewQR = async (c: Contractor) => {
    await showContractorQr(c);
    setTab("qr");
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
    <div className="min-h-screen bg-[#f5f5f5] pb-24 md:pb-8">
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-xl md:bottom-6">
          {toast}
        </div>
      )}

      {(qrLoading || qrPreview) && selectedQrId && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <header className="flex shrink-0 items-center gap-3 bg-[#1a2744] px-4 py-3 text-white shadow-lg">
            <button
              type="button"
              onClick={closeQrFullscreen}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold"
            >
              ← {L("back")}
            </button>
            <p className="min-w-0 flex-1 truncate text-base font-black">
              {qrPreview?.name ?? contractors.find((c) => c.id === selectedQrId)?.name_english}
            </p>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-4 pb-8">
            {qrLoading ? (
              <LoadingSpinner message={L("loading")} />
            ) : qrPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrPreview.url}
                  alt={`QR ${qrPreview.name}`}
                  className="w-full max-w-lg rounded-2xl shadow-2xl"
                />
                <p className="text-xl font-black text-gray-900">{qrPreview.name}</p>
                <p className="text-lg text-gray-600">{qrPreview.subtitle}</p>
                <p className="font-mono text-sm text-gray-400">{qrPreview.token}</p>
                <p className="max-w-md rounded-2xl bg-orange-100 px-6 py-4 text-center text-base font-bold text-[#e85d00]">
                  {L("scanToOpen")}
                </p>
              </>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-orange-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={closeQrFullscreen}
              className="btn-big w-full rounded-2xl bg-[#1a2744] text-white"
            >
              ← {L("back")}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a2744] text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <ShopLogo size="sm" onDark />
            <h1 className="truncate text-base font-black sm:text-lg">{L("admin")}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AdminLangToggle />
            <button
              type="button"
              onClick={logout}
              className="hidden min-h-[40px] rounded-xl bg-white/20 px-4 text-sm font-bold sm:block"
            >
              {L("logout")}
            </button>
          </div>
        </div>

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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label={L("activeContractors")} value={stats.totalActive} />
              <StatCard label={L("monthTotal")} value={formatINR(stats.monthTotalAmount)} small />
              <StatCard
                label={L("topContractor")}
                value={stats.topContractor?.name_telugu ?? "—"}
                small
              />
              <StatCard label={L("targetAchieved")} value={stats.targetAchievedCount} />
            </div>
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
                <label className="block text-sm font-bold">
                  {L("category")}
                  <select
                    value={newContractor.category_id}
                    onChange={(e) =>
                      setNewContractor((p) => ({ ...p, category_id: e.target.value }))
                    }
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === "te" ? c.name_telugu : c.name_english}
                      </option>
                    ))}
                  </select>
                </label>
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
                    const nameEn = newContractor.name_english.trim();
                    let nameTe = newContractor.name_telugu.trim();
                    if (!nameTe && nameEn) nameTe = englishToTelugu(nameEn);
                    if (!nameEn || newContractor.phone.length < 10) {
                      showToast(L("failed"));
                      return;
                    }
                    const villageEn = newContractor.village_english.trim() || nameEn;
                    let villageTe = newContractor.village_telugu.trim();
                    if (!villageTe && villageEn) villageTe = englishToTelugu(villageEn);

                    const ok = await postAction({
                      action: "add_contractor",
                      ...newContractor,
                      name_english: nameEn,
                      name_telugu: nameTe,
                      village_english: villageEn,
                      village_telugu: villageTe,
                    });
                    if (ok) {
                      setNewContractor({
                        name_english: "",
                        name_telugu: "",
                        phone: "",
                        village_english: "",
                        village_telugu: "",
                        category_id: categories[0]?.id ?? "",
                      });
                    }
                  }}
                  className="btn-big sm:col-span-2 rounded-2xl bg-[#e85d00] text-white"
                >
                  ➕ {L("addAndQr")}
                </button>
              </div>
            </Panel>

            <Panel title={L("contractorsList")}>
              {contractors.length === 0 ? (
                <p className="py-8 text-center text-gray-500">{L("noContractors")}</p>
              ) : (
                contractors.map((c) => (
                  <div
                    key={c.id}
                    className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black">{contractorName(c)}</p>
                      <p className="truncate text-xs text-gray-500">
                        {c.qr_token} • {c.phone}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void previewQR(c)}
                        className="min-h-[44px] rounded-xl bg-white px-4 text-sm font-bold shadow-sm"
                      >
                        📱 QR
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void downloadQR(c.qr_token, c.name_english, c.name_telugu)
                        }
                        className="min-h-[44px] rounded-xl bg-[#e85d00] px-4 text-sm font-bold text-white"
                      >
                        ⬇️ {L("download")}
                      </button>
                      {c.is_active && (
                        <button
                          type="button"
                          onClick={() =>
                            postAction({ action: "update_contractor", id: c.id, is_active: false })
                          }
                          className="min-h-[44px] rounded-xl bg-red-100 px-4 text-sm font-bold text-red-700"
                        >
                          {L("deactivate")}
                        </button>
                      )}
                    </div>
                  </div>
                ))
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
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`flex flex-col items-center rounded-2xl border-2 p-4 transition-colors ${
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
                    </button>
                  );
                })}
              </div>
            </Panel>

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
                <p className="py-8 text-center text-gray-500">{L("noContractors")}</p>
              ) : (
                registryList.map((c) => (
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
                        • {c.phone} • {lang === "te" ? c.village_telugu : c.village_english}
                      </p>
                      <p className="text-xs text-gray-400">
                        {L("date")}: {c.joined_date?.slice(0, 10) ?? "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void previewQR(c)}
                      className="min-h-[44px] shrink-0 rounded-xl bg-white px-4 text-sm font-bold shadow-sm"
                    >
                      📱 QR
                    </button>
                  </div>
                ))
              )}
            </Panel>
          </>
        )}

        {tab === "amounts" && (
          <>
            <Panel title={editingTxId ? L("updateTransaction") : L("addAmount")}>
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
                <label className="block text-sm font-bold sm:col-span-2">
                  {L("contractors")}
                  <select
                    value={txForm.contractor_id}
                    onChange={(e) => setTxForm((p) => ({ ...p, contractor_id: e.target.value }))}
                    disabled={txContractors.length === 0}
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4 disabled:bg-gray-100"
                  >
                    {txContractors.length === 0 ? (
                      <option value="">{L("noContractorsInCategory")}</option>
                    ) : (
                      txContractors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {contractorName(c)}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  {L("amount")}
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
                        {lang === "te" ? r.te : r.en}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void saveTransaction()}
                  disabled={!txForm.contractor_id}
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
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  {ta(lang, "No transactions yet", "ఇంకా మొత్తాలు లేవు")}
                </p>
              ) : (
              transactions.slice(0, 20).map((tx) => {
                const c = contractors.find((x) => x.id === tx.contractor_id);
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-2 border-b border-gray-100 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {c ? contractorName(c) : "—"} —{" "}
                        {lang === "te" ? tx.reason_telugu : tx.reason_english}
                      </p>
                      <p className="text-xs text-gray-400">{tx.transaction_date?.slice(0, 10)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-green-600">
                        +{formatINR(Number(tx.amount))}
                      </span>
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
                  <p className="truncate font-bold">{e.name_telugu}</p>
                  <p className="text-xs text-gray-500">{e.category_telugu}</p>
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

        {tab === "rewards" && (
          <>
            <Panel title={L("markReward")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <select id="rw-contractor" className="min-h-[48px] rounded-xl border-2 px-4">
                  {contractors.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>
                      {contractorName(c)}
                    </option>
                  ))}
                </select>
                <select id="rw-level" className="min-h-[48px] rounded-xl border-2 px-4">
                  {rewardLevels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.icon}{" "}
                      {lang === "te" ? l.level_name_telugu : l.level_name_english}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const contractor_id = (
                      document.getElementById("rw-contractor") as HTMLSelectElement
                    ).value;
                    const reward_level_id = (
                      document.getElementById("rw-level") as HTMLSelectElement
                    ).value;
                    postAction({ action: "deliver_reward", contractor_id, reward_level_id });
                  }}
                  className="btn-big sm:col-span-2 rounded-2xl bg-[#e85d00] text-white"
                >
                  {L("markDelivered")}
                </button>
              </div>
            </Panel>
            <Panel title={L("rewardHistory")}>
              {rewards.map((r) => (
                <div key={String(r.id)} className="border-b border-gray-100 py-3 text-sm">
                  {(r.contractors as { name_telugu: string })?.name_telugu} —{" "}
                  {(r.reward_levels as { level_name_telugu: string })?.level_name_telugu} ✅
                </div>
              ))}
            </Panel>
          </>
        )}

        {tab === "targets" && (
          <Panel title={L("categoryTargets")}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="mb-4 flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="flex-1 font-bold">
                  {lang === "te" ? cat.name_telugu : cat.name_english}
                </span>
                <input
                  type="number"
                  defaultValue={cat.monthly_target_amount}
                  id={`target-${cat.id}`}
                  className="min-h-[44px] w-full rounded-xl border-2 px-3 sm:w-36"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = Number(
                      (document.getElementById(`target-${cat.id}`) as HTMLInputElement).value
                    );
                    postAction({
                      action: "update_target",
                      category_id: cat.id,
                      monthly_target_amount: val,
                    });
                  }}
                  className="min-h-[44px] rounded-xl bg-[#e85d00] px-6 font-bold text-white"
                >
                  {L("save")}
                </button>
              </div>
            ))}
          </Panel>
        )}

        {tab === "qr" && (
          <>
            <Panel title={L("qrGenerator")}>
              <p className="mb-4 rounded-xl bg-orange-50 p-3 text-sm font-medium text-orange-900">
                {L("qrWalkInHint")}
              </p>

              <label className="block text-sm font-bold">
                {L("searchContractor")}
                <input
                  type="search"
                  value={qrSearch}
                  onChange={(e) => setQrSearch(e.target.value)}
                  placeholder={L("searchContractor")}
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setQrCategoryFilter("all")}
                  className={`min-h-[40px] rounded-full px-4 text-sm font-bold transition-colors ${
                    qrCategoryFilter === "all"
                      ? "bg-[#e85d00] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  👥 {L("filterAll")} ({activeContractors.length})
                </button>
                {categories.map((cat) => {
                  const count = activeContractors.filter((c) => c.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setQrCategoryFilter(cat.id)}
                      className={`min-h-[40px] rounded-full px-4 text-sm font-bold transition-colors ${
                        qrCategoryFilter === cat.id
                          ? "bg-[#e85d00] text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {cat.icon} {categoryName(cat)} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                {qrContractorList.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">{L("noContractors")}</p>
                ) : (
                  qrContractorList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void showContractorQr(c)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                        selectedQrId === c.id
                          ? "border-[#e85d00] bg-orange-50"
                          : "border-gray-100 bg-gray-50 hover:border-orange-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">{contractorName(c)}</p>
                        <p className="truncate text-xs text-gray-500">
                          {c.phone} • {c.qr_token}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#e85d00]">
                        📱 {L("showQr")}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          </>
        )}
      </main>

      {/* Mobile bottom nav — 4 main + Menu */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
        <div className="grid grid-cols-5 px-1 py-1">
          {MOBILE_MAIN_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => goToTab(t.key)}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-bold ${
                tab === t.key ? "text-[#e85d00]" : "text-gray-500"
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="truncate px-0.5">{L(t.label).split(" ")[0]}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-bold ${
              mobileMenuActive || mobileMenuOpen ? "text-[#e85d00]" : "text-gray-500"
            }`}
          >
            <span className="text-xl">☰</span>
            <span className="truncate px-0.5">{L("menu")}</span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            aria-label={L("closeMenu")}
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">{L("menu")}</h2>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MENU_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => goToTab(t.key)}
                  className={`flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-4 text-left text-sm font-bold ${
                    tab === t.key
                      ? "border-[#e85d00] bg-orange-50 text-[#e85d00]"
                      : "border-gray-100 bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  {L(t.label)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-big mt-3 w-full rounded-2xl bg-red-50 text-red-700"
            >
              {L("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
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
