/* ════════════════════════════════════
   Expense & Budget Visualizer – script.js
   CodingCamp RevoU – Liamipa
   Tech: Vanilla JS + Tailwind CDN + Chart.js CDN + LocalStorage
═══════════════════════════════════ */

"use strict";

// ─── Constants ───────────────────────────────────────────────
const STORAGE_TX       = "eviz-vanilla-transactions";
const STORAGE_BUDGETS  = "eviz-vanilla-budgets";
const CATEGORIES       = ["Food", "Transport", "Fun", "Save Money"];

const CAT_COLORS = {
  "Food":       "#6366f1",
  "Transport":  "#0ea5e9",
  "Fun":        "#8b5cf6",
  "Save Money": "#14b8a6",
};
const CAT_BADGE = {
  "Food":       "badge-food",
  "Transport":  "badge-transport",
  "Fun":        "badge-fun",
  "Save Money": "badge-savemoney",
};
const CAT_EMOJI = {
  "Food": "🍜", "Transport": "🚗", "Fun": "🎉", "Save Money": "💰",
};

// ─── State ───────────────────────────────────────────────────
let transactions = [];
let budgets      = {};
let pieChart     = null;

// ─── Helpers ─────────────────────────────────────────────────
const formatRp = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);

const $ = (id) => document.getElementById(id);

// ─── LocalStorage ────────────────────────────────────────────
function loadData() {
  try {
    const rawTx = localStorage.getItem(STORAGE_TX);
    transactions = rawTx ? JSON.parse(rawTx) : [];
  } catch { transactions = []; }

  try {
    const rawB = localStorage.getItem(STORAGE_BUDGETS);
    budgets = rawB ? JSON.parse(rawB) : {};
  } catch { budgets = {}; }

  CATEGORIES.forEach((cat) => {
    if (typeof budgets[cat] !== "number") budgets[cat] = 0;
  });
}

function saveTx() {
  localStorage.setItem(STORAGE_TX, JSON.stringify(transactions));
}

function saveBudgets() {
  localStorage.setItem(STORAGE_BUDGETS, JSON.stringify(budgets));
}

// ─── Totals ──────────────────────────────────────────────────
function getActual(cat) {
  return transactions
    .filter((t) => t.category === cat)
    .reduce((s, t) => s + t.amount, 0);
}

function getTotalBudget() {
  return CATEGORIES.reduce((s, c) => s + (budgets[c] || 0), 0);
}

function getTotalSpent() {
  return transactions.reduce((s, t) => s + t.amount, 0);
}

// ─── Render: Balance Header ───────────────────────────────────
function renderBalance() {
  const total   = getTotalBudget();
  const spent   = getTotalSpent();
  const balance = total - spent;

  $("total-balance").textContent = formatRp(balance < 0 ? 0 : balance);
  $("total-balance").style.color = balance < 0 ? "#ef4444" : "#0f172a";

  if (total > 0) {
    const pct = Math.min((spent / total) * 100, 100).toFixed(0);
    $("balance-sub").textContent = `Budget Rp ${(total / 1000).toFixed(0)}k · Spent ${pct}%`;
  } else {
    $("balance-sub").textContent = "Atur budget di kartu kategori di bawah.";
  }
}

// ─── Render: Transaction List ─────────────────────────────────
function renderTransactions() {
  const list  = $("tx-list");
  const empty = $("tx-empty");
  const count = $("tx-count");

  // Remove old rows (keep empty placeholder)
  const oldRows = list.querySelectorAll(".tx-item");
  oldRows.forEach((r) => r.remove());

  if (transactions.length === 0) {
    empty.classList.remove("hidden");
    count.textContent = "";
    return;
  }

  empty.classList.add("hidden");
  count.textContent = `${transactions.length} transaksi`;

  transactions.forEach((tx) => {
    const badgeClass = CAT_BADGE[tx.category] || "badge-food";
    const row = document.createElement("div");
    row.className = "tx-item flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors";
    row.dataset.id = tx.id;
    row.innerHTML = `
      <span class="text-xl w-8 text-center flex-shrink-0">${CAT_EMOJI[tx.category] || "📌"}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-800 truncate">${escapeHtml(tx.name)}</p>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}">${tx.category}</span>
          <span class="text-xs text-slate-400">${tx.date}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-sm font-semibold text-slate-700">${formatRp(tx.amount)}</span>
        <button class="tx-delete p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" data-id="${tx.id}" aria-label="Hapus transaksi">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
          </svg>
        </button>
      </div>
    `;
    list.appendChild(row);
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// ─── Render: Budget Cards ─────────────────────────────────────
function renderCards() {
  document.querySelectorAll(".budget-card").forEach((card) => {
    const cat    = card.dataset.cat;
    const actual = getActual(cat);
    const budget = budgets[cat] || 0;
    const remain = budget - actual;
    const pct    = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
    const isOver = budget > 0 && actual > budget;

    card.querySelector(".actual-val").textContent = formatRp(actual);
    card.querySelector(".remain-val").textContent = isOver
      ? `−${formatRp(Math.abs(remain))}`
      : formatRp(remain);
    card.querySelector(".progress-bar").style.width = pct + "%";

    const badge = card.querySelector(".over-badge");
    if (isOver) {
      badge.classList.remove("hidden");
      card.classList.add("is-over");
    } else {
      badge.classList.add("hidden");
      card.classList.remove("is-over");
    }
  });
}

// ─── Render: Pie Chart ────────────────────────────────────────
function renderChart() {
  const hasData = transactions.length > 0;

  $("chart-empty").classList.toggle("hidden", hasData);
  $("chart-wrap").classList.toggle("hidden", !hasData);

  const legend = $("chart-legend");
  legend.innerHTML = "";

  if (!hasData) {
    if (pieChart) { pieChart.destroy(); pieChart = null; }
    return;
  }

  const labels  = [];
  const data    = [];
  const colors  = [];

  CATEGORIES.forEach((cat) => {
    const val = getActual(cat);
    if (val > 0) {
      labels.push(cat);
      data.push(val);
      colors.push(CAT_COLORS[cat]);

      // Legend row
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-2";
      row.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${CAT_COLORS[cat]}"></span>
          <span class="text-sm text-slate-700">${CAT_EMOJI[cat]} ${cat}</span>
        </div>
        <span class="text-sm font-semibold text-slate-800">${formatRp(val)}</span>
      `;
      legend.appendChild(row);
    }
  });

  const ctx = $("pie-chart").getContext("2d");

  if (pieChart) {
    pieChart.data.labels   = labels;
    pieChart.data.datasets[0].data   = data;
    pieChart.data.datasets[0].backgroundColor = colors;
    pieChart.update();
  } else {
    pieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${formatRp(ctx.raw)}`,
            },
          },
        },
      },
    });
  }
}

// ─── Render All ───────────────────────────────────────────────
function renderAll() {
  renderBalance();
  renderTransactions();
  renderCards();
  renderChart();
}

// ─── Form Submit ──────────────────────────────────────────────
function handleFormSubmit(e) {
  e.preventDefault();

  const nameEl = $("item-name");
  const amtEl  = $("item-amount");
  const catEl  = $("item-category");

  const name   = nameEl.value.trim();
  const amount = parseFloat(amtEl.value);
  const cat    = catEl.value;

  // Validation
  let valid = true;

  if (!name) {
    showError("err-name", nameEl); valid = false;
  } else {
    clearError("err-name", nameEl);
  }

  if (!amount || amount <= 0 || isNaN(amount)) {
    showError("err-amount", amtEl); valid = false;
  } else {
    clearError("err-amount", amtEl);
  }

  if (!cat) {
    showError("err-category", catEl); valid = false;
  } else {
    clearError("err-category", catEl);
  }

  if (!valid) return;

  const tx = {
    id:       crypto.randomUUID(),
    name,
    amount,
    category: cat,
    date:     new Date().toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
    }),
  };

  transactions.unshift(tx);
  saveTx();
  renderAll();

  // Reset form
  nameEl.value = "";
  amtEl.value  = "";
  catEl.value  = "";
  clearError("err-name",     nameEl);
  clearError("err-amount",   amtEl);
  clearError("err-category", catEl);
}

function showError(errId, inputEl) {
  $(errId).classList.remove("hidden");
  $(errId).classList.add("visible");
  inputEl.classList.add("is-invalid");
}

function clearError(errId, inputEl) {
  $(errId).classList.add("hidden");
  $(errId).classList.remove("visible");
  inputEl.classList.remove("is-invalid");
}

// ─── Delete Transaction ───────────────────────────────────────
function handleDelete(e) {
  const btn = e.target.closest("[data-id]");
  if (!btn || !btn.classList.contains("tx-delete")) return;

  const id = btn.dataset.id;
  transactions = transactions.filter((t) => t.id !== id);
  saveTx();
  renderAll();
}

// ─── Budget Input ─────────────────────────────────────────────
function initBudgetInputs() {
  document.querySelectorAll(".budget-card").forEach((card) => {
    const cat   = card.dataset.cat;
    const input = card.querySelector(".budget-input");

    // Set initial value from saved budgets
    input.value = budgets[cat] > 0 ? budgets[cat] : "";

    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      budgets[cat] = isNaN(val) || val < 0 ? 0 : val;
      saveBudgets();
      renderBalance();
      renderCards();
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────
function init() {
  loadData();
  initBudgetInputs();

  $("expense-form").addEventListener("submit", handleFormSubmit);
  $("tx-list").addEventListener("click", handleDelete);

  // Clear errors on input
  ["item-name", "item-amount", "item-category"].forEach((id) => {
    const el = $(id);
    el.addEventListener("input",  () => el.classList.remove("is-invalid"));
    el.addEventListener("change", () => el.classList.remove("is-invalid"));
  });

  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
