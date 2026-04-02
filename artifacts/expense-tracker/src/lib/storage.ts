export const CATEGORY_KEYS = [
  "Food",
  "Transport",
  "Fun",
  "Belanja Bulanan",
  "Biaya Tak Terduga",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORIES = CATEGORY_KEYS;

export interface Expense {
  id: string;
  category: CategoryKey;
  amount: number;
  description: string;
  date: string;
}

export type BudgetMap = Record<CategoryKey, number>;
export type ActualMap = Record<CategoryKey, number>;

export interface MonthlySnapshot {
  id: string;
  month: number;
  year: number;
  budgets: BudgetMap;
  actuals: ActualMap;
  totalBudget: number;
  totalActual: number;
  archivedAt: string;
}

export const STORAGE_EXPENSES = "eviz-expenses-v2";
export const STORAGE_BUDGETS = "eviz-budgets-v2";
export const STORAGE_HISTORY = "eviz-history-v1";

export const DEFAULT_BUDGETS: BudgetMap = {
  Food: 0,
  Transport: 0,
  Fun: 0,
  "Belanja Bulanan": 0,
  "Biaya Tak Terduga": 0,
};

export const DEFAULT_ACTUALS: ActualMap = {
  Food: 0,
  Transport: 0,
  Fun: 0,
  "Belanja Bulanan": 0,
  "Biaya Tak Terduga": 0,
};

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export interface LeakInfo {
  category: CategoryKey;
  consecutiveMonths: number;
  isWidening: boolean;
  currentGap: number;
  previousGap: number;
}

export function detectLeaks(history: MonthlySnapshot[]): LeakInfo[] {
  if (history.length === 0) return [];

  const sorted = [...history].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );

  return CATEGORY_KEYS.map((cat) => {
    let consecutiveMonths = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const snap = sorted[i];
      if (snap.actuals[cat] > snap.budgets[cat] && snap.budgets[cat] > 0) {
        consecutiveMonths++;
      } else {
        break;
      }
    }

    const last = sorted[sorted.length - 1];
    const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

    const currentGap = last ? last.actuals[cat] - last.budgets[cat] : 0;
    const previousGap = prev ? prev.actuals[cat] - prev.budgets[cat] : 0;
    const isWidening = currentGap > 0 && previousGap > 0 && currentGap > previousGap;

    return { category: cat, consecutiveMonths, isWidening, currentGap, previousGap };
  }).filter((l) => l.consecutiveMonths >= 3 || l.isWidening);
}
