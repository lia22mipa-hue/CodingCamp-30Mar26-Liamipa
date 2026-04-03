import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Wallet, LayoutDashboard, BarChart2 } from "lucide-react";
import Home from "@/pages/home";
import Reports from "@/pages/reports";
import { MonthlySnapshot, STORAGE_HISTORY, load } from "@/lib/storage";

const queryClient = new QueryClient();

type Tab = "home" | "reports";

function AppShell() {
  const [tab, setTab] = useState<Tab>("home");
  const [history, setHistory] = useState<MonthlySnapshot[]>(() =>
    load<MonthlySnapshot[]>(STORAGE_HISTORY, [])
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">
                Expense & Budget Visualizer
              </h1>
              <p className="text-xs text-slate-400">CodingCamp-30Mar26-Liamipa</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              data-testid="tab-home"
              onClick={() => setTab("home")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                tab === "home"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Bulan Ini
            </button>
            <button
              data-testid="tab-reports"
              onClick={() => setTab("reports")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                tab === "reports"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Laporan
              {history.length > 0 && (
                <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main>
        {tab === "home" ? (
          <Home history={history} onHistoryChange={setHistory} />
        ) : (
          <Reports history={history} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
