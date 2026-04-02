import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart2 } from "lucide-react";
import {
  MonthlySnapshot, CATEGORY_KEYS, CategoryKey,
  MONTH_NAMES, formatRp, detectLeaks, LeakInfo,
} from "@/lib/storage";

const CAT_COLORS: Record<CategoryKey, string> = {
  Food: "#6366f1",
  Transport: "#0ea5e9",
  Fun: "#8b5cf6",
  "Belanja Bulanan": "#10b981",
  "Biaya Tak Terduga": "#f59e0b",
  "Save Money": "#14b8a6",
};

const CAT_EMOJIS: Record<CategoryKey, string> = {
  Food: "🍜",
  Transport: "🚗",
  Fun: "🎉",
  "Belanja Bulanan": "🛒",
  "Biaya Tak Terduga": "⚡",
  "Save Money": "💰",
};

interface Props {
  history: MonthlySnapshot[];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <BarChart2 className="w-10 h-10 text-slate-200 mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
      <p className="text-xs text-slate-300 mt-1">
        Gunakan tombol "Arsip Bulan Ini" untuk mulai merekam data historis.
      </p>
    </div>
  );
}

function CustomTooltipRp({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-slate-600">{p.name}</span>
          </span>
          <span className="font-semibold text-slate-800">{formatRp(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reports({ history }: Props) {
  const sorted = useMemo(
    () => [...history].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
    [history]
  );

  const last12 = sorted.slice(-12);

  const monthlyBarData = last12.map((s) => ({
    name: `${MONTH_NAMES[s.month - 1]} '${String(s.year).slice(2)}`,
    "Total Budget": s.totalBudget,
    "Total Spent": s.totalActual,
  }));

  const stackedData = last12.map((s) => {
    const row: Record<string, string | number> = {
      name: `${MONTH_NAMES[s.month - 1]} '${String(s.year).slice(2)}`,
    };
    for (const cat of CATEGORY_KEYS) {
      row[cat] = s.actuals[cat] || 0;
    }
    return row;
  });

  const yearlyMap: Record<number, number> = {};
  for (const s of sorted) {
    yearlyMap[s.year] = (yearlyMap[s.year] || 0) + s.totalActual;
  }
  const yearlyData = Object.entries(yearlyMap).map(([year, total]) => ({
    name: year,
    "Total Tahunan": total,
  }));

  const leaks: LeakInfo[] = useMemo(() => detectLeaks(history), [history]);

  const highestMonth = last12.reduce<MonthlySnapshot | null>(
    (max, s) => (!max || s.totalActual > max.totalActual ? s : max),
    null
  );

  const avgMonthly =
    last12.length > 0
      ? last12.reduce((sum, s) => sum + s.totalActual, 0) / last12.length
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-400 mb-1">Total Bulan Direkam</p>
          <p className="text-3xl font-bold text-indigo-600">{history.length}</p>
          <p className="text-xs text-slate-400 mt-1">snapshot tersimpan</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-400 mb-1">Rata-rata Pengeluaran/Bulan</p>
          <p className="text-2xl font-bold text-slate-700">{formatRp(avgMonthly)}</p>
          <p className="text-xs text-slate-400 mt-1">12 bulan terakhir</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-400 mb-1">Bulan Tertinggi</p>
          {highestMonth ? (
            <>
              <p className="text-2xl font-bold text-slate-700">{formatRp(highestMonth.totalActual)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {MONTH_NAMES[highestMonth.month - 1]} {highestMonth.year}
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-300">–</p>
          )}
        </div>
      </div>

      {leaks.length > 0 && (
        <section className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-base font-bold text-red-700">Financial Health — Leak Detection</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leaks.map((leak) => (
              <div
                key={leak.category}
                className="bg-white border border-red-200 rounded-xl p-4 flex items-start gap-3"
              >
                <span className="text-2xl mt-0.5">{CAT_EMOJIS[leak.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-slate-700">{leak.category}</p>
                    {leak.consecutiveMonths >= 3 && (
                      <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        OVER {leak.consecutiveMonths} BULAN BERTURUT
                      </span>
                    )}
                    {leak.isWidening && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" />
                        CELAH MELEBAR
                      </span>
                    )}
                  </div>
                  {leak.consecutiveMonths >= 3 && (
                    <p className="text-xs text-slate-500">
                      Melebihi budget selama <span className="font-semibold text-red-600">{leak.consecutiveMonths} bulan berturut-turut</span>.
                    </p>
                  )}
                  {leak.isWidening && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Selisih membesar dari{" "}
                      <span className="font-semibold">{formatRp(leak.previousGap)}</span> →{" "}
                      <span className="font-semibold text-red-600">{formatRp(leak.currentGap)}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {leaks.length === 0 && history.length > 0 && (
        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Keuangan Sehat!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Tidak ada kategori yang melebihi budget secara berturut-turut. Pertahankan!
            </p>
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-500" />
          Perbandingan Budget vs Actual (12 Bulan)
        </h2>
        <p className="text-xs text-slate-400 mb-5">Perbandingan rencana vs realisasi pengeluaran tiap bulan</p>
        {monthlyBarData.length === 0 ? (
          <EmptyState message="Belum ada data historis" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyBarData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltipRp />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Total Budget" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Total Spent" radius={[4, 4, 0, 0]}>
                {monthlyBarData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry["Total Spent"] > entry["Total Budget"] ? "#ef4444" : "#6366f1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-violet-500" />
          Stacked — Breakdown Kategori per Bulan
        </h2>
        <p className="text-xs text-slate-400 mb-5">Lihat kategori mana yang mendominasi pengeluaran setiap bulan</p>
        {stackedData.length === 0 ? (
          <EmptyState message="Belum ada data historis" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stackedData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltipRp />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {CATEGORY_KEYS.map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} radius={cat === "Save Money" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Tren Tahunan
        </h2>
        <p className="text-xs text-slate-400 mb-5">Total pengeluaran per tahun — melihat tren naik atau turun</p>
        {yearlyData.length === 0 ? (
          <EmptyState message="Belum ada data historis" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltipRp />} />
              <Line
                type="monotone"
                dataKey="Total Tahunan"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {history.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Riwayat Snapshot Bulanan</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {[...sorted].reverse().map((s) => (
              <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{MONTH_NAMES[s.month - 1]}</span>
                  <span className="text-[10px] text-indigo-400">{s.year}</span>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Budget</p>
                    <p className="font-semibold text-slate-700">{formatRp(s.totalBudget)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Actual</p>
                    <p className={`font-semibold ${s.totalActual > s.totalBudget ? "text-red-500" : "text-emerald-600"}`}>
                      {formatRp(s.totalActual)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Sisa</p>
                    <p className={`font-semibold ${s.totalActual > s.totalBudget ? "text-red-500" : "text-slate-700"}`}>
                      {formatRp(s.totalBudget - s.totalActual)}
                    </p>
                  </div>
                </div>
                {s.totalActual > s.totalBudget && (
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
