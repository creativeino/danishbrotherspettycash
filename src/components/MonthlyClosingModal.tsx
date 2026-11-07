"use client";

import { useMemo, useState } from "react";
import { X, Calendar, TrendingUp, TrendingDown, DollarSign, Download, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import * as XLSX from "xlsx";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description: string;
  personName?: string | null;
  paymentMode: string;
  date: string;
}

interface MonthlyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export default function MonthlyClosingModal({
  isOpen,
  onClose,
  transactions,
}: MonthlyClosingModalProps) {
  // Available Year-Months from transactions
  const monthsList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      set.add(key);
    });
    const arr = Array.from(set).sort().reverse();
    if (arr.length === 0) {
      const now = new Date();
      arr.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(monthsList[0] || "");

  const activeMonth = selectedMonth || monthsList[0];

  // Compute breakdown for selected month
  const monthlyData = useMemo(() => {
    if (!activeMonth) {
      return {
        monthRevenue: 0,
        monthExpense: 0,
        netProfit: 0,
        categoryExpenseBreakdown: {} as Record<string, number>,
        categoryRevenueBreakdown: {} as Record<string, number>,
        monthTransactions: [] as Transaction[],
      };
    }

    const [yearStr, monthStr] = activeMonth.split("-");
    const targetYear = parseInt(yearStr, 10);
    const targetMonth = parseInt(monthStr, 10) - 1; // 0-indexed

    let monthRevenue = 0;
    let monthExpense = 0;
    const categoryExpenseBreakdown: Record<string, number> = {};
    const categoryRevenueBreakdown: Record<string, number> = {};
    const monthTransactions: Transaction[] = [];

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
        monthTransactions.push(tx);
        if (tx.type === "INCOME") {
          monthRevenue += tx.amount;
          categoryRevenueBreakdown[tx.category] = (categoryRevenueBreakdown[tx.category] || 0) + tx.amount;
        } else {
          monthExpense += tx.amount;
          categoryExpenseBreakdown[tx.category] = (categoryExpenseBreakdown[tx.category] || 0) + tx.amount;
        }
      }
    });

    return {
      monthRevenue,
      monthExpense,
      netProfit: monthRevenue - monthExpense,
      categoryExpenseBreakdown,
      categoryRevenueBreakdown,
      monthTransactions,
    };
  }, [transactions, activeMonth]);

  const formatMonthName = (monthKey: string) => {
    if (!monthKey) return "";
    const [y, m] = monthKey.split("-");
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  const exportMonthlyReportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryRows = [
      { Metric: "Month", Value: formatMonthName(activeMonth) },
      { Metric: "Total Revenue / Inflow (PKR)", Value: monthlyData.monthRevenue },
      { Metric: "Total Expenses / Outflow (PKR)", Value: monthlyData.monthExpense },
      { Metric: "Net Profit / Monthly Cash Margin (PKR)", Value: monthlyData.netProfit },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Month Summary");

    // Expenses Breakdown Sheet
    const expRows = Object.entries(monthlyData.categoryExpenseBreakdown).map(([category, amount]) => ({
      Category: category,
      "Expense Amount (PKR)": amount,
      "Percentage of Total": monthlyData.monthExpense > 0 ? `${((amount / monthlyData.monthExpense) * 100).toFixed(1)}%` : "0%",
    }));
    const wsExp = XLSX.utils.json_to_sheet(expRows);
    wsExp["!cols"] = [{ wch: 30 }, { wch: 22 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsExp, "Expenses by Category");

    // All month transactions
    const txRows = monthlyData.monthTransactions.map((tx, idx) => ({
      "Sr #": idx + 1,
      "Date": formatDateTime(tx.date),
      "Type": tx.type,
      "Category": tx.category,
      "Description": tx.description,
      "Staff/Client": tx.personName || "—",
      "Payment Mode": tx.paymentMode,
      "Amount (PKR)": tx.amount,
    }));
    const wsTx = XLSX.utils.json_to_sheet(txRows);
    wsTx["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 10 },
      { wch: 20 },
      { wch: 35 },
      { wch: 20 },
      { wch: 14 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, "Month Ledger");

    XLSX.writeFile(wb, `Monthly_Closing_${activeMonth}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 my-auto sm:my-8 animate-modal-enter">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2041ce] text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Monthly Closing, Expense & Revenue Audit
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Select any billing month to evaluate monthly gross revenue, total expenses, net profit margin, and category audit.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Month Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Closing Month:
            </span>
            <select
              value={activeMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2041ce]"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportMonthlyReportToExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Monthly Report (Excel)</span>
          </button>
        </div>

        {/* 3 Main Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {/* Revenue */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950/60 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Monthly Revenue / Inflow
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
              {formatCurrency(monthlyData.monthRevenue)}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600/80">
              Total funds & site payments received
            </p>
          </div>

          {/* Expenses */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/60 dark:bg-rose-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
                Monthly Expenses
              </span>
              <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-600">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black text-rose-700 dark:text-rose-300 tabular-nums">
              {formatCurrency(monthlyData.monthExpense)}
            </div>
            <p className="mt-1 text-[11px] text-rose-600/80">
              Fuel, utilities, site costs & petty cash out
            </p>
          </div>

          {/* Net Profit */}
          <div className={`rounded-xl border p-4 ${
            monthlyData.netProfit >= 0
              ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20"
              : "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Net Monthly Margin
              </span>
              <div className="rounded-lg bg-blue-500/10 p-1.5 text-[#2041ce]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-2 text-xl font-black tabular-nums ${
              monthlyData.netProfit >= 0 ? "text-[#2041ce] dark:text-blue-400" : "text-amber-600"
            }`}>
              {formatCurrency(monthlyData.netProfit)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {monthlyData.netProfit >= 0 ? "Surplus / Retained Margin" : "Net Deficit for this month"}
            </p>
          </div>
        </div>

        {/* Expenses Category Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-[#070b14] mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <span>Expenses Breakdown by Category ({formatMonthName(activeMonth)})</span>
          </h3>
          {Object.keys(monthlyData.categoryExpenseBreakdown).length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No expenses recorded for this month.
            </div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(monthlyData.categoryExpenseBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const pct = monthlyData.monthExpense > 0 ? (amount / monthlyData.monthExpense) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span>
                          <span className="tabular-nums text-rose-600 dark:text-rose-400 font-bold">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <span className="text-xs text-slate-500">
            Total recorded transactions this month: <strong>{monthlyData.monthTransactions.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
