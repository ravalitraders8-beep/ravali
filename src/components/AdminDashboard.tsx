"use client";

import { useEffect, useState, useCallback } from "react";
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

type Tab = "overview" | "contractors" | "amounts" | "leaderboard" | "rewards" | "targets" | "qr";

const TABS: { key: Tab; icon: string; label: keyof typeof adminLabels }[] = [
  { key: "overview", icon: "📊", label: "overview" },
  { key: "contractors", icon: "👷", label: "contractors" },
  { key: "amounts", icon: "₹", label: "amounts" },
  { key: "leaderboard", icon: "🏆", label: "leaderboard" },
  { key: "rewards", icon: "🎁", label: "rewards" },
  { key: "targets", icon: "🎯", label: "targets" },
  { key: "qr", icon: "📱", label: "qr" },
];

export function AdminDashboard() {
  const { lang } = useLang();
  const L = (key: keyof typeof adminLabels) =>
    ta(lang, adminLabels[key].en, adminLabels[key].te);

  const [tab, setTab] = useState<Tab>("overview");
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
    transaction_date: new Date().toISOString().slice(0, 10),
  });
  const [qrPreview, setQrPreview] = useState<{
    url: string;
    token: string;
    name: string;
    subtitle: string;
  } | null>(null);

  const contractorName = (c: Contractor) =>
    lang === "te" ? c.name_telugu : c.name_english;

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
      setTxForm((p) => ({
        ...p,
        contractor_id: p.contractor_id || (data.contractors as Contractor[])?.[0]?.id || "",
      }));
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        setLoadError(ta(lang, adminLabels.sessionExpired.en, adminLabels.sessionExpired.te));
      } else {
        setLoadError(ta(lang, adminLabels.failed.en, adminLabels.failed.te));
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch
    void loadAll();
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

  const previewQR = async (c: Contractor) => {
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
    setTab("qr");
  };

  const logout = () => {
    clearAdminPinSession();
    window.location.href = "/";
  };

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
        <p className="text-lg font-bold">{loadError}</p>
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

  const chartData = (stats?.leaderboard ?? []).slice(0, 8).map((e) => ({
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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a2744] text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <ShopLogo size="sm" />
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

        {tab === "amounts" && (
          <>
            <Panel title={L("addAmount")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-bold sm:col-span-2">
                  {L("contractors")}
                  <select
                    value={txForm.contractor_id}
                    onChange={(e) => setTxForm((p) => ({ ...p, contractor_id: e.target.value }))}
                    className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-gray-200 px-4"
                  >
                    {contractors.filter((c) => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>
                        {contractorName(c)}
                      </option>
                    ))}
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
                  onClick={() => {
                    const r = TRANSACTION_REASONS[txForm.reasonIdx];
                    postAction({
                      action: "add_transaction",
                      contractor_id: txForm.contractor_id,
                      amount: txForm.amount,
                      reason_english: r.en,
                      reason_telugu: r.te,
                      transaction_date: txForm.transaction_date,
                    });
                  }}
                  className="btn-big sm:col-span-2 rounded-2xl bg-[#e85d00] text-white"
                >
                  {L("saveTransaction")}
                </button>
              </div>
            </Panel>
            <Panel title={L("recentTx")}>
              {transactions.slice(0, 20).map((tx) => {
                const c = contractors.find((x) => x.id === tx.contractor_id);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2 border-b border-gray-100 py-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {c ? contractorName(c) : "—"} —{" "}
                      {lang === "te" ? tx.reason_telugu : tx.reason_english}
                    </span>
                    <span className="shrink-0 font-black text-green-600">
                      +{formatINR(Number(tx.amount))}
                    </span>
                  </div>
                );
              })}
            </Panel>
          </>
        )}

        {tab === "leaderboard" && stats && (
          <Panel title={L("leaderboard")}>
            {stats.leaderboard.map((e, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-gray-100 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg font-black text-[#e85d00]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{e.name_telugu}</p>
                  <p className="text-xs text-gray-500">{e.category_telugu}</p>
                </div>
                <span className="shrink-0 font-black">{formatINR(Number(e.total_amount))}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={async () => {
                const canvas = document.createElement("canvas");
                const leaders = stats.leaderboard.slice(0, 10);
                canvas.width = 600;
                canvas.height = 120 + leaders.length * 44;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.fillStyle = "#FFF8F0";
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
          <Panel title={L("qrGenerator")}>
            {qrPreview ? (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrPreview.url}
                  alt={`QR ${qrPreview.name}`}
                  className="mx-auto w-full max-w-sm rounded-2xl shadow-lg"
                />
                <p className="mt-4 text-lg font-black">{qrPreview.name}</p>
                <p className="text-base text-gray-600">{qrPreview.subtitle}</p>
                <p className="mt-1 font-mono text-sm text-gray-400">{qrPreview.token}</p>
                <button
                  type="button"
                  onClick={() =>
                    void downloadQR(qrPreview.token, qrPreview.name, qrPreview.subtitle)
                  }
                  className="btn-big mt-4 rounded-2xl bg-[#e85d00] px-8 text-white"
                >
                  ⬇️ {L("download")}
                </button>
              </div>
            ) : (
              <p className="py-12 text-center text-gray-500">{L("selectContractorQr")}</p>
            )}
          </Panel>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex justify-around px-1 py-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex min-h-[56px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-bold ${
                tab === t.key ? "text-[#e85d00]" : "text-gray-500"
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="truncate px-0.5">{L(t.label).split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </nav>
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
