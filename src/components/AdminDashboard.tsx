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
import { LoadingSpinner } from "./LoadingSpinner";
import { SupabaseSetupPanel } from "./SupabaseSetupPanel";
import { BilingualField } from "./BilingualField";
import { bilingualDisplay, englishToTelugu } from "@/lib/transliterate";
import { SHOP_NAME } from "@/lib/constants";
import { formatINR } from "@/lib/currency";
import { adminFetch, clearAdminPinSession } from "@/lib/session";
import { downloadQR, generateQRDataUrl } from "@/lib/qr-utils";
import { TRANSACTION_REASONS } from "@/lib/types";
import type { Category, Contractor, RewardLevel, Transaction } from "@/lib/types";

type Tab = "overview" | "contractors" | "amounts" | "leaderboard" | "rewards" | "targets" | "qr";

export function AdminDashboard({ hasSupabase = true }: { hasSupabase?: boolean }) {
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
  const [qrPreview, setQrPreview] = useState<{ url: string; token: string; name: string } | null>(
    null
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [statsRes, dataRes] = await Promise.all([
        adminFetch("/api/admin"),
        adminFetch("/api/admin", { method: "PATCH" }),
      ]);
      if (statsRes.status === 401 || dataRes.status === 401) {
        setLoadError("Session expired. Please log in again.");
        return;
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (dataRes.ok) {
        const d = await dataRes.json();
        const cats: Category[] = d.categories ?? [];
        setContractors(d.contractors ?? []);
        setCategories(cats);
        setRewardLevels(d.rewardLevels ?? []);
        setTransactions(d.transactions ?? []);
        setRewards(d.rewards ?? []);
        setNewContractor((p) => ({
          ...p,
          category_id: p.category_id || cats[0]?.id || "",
        }));
        setTxForm((p) => ({
          ...p,
          contractor_id: p.contractor_id || d.contractors?.[0]?.id || "",
        }));
      } else if (dataRes.status === 503) {
        setLoadError("Supabase not configured. Add keys to .env.local and run SQL migrations.");
      } else {
        const err = await dataRes.json().catch(() => ({}));
        setLoadError(String(err.error ?? err.message ?? "Could not load data from database."));
      }
    } catch {
      setLoadError("Could not load data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadAll fetches server data on mount
    void loadAll();
  }, [loadAll]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const postAction = async (body: Record<string, unknown>) => {
    const res = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(String(data.message ?? data.error ?? "Action failed. Please try again."));
      return false;
    }
    showToast("Saved successfully! | విజయవంతంగా సేవ్ అయింది!");
    await loadAll();
    return true;
  };

  const showQR = async (token: string, name: string) => {
    const url = await generateQRDataUrl(token);
    setQrPreview({ url, token, name });
  };

  const logout = () => {
    clearAdminPinSession();
    window.location.href = "/";
  };

  if (loading && !stats) {
    return <LoadingSpinner message="Loading dashboard... | డాష్‌బోర్డ్ లోడ్..." />;
  }

  if (loadError && !hasSupabase) {
    return (
      <div className="min-h-screen bg-[#fff8f0]">
        <header className="bg-[#e85d00] px-4 py-6 text-center text-white">
          <h1 className="text-2xl font-black">{SHOP_NAME}</h1>
          <p className="mt-1 text-lg">అడ్మిన్ | Admin</p>
        </header>
        <div className="mx-auto max-w-lg p-4">
          <SupabaseSetupPanel />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-lg font-bold text-gray-900">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[48px] rounded-xl bg-[#FF6B00] px-8 font-bold text-white"
        >
          Try Again | మళ్ళీ ప్రయత్నించండి
        </button>
      </div>
    );
  }

  const chartData = (stats?.leaderboard ?? []).slice(0, 8).map((e) => ({
    name: e.name_telugu.slice(0, 10),
    amount: Number(e.total_amount),
  }));

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "📊 Overview" },
    { key: "contractors", label: "👷 Contractors" },
    { key: "amounts", label: "₹ Amounts" },
    { key: "leaderboard", label: "🏆 Leaderboard" },
    { key: "rewards", label: "🎁 Rewards" },
    { key: "targets", label: "🎯 Targets" },
    { key: "qr", label: "📱 QR" },
  ];

  return (
    <div className="min-h-screen bg-[#fff8f0]">
      {!hasSupabase && (
        <div className="mx-auto max-w-4xl p-4">
          <SupabaseSetupPanel />
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-3 text-center text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <header className="sticky top-0 z-50 bg-[#e85d00] px-4 py-5 text-white shadow-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-xs uppercase opacity-80">Admin | అడ్మిన్</p>
            <h1 className="text-xl font-bold">{SHOP_NAME}</h1>
          </div>
          <button type="button" onClick={logout} className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold">
            Logout
          </button>
        </div>
      </header>

      <nav className="sticky top-[72px] z-40 overflow-x-auto border-b bg-white">
        <div className="mx-auto flex max-w-4xl gap-1 p-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`min-h-[48px] shrink-0 rounded-lg px-3 text-sm font-semibold ${
                tab === t.key ? "bg-[#FF6B00] text-white" : "bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-4 p-4 pb-8">
        <SupabaseSetupPanel />

        {tab === "overview" && stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Active Contractors" value={stats.totalActive} />
              <StatCard label="This Month Total" value={formatINR(stats.monthTotalAmount)} isText />
              <StatCard
                label="Top This Month | ఈ నెల టాప్"
                value={stats.topContractor?.name_telugu ?? "—"}
                isText
              />
              <StatCard label="Target Achieved" value={stats.targetAchievedCount} />
            </div>
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-4 font-bold">Monthly Amount Chart | నెలవారీ మొత్తం</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} fontSize={12} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} />
                  <Bar dataKey="amount" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === "contractors" && (
          <>
            <Panel title="Add Contractor | కాంట్రాక్టర్ జోడించండి">
              <p className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                ✨ Type in <strong>English only</strong> — Telugu fills automatically.
                Both will be saved and shown everywhere.
                <br />
                <span className="text-xs opacity-90">
                  ఇంగ్లీష్ లో టైప్ చేయండి — తెలుగు ఆటోమేటిక్ గా వస్తుంది
                </span>
              </p>
              <div className="grid gap-3">
                <BilingualField
                  englishLabel="Name (English) | పేరు"
                  teluguLabel="పేరు (తెలుగు) — Auto"
                  englishValue={newContractor.name_english}
                  teluguValue={newContractor.name_telugu}
                  onEnglishChange={(v) =>
                    setNewContractor((p) => ({ ...p, name_english: v }))
                  }
                  onTeluguChange={(v) =>
                    setNewContractor((p) => ({ ...p, name_telugu: v }))
                  }
                  englishPlaceholder="e.g. Rohith Kumar"
                  required
                />

                <label className="text-sm font-semibold">
                  Phone | ఫోన్ *
                  <input
                    value={newContractor.phone}
                    onChange={(e) =>
                      setNewContractor((p) => ({
                        ...p,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    placeholder="10 digit mobile — e.g. 9876543210"
                    inputMode="numeric"
                    className="mt-1 min-h-[48px] w-full rounded-xl border px-4"
                  />
                </label>

                <BilingualField
                  englishLabel="Village (English) | గ్రామం"
                  teluguLabel="గ్రామం (తెలుగు) — Auto"
                  englishValue={newContractor.village_english}
                  teluguValue={newContractor.village_telugu}
                  onEnglishChange={(v) =>
                    setNewContractor((p) => ({ ...p, village_english: v }))
                  }
                  onTeluguChange={(v) =>
                    setNewContractor((p) => ({ ...p, village_telugu: v }))
                  }
                  englishPlaceholder="e.g. Palakurthy"
                />

                <label className="text-sm font-semibold">
                  Category | వర్గం
                  <select
                    value={newContractor.category_id}
                    onChange={(e) =>
                      setNewContractor((p) => ({ ...p, category_id: e.target.value }))
                    }
                    className="mt-1 min-h-[48px] w-full rounded-xl border px-4"
                    disabled={loading || categories.length === 0}
                  >
                    {!newContractor.category_id && (
                      <option value="">Select category | వర్గం ఎంచుకోండి</option>
                    )}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_english} | {c.name_telugu}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const nameEn = newContractor.name_english.trim();
                    let nameTe = newContractor.name_telugu.trim();
                    if (!nameTe && nameEn) nameTe = englishToTelugu(nameEn);

                    if (!nameEn) {
                      showToast("Please enter name in English | ఇంగ్లీష్ లో పేరు నమోదు చేయండి");
                      return;
                    }
                    if (newContractor.phone.length < 10) {
                      showToast("Please enter 10-digit phone | 10 అంకెల ఫోన్ నమోదు చేయండి");
                      return;
                    }

                    const villageEn = newContractor.village_english.trim() || nameEn;
                    let villageTe = newContractor.village_telugu.trim();
                    if (!villageTe && newContractor.village_english.trim()) {
                      villageTe = englishToTelugu(newContractor.village_english);
                    }
                    if (!villageTe) villageTe = villageEn;

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
                  className="min-h-[52px] rounded-xl bg-[#FF6B00] text-lg font-bold text-white"
                >
                  ➕ Add & Generate QR | జోడించండి
                </button>
              </div>
            </Panel>
            <Panel title="Contractors List">
              {contractors.map((c) => (
                <div key={c.id} className="mb-2 flex flex-wrap items-center gap-2 border-b py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {bilingualDisplay(c.name_english, c.name_telugu)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.qr_token} • {c.phone} •{" "}
                      {bilingualDisplay(c.village_english, c.village_telugu)} •{" "}
                      {c.is_active ? "Active | సక్రియ" : "Inactive"}
                    </p>
                  </div>
                  <button type="button" onClick={() => showQR(c.qr_token, c.name_telugu)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm">QR</button>
                  <button type="button" onClick={() => downloadQR(c.qr_token, c.name_telugu)} className="rounded-lg bg-blue-100 px-3 py-2 text-sm">⬇️</button>
                  {c.is_active && (
                    <button
                      type="button"
                      onClick={() =>
                        postAction({ action: "update_contractor", id: c.id, is_active: false })
                      }
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              ))}
            </Panel>
          </>
        )}

        {tab === "amounts" && (
          <>
            <Panel title="Add Amount | మొత్తం జోడించండి">
              <div className="grid gap-3">
                <label className="text-sm font-semibold">
                  Contractor | కాంట్రాక్టర్
                  <select
                    value={txForm.contractor_id}
                    onChange={(e) => setTxForm((p) => ({ ...p, contractor_id: e.target.value }))}
                    className="mt-1 min-h-[48px] w-full rounded-xl border px-4"
                  >
                    {contractors.filter((c) => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>
                        {bilingualDisplay(c.name_english, c.name_telugu)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Amount (₹) | మొత్తం
                  <input
                    type="number"
                    min={1}
                    value={txForm.amount}
                    onChange={(e) => setTxForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                    className="mt-1 min-h-[48px] w-full rounded-xl border px-4"
                    placeholder="e.g. 5000"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Reason | కారణం
                  <select
                    value={txForm.reasonIdx}
                    onChange={(e) => setTxForm((p) => ({ ...p, reasonIdx: Number(e.target.value) }))}
                    className="mt-1 min-h-[48px] w-full rounded-xl border px-4"
                  >
                    {TRANSACTION_REASONS.map((r, i) => (
                      <option key={r.en} value={i}>
                        {r.en} | {r.te}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Date | తేదీ
                  <input
                    type="date"
                    value={txForm.transaction_date}
                    onChange={(e) => setTxForm((p) => ({ ...p, transaction_date: e.target.value }))}
                    className="mt-1 min-h-[48px] w-full rounded-xl border px-4"
                  />
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
                  className="min-h-[48px] rounded-xl bg-[#FF6B00] font-bold text-white"
                >
                  Save Transaction
                </button>
              </div>
            </Panel>
            <Panel title="Recent Transactions | ఇటీవలి చరిత్ర">
              {transactions.slice(0, 20).map((tx) => {
                const c = contractors.find((x) => x.id === tx.contractor_id);
                return (
                  <div key={tx.id} className="flex justify-between border-b py-2 text-sm">
                    <span>
                      {c ? bilingualDisplay(c.name_english, c.name_telugu) : "—"} —{" "}
                      {tx.reason_english} | {tx.reason_telugu}
                    </span>
                    <span className="font-bold text-green-600">+{formatINR(Number(tx.amount))}</span>
                  </div>
                );
              })}
            </Panel>
          </>
        )}

        {tab === "leaderboard" && stats && (
          <Panel title="This Month Leaderboard">
            {stats.leaderboard.map((e, i) => (
              <div key={i} className="flex items-center gap-3 border-b py-2">
                <span className="font-bold text-[#FF6B00]">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold">{e.name_telugu}</p>
                  <p className="text-xs text-gray-500">{e.category_telugu}</p>
                </div>
                <span className="font-black">{formatINR(Number(e.total_amount))}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const canvas = document.createElement("canvas");
                const leaders = stats.leaderboard.slice(0, 10);
                canvas.width = 600;
                canvas.height = 80 + leaders.length * 44;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.fillStyle = "#FFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#FF6B00";
                ctx.font = "bold 22px sans-serif";
                ctx.fillText(`${SHOP_NAME} - Monthly Winners`, 20, 40);
                ctx.fillStyle = "#333";
                ctx.font = "18px sans-serif";
                leaders.forEach((e, i) => {
                  ctx.fillText(`${i + 1}. ${e.name_telugu} - ${formatINR(Number(e.total_amount))}`, 20, 80 + i * 44);
                });
                const link = document.createElement("a");
                link.download = "ravali-leaderboard.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
              }}
              className="mt-4 min-h-[48px] w-full rounded-xl bg-green-600 font-bold text-white"
            >
              Export for WhatsApp
            </button>
          </Panel>
        )}

        {tab === "rewards" && (
          <>
            <Panel title="Mark Reward Delivered">
              <div className="grid gap-3">
                <select id="rw-contractor" className="min-h-[48px] rounded-xl border px-4">
                  {contractors.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name_telugu}</option>
                  ))}
                </select>
                <select id="rw-level" className="min-h-[48px] rounded-xl border px-4">
                  {rewardLevels.map((l) => (
                    <option key={l.id} value={l.id}>{l.icon} {l.level_name_telugu}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const contractor_id = (document.getElementById("rw-contractor") as HTMLSelectElement).value;
                    const reward_level_id = (document.getElementById("rw-level") as HTMLSelectElement).value;
                    postAction({ action: "deliver_reward", contractor_id, reward_level_id });
                  }}
                  className="min-h-[48px] rounded-xl bg-[#FF6B00] font-bold text-white"
                >
                  Mark Delivered ✅
                </button>
              </div>
            </Panel>
            <Panel title="Delivery History">
              {rewards.map((r) => (
                <div key={String(r.id)} className="border-b py-2 text-sm">
                  {(r.contractors as { name_telugu: string })?.name_telugu} —{" "}
                  {(r.reward_levels as { level_name_telugu: string })?.level_name_telugu} ✅
                </div>
              ))}
            </Panel>
          </>
        )}

        {tab === "targets" && (
          <Panel title="Category Monthly Targets | నెలవారీ లక్ష్యాలు">
            {categories.map((cat) => (
              <div key={cat.id} className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4">
                <span className="text-2xl">{cat.icon}</span>
                <span className="flex-1 font-semibold">{cat.name_english} | {cat.name_telugu}</span>
                <input
                  type="number"
                  defaultValue={cat.monthly_target_amount}
                  id={`target-${cat.id}`}
                  className="min-h-[44px] w-32 rounded-lg border px-2"
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
                  className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-bold text-white"
                >
                  Save
                </button>
              </div>
            ))}
          </Panel>
        )}

        {tab === "qr" && (
          <Panel title="QR Generator">
            {qrPreview ? (
              <div className="text-center">
                <p className="mb-2 font-bold">{qrPreview.name}</p>
                <img src={qrPreview.url} alt="QR" className="mx-auto rounded-xl" />
                <p className="mt-2 font-mono text-sm">{qrPreview.token}</p>
                <button
                  type="button"
                  onClick={() => downloadQR(qrPreview.token, qrPreview.name)}
                  className="mt-3 min-h-[48px] rounded-xl bg-[#FF6B00] px-6 font-bold text-white"
                >
                  Download PNG
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Select a contractor from Contractors tab → QR</p>
            )}
          </Panel>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  isText,
}: {
  label: string;
  value: string | number;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className={`font-black text-[#FF6B00] ${isText ? "text-lg" : "text-3xl"}`}>{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
