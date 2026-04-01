import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2, TrendingDown, Wallet, Tag } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Food", "Transport", "Fun"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "hsl(250, 84%, 60%)",
  Transport: "hsl(160, 60%, 45%)",
  Fun: "hsl(30, 90%, 55%)",
};

const CATEGORY_BG: Record<Category, string> = {
  Food: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Transport: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Fun: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const formSchema = z.object({
  name: z.string().min(1, "Nama barang wajib diisi"),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  category: z.enum(CATEGORIES, { required_error: "Pilih kategori" }),
});

type FormValues = z.infer<typeof formSchema>;

interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: Category;
  date: string;
}

const STORAGE_KEY = "expense-tracker-transactions";

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

function saveTransactions(txs: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: undefined,
      category: undefined,
    },
  });

  function onSubmit(values: FormValues) {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      name: values.name,
      amount: values.amount,
      category: values.category,
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setTransactions((prev) => [newTx, ...prev]);
    form.reset({ name: "", amount: undefined, category: undefined });
  }

  function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const chartData = CATEGORIES.map((cat) => ({
    name: cat,
    value: transactions
      .filter((tx) => tx.category === cat)
      .reduce((sum, tx) => sum + tx.amount, 0),
  })).filter((d) => d.value > 0);

  const categoryTotals = CATEGORIES.map((cat) => ({
    category: cat,
    total: transactions.filter((tx) => tx.category === cat).reduce((sum, tx) => sum + tx.amount, 0),
    count: transactions.filter((tx) => tx.category === cat).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Expense & Budget Visualizer</h1>
            <p className="text-xs text-muted-foreground">CodingCamp-30Mar26-Liamipa</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div
          data-testid="total-balance-card"
          className="rounded-2xl bg-gradient-to-br from-primary to-violet-700 p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80 mb-1">Total Pengeluaran</p>
              <p data-testid="total-balance" className="text-4xl font-bold tracking-tight">
                {formatRupiah(total)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/15">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex gap-3 flex-wrap">
            {categoryTotals.map(({ category, total: catTotal, count }) => (
              <div key={category} className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
                <span className="text-xs font-medium">{category}</span>
                <span className="text-xs opacity-70">{count > 0 ? formatRupiah(catTotal) : "–"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" />
              Tambah Pengeluaran
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Barang</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-name"
                          placeholder="Contoh: Nasi goreng, Ojek online..."
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
                      <FormLabel>Jumlah (Rp)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-amount"
                          type="number"
                          placeholder="Contoh: 25000"
                          min={1}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
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
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Pilih kategori..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Food">Food</SelectItem>
                          <SelectItem value="Transport">Transport</SelectItem>
                          <SelectItem value="Fun">Fun</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  data-testid="button-submit"
                  type="submit"
                  className="w-full"
                >
                  Tambah Pengeluaran
                </Button>
              </form>
            </Form>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Grafik Pengeluaran
            </h2>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Tag className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada data pengeluaran.</p>
                <p className="text-xs text-muted-foreground mt-1">Tambahkan transaksi untuk melihat grafik.</p>
              </div>
            ) : (
              <div data-testid="pie-chart" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name as Category]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatRupiah(value), "Pengeluaran"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Daftar Transaksi
            </h2>
            {transactions.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 font-medium">
                {transactions.length} transaksi
              </span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <Wallet className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Belum ada transaksi</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tambahkan pengeluaran pertama kamu di form di atas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  data-testid={`row-transaction-${tx.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[tx.category] + "22" }}
                  >
                    <span className="text-sm font-bold" style={{ color: CATEGORY_COLORS[tx.category] }}>
                      {tx.category[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BG[tx.category]}`}>
                        {tx.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      {formatRupiah(tx.amount)}
                    </p>
                    <button
                      data-testid={`button-delete-${tx.id}`}
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`Hapus transaksi ${tx.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
