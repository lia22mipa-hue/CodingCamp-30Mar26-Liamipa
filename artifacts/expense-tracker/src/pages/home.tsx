import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusCircle,
  Trash2,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Archive,
  CheckCircle2,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_KEYS,
  CategoryKey,
  Expense,
  BudgetMap,
  MonthlySnapshot,
  DEFAULT_BUDGETS,
  STORAGE_EXPENSES,
  STORAGE_BUDGETS,
  STORAGE_HISTORY,
  MONTH_NAMES,
  formatRp,
  load,
  detectLeaks,
} from "@/lib/storage";

const CATEGORIES = [
  { key: "Food" as CategoryKey, label: "Food", emoji: "🍜", color: "indigo" },
  {
    key: "Transport" as CategoryKey,
    label: "Transport",
    emoji: "🚗",
    color: "sky",
  },
  { key: "Fun" as CategoryKey, label: "Fun", emoji: "🎉", color: "violet" },
  {
    key: "Belanja Bulanan" as CategoryKey,
    label: "Belanja Bulanan",
    emoji: "🛒",
    color: "emerald",
  },
  {
    key: "Biaya Tak Terduga" as CategoryKey,
    label: "Biaya Tak Terduga",
    emoji: "⚡",
    color: "amber",
  },
  {
    key: "Save Money" as CategoryKey,
    label: "Save Money",
    emoji: "💰",
    color: "teal",
  },
];

const COLOR_MAP: Record<
  string,
  {
    bar: string;
    badge: string;
    text: string;
    card: string;
    header: string;
    border: string;
    input: string;
  }
> = {
  indigo: {
    bar: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700",
    text: "text-indigo-600",
    card: "bg-gradient-to-br from-indigo-50 to-indigo-100/60",
    header: "text-indigo-800",
    border: "border-indigo-200",
    input: "border-indigo-200 bg-indigo-50/50 focus:ring-indigo-300",
  },
  sky: {
    bar: "bg-sky-500",
    badge: "bg-sky-100 text-sky-700",
    text: "text-sky-600",
    card: "bg-gradient-to-br from-sky-50 to-sky-100/60",
    header: "text-sky-800",
    border: "border-sky-200",
    input: "border-sky-200 bg-sky-50/50 focus:ring-sky-300",
  },
  violet: {
    bar: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
    text: "text-violet-600",
    card: "bg-gradient-to-br from-violet-50 to-violet-100/60",
    header: "text-violet-800",
    border: "border-violet-200",
    input: "border-violet-200 bg-violet-50/50 focus:ring-violet-300",
  },
  emerald: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-600",
    card: "bg-gradient-to-br from-emerald-50 to-emerald-100/60",
    header: "text-emerald-800",
    border: "border-emerald-200",
    input: "border-emerald-200 bg-emerald-50/50 focus:ring-emerald-300",
  },
  amber: {
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    text: "text-amber-600",
    card: "bg-gradient-to-br from-amber-50 to-amber-100/60",
    header: "text-amber-800",
    border: "border-amber-200",
    input: "border-amber-200 bg-amber-50/50 focus:ring-amber-300",
  },
  teal: {
    bar: "bg-teal-500",
    badge: "bg-teal-100 text-teal-700",
    text: "text-teal-600",
    card: "bg-gradient-to-br from-teal-50 to-teal-100/60",
    header: "text-teal-800",
    border: "border-teal-200",
    input: "border-teal-200 bg-teal-50/50 focus:ring-teal-300",
  },
};

const expenseSchema = z.object({
  category: z.string().min(1, "Pilih kategori"),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

interface Props {
  history: MonthlySnapshot[];
  onHistoryChange: (h: MonthlySnapshot[]) => void;
}

export default function Home({ history, onHistoryChange }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    load<Expense[]>(STORAGE_EXPENSES, []),
  );
  const [budgets, setBudgets] = useState<BudgetMap>(() =>
    load<BudgetMap>(STORAGE_BUDGETS, { ...DEFAULT_BUDGETS }),
  );
  const [budgetInputs, setBudgetInputs] = useState<Record<CategoryKey, string>>(
    () => {
      const stored = load<BudgetMap>(STORAGE_BUDGETS, { ...DEFAULT_BUDGETS });
      const result = {} as Record<CategoryKey, string>;
      for (const cat of CATEGORIES)
        result[cat.key] = stored[cat.key] > 0 ? String(stored[cat.key]) : "";
      return result;
    },
  );
  const [archiveSuccess, setArchiveSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem(STORAGE_BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "", amount: undefined, description: "" },
  });

  function onSubmit(values: ExpenseForm) {
    const newExp: Expense = {
      id: crypto.randomUUID(),
      category: values.category as CategoryKey,
      amount: values.amount,
      description: values.description,
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setExpenses((prev) => [newExp, ...prev]);
    form.reset({ category: "", amount: undefined, description: "" });
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function handleBudgetChange(catKey: CategoryKey, raw: string) {
    setBudgetInputs((prev) => ({ ...prev, [catKey]: raw }));
    const parsed = parseFloat(raw);
    setBudgets((prev) => ({
      ...prev,
      [catKey]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    }));
  }

  function handleArchive() {
    const now = new Date();
    const actuals = {} as Record<CategoryKey, number>;
    for (const cat of CATEGORY_KEYS) {
      actuals[cat] = expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
    }
    const totalBudget = CATEGORY_KEYS.reduce(
      (s, k) => s + (budgets[k] || 0),
      0,
    );
    const totalActual = CATEGORY_KEYS.reduce((s, k) => s + actuals[k], 0);

    const snap: MonthlySnapshot = {
      id: crypto.randomUUID(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      budgets: { ...budgets },
      actuals,
      totalBudget,
      totalActual,
      archivedAt: now.toISOString(),
    };
    const newHistory = [...history, snap];
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(newHistory));
    onHistoryChange(newHistory);

    setExpenses([]);
    setBudgets({ ...DEFAULT_BUDGETS });
    setBudgetInputs(
      Object.fromEntries(CATEGORY_KEYS.map((k) => [k, ""])) as Record<
        CategoryKey,
        string
      >,
    );
    setArchiveSuccess(true);
    setTimeout(() => setArchiveSuccess(false), 3000);
  }

  const getActual = useCallback(
    (catKey: CategoryKey) =>
      expenses
        .filter((e) => e.category === catKey)
        .reduce((s, e) => s + e.amount, 0),
    [expenses],
  );

  const totalBudgeted = CATEGORY_KEYS.reduce(
    (s, k) => s + (budgets[k] || 0),
    0,
  );
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPct =
    totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
  const isOverall = totalSpent > totalBudgeted && totalBudgeted > 0;

  const leaks = detectLeaks(history);
  const leakyCategories = new Set(leaks.map((l) => l.category));

  const now = new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ── DASHBOARD SUMMARY ── */}
      <section
        data-testid="dashboard-summary"
        className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white shadow-lg"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
              Dashboard Summary
            </p>
            <p className="text-sm opacity-60 mt-0.5">
              {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
            </p>
          </div>
          <button
            data-testid="button-archive"
            onClick={handleArchive}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0 ${
              archiveSuccess
                ? "bg-emerald-400/30 text-emerald-200"
                : "bg-white/15 hover:bg-white/25 text-white"
            }`}
          >
            {archiveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" /> Arsip Bulan Ini
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs opacity-70 mb-0.5">Total Budget</p>
            <p data-testid="total-budgeted" className="text-xl font-bold">
              {formatRp(totalBudgeted)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-70 mb-0.5">Total Spent</p>
            <p data-testid="total-spent" className="text-xl font-bold">
              {formatRp(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-70 mb-0.5">Sisa</p>
            <p
              data-testid="total-remaining"
              className={`text-xl font-bold ${isOverall ? "text-red-300" : "text-emerald-300"}`}
            >
              {formatRp(totalRemaining)}
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1 opacity-80">
            <span>Progress Pengeluaran</span>
            <span>{overallPct.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              data-testid="overall-progress-bar"
              className={`h-full rounded-full transition-all duration-500 ${isOverall ? "bg-red-400" : "bg-emerald-400"}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
        {isOverall && (
          <div className="mt-3 flex items-center gap-1.5 text-red-200 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Total pengeluaran melebihi budget keseluruhan!</span>
          </div>
        )}
        <p className="mt-4 text-xs opacity-50">
          Tekan "Arsip Bulan Ini" di akhir bulan untuk menyimpan data ke riwayat
          dan mereset bulan baru.
        </p>
      </section>

      {/* ── TAMBAH PENGELUARAN + SEMUA PENGELUARAN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-500" />
            Tambah Pengeluaran
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600">Deskripsi</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-description"
                        placeholder="Contoh: Nasi goreng, Bensin..."
                        className="bg-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600">
                      Jumlah (Rp)
                    </FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-amount"
                        type="number"
                        min={1}
                        placeholder="Contoh: 25000"
                        className="bg-slate-900"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600">Kategori</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          data-testid="select-category"
                          className="bg-slate-900"
                        >
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.emoji} {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Tambah Pengeluaran
              </Button>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Semua Pengeluaran
            </h2>
            {expenses.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5 font-medium">
                {expenses.length} transaksi
              </span>
            )}
          </div>
          {expenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Wallet className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Belum ada transaksi
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tambahkan pengeluaran menggunakan form di samping.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
              {expenses.map((exp) => {
                const cat = CATEGORIES.find((c) => c.key === exp.category);
                const colors = cat ? COLOR_MAP[cat.color] : COLOR_MAP.indigo;
                return (
                  <div
                    key={exp.id}
                    data-testid={`row-expense-${exp.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-900 transition-colors"
                  >
                    <span className="text-xl w-8 text-center">
                      {cat?.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {exp.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}
                        >
                          {exp.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {exp.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatRp(exp.amount)}
                      </span>
                      <button
                        data-testid={`button-delete-${exp.id}`}
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={`Hapus ${exp.description}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CATEGORY CARDS (horizontal scroll, 2 rows x 3 cols on desktop) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const actual = getActual(cat.key);
          const budget = budgets[cat.key] || 0;
          const remaining = budget - actual;
          const isOver = budget > 0 && actual > budget;
          const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
          const colors = COLOR_MAP[cat.color];
          const catExpenses = expenses.filter((e) => e.category === cat.key);
          const hasLeak = leakyCategories.has(cat.key);
          const leakInfo = leaks.find((l) => l.category === cat.key);

          return (
            <div
              key={cat.key}
              data-testid={`category-card-${cat.key}`}
              className={`rounded-2xl border shadow-sm p-4 flex flex-col gap-3 ${
                isOver
                  ? "border-red-300 bg-red-50"
                  : `${colors.card} ${colors.border}`
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span
                    className={`text-sm font-semibold ${isOver ? "text-red-700" : colors.header}`}
                  >
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {hasLeak && leakInfo?.isWidening && (
                    <span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">
                      MELEBAR
                    </span>
                  )}
                  {hasLeak && leakInfo && leakInfo.consecutiveMonths >= 3 && (
                    <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                      LEAK
                    </span>
                  )}
                  {isOver && (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Budget Plan (Rp)
                </label>
                <input
                  data-testid={`input-budget-${cat.key}`}
                  type="number"
                  min={0}
                  placeholder="0"
                  value={budgetInputs[cat.key]}
                  onChange={(e) => handleBudgetChange(cat.key, e.target.value)}
                  className={`w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${colors.input}`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Terpakai</span>
                  <span
                    className={
                      isOver ? "text-red-500 font-semibold" : colors.text
                    }
                  >
                    {formatRp(actual)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    data-testid={`progress-bar-${cat.key}`}
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : colors.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sisa</span>
                  <span
                    data-testid={`remaining-${cat.key}`}
                    className={`font-semibold ${isOver ? "text-red-500" : "text-emerald-600"}`}
                  >
                    {isOver
                      ? `−${formatRp(Math.abs(remaining))}`
                      : formatRp(remaining)}
                  </span>
                </div>
                {isOver && (
                  <p className="text-xs text-red-500 font-medium text-center mt-1">
                    Over budget!
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Daftar Pengeluaran
                  </p>
                  {catExpenses.length > 0 && (
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${colors.badge}`}
                    >
                      {catExpenses.length}
                    </span>
                  )}
                </div>
                {catExpenses.length === 0 ? (
                  <p className="text-xs text-slate-300 text-center py-3 italic">
                    Belum ada pengeluaran
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {catExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        data-testid={`cat-row-${exp.id}`}
                        className="flex items-start justify-between gap-1.5 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 truncate leading-tight">
                            {exp.description}
                          </p>
                          <p className="text-[10px] text-slate-300">
                            {exp.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span
                            className={`text-xs font-semibold ${isOver ? "text-red-500" : colors.text}`}
                          >
                            {formatRp(exp.amount)}
                          </span>
                          <button
                            data-testid={`cat-delete-${exp.id}`}
                            onClick={() => deleteExpense(exp.id)}
                            className="opacity-100 p-0.5 rounded text-slate-900 transition-all"
                            aria-label={`Hapus ${exp.description}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {catExpenses.length > 0 && (
                  <div
                    className={`mt-2 pt-2 border-t flex justify-between items-center ${isOver ? "border-red-100" : "border-slate-100"}`}
                  >
                    <span className="text-xs text-slate-400 font-medium">
                      Total
                    </span>
                    <span
                      className={`text-sm font-bold ${isOver ? "text-red-500" : colors.text}`}
                    >
                      {formatRp(actual)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
