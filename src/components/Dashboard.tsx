"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  Fuel,
  Car,
  Coffee,
  Receipt,
  Camera,
  Laptop,
  Trash2,
  Search,
  Download,
  Printer,
  Eye,
  X,
  CreditCard,
  Banknote,
  Sun,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart,
  LogOut,
  Menu,
  FileSpreadsheet,
  CheckCircle2,
  Edit2,
  History,
  Filter,
} from "lucide-react";
import AddTransactionModal from "@/components/AddTransactionModal";
import DayClosingModal from "@/components/DayClosingModal";
import ClosingHistoryModal from "@/components/ClosingHistoryModal";
import VoucherModal from "@/components/VoucherModal";
import LoginScreen from "@/components/auth/LoginScreen";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description: string;
  personName?: string | null;
  paymentMode: string;
  slipNumber?: string | null;
  receiptImage?: string | null;
  date: string;
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [voucherTx, setVoucherTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [modalType, setModalType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [modalCategory, setModalCategory] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<"dashboard" | "expenses" | "incomes">("dashboard");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [todayStr, setTodayStr] = useState<string>("");
  const [dateBoundaries, setDateBoundaries] = useState<{
    today: number;
    oneWeekAgo: number;
    startOfMonth: number;
  }>({ today: 0, oneWeekAgo: 0, startOfMonth: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setTodayStr(now.toISOString().split("T")[0]);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    setDateBoundaries({ today, oneWeekAgo, startOfMonth });

    const auth = localStorage.getItem("danibro_logged_in");
    setIsAuthenticated(auth === "true");
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("danibro_logged_in");
    setIsAuthenticated(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this record?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const openAddModal = (type: "EXPENSE" | "INCOME", category?: string) => {
    setEditingTx(null);
    setModalType(type);
    setModalCategory(category);
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setModalType(tx.type);
    setModalCategory(tx.category);
    setIsModalOpen(true);
  };

  // Calculations
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let siteVisitIncome = 0;
    let fuelExpense = 0;
    let siteVisitExpense = 0;
    let entertainmentExpense = 0;
    let billingExpense = 0;
    let cashInHand = 0;

    let todayIncome = 0;
    let todayExpense = 0;

    transactions.forEach((tx) => {
      const isToday = todayStr ? tx.date.startsWith(todayStr) : false;

      if (tx.type === "INCOME") {
        totalIncome += tx.amount;
        if (isToday) todayIncome += tx.amount;
        if (tx.category.toLowerCase().includes("site visit")) {
          siteVisitIncome += tx.amount;
        }
        if (tx.paymentMode === "CASH") cashInHand += tx.amount;
      } else {
        totalExpense += tx.amount;
        if (isToday) todayExpense += tx.amount;
        const cat = tx.category.toLowerCase();
        if (cat.includes("fuel")) fuelExpense += tx.amount;
        else if (cat.includes("site visit")) siteVisitExpense += tx.amount;
        else if (cat.includes("entertainment")) entertainmentExpense += tx.amount;
        else if (cat.includes("billing") || cat.includes("utilities"))
          billingExpense += tx.amount;

        if (tx.paymentMode === "CASH") cashInHand -= tx.amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      cashInHand,
      todayIncome,
      todayExpense,
      todayBalance: todayIncome - todayExpense,
      siteVisitIncome,
      fuelExpense,
      siteVisitExpense,
      entertainmentExpense,
      billingExpense,
    };
  }, [transactions, todayStr]);

  // Export CSV
  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert("No data available to export");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Category",
      "Description",
      "Staff/Client",
      "Payment Mode",
      "Slip #",
      "Amount (PKR)",
    ];

    const rows = transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      `"${tx.category.replace(/"/g, '""')}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${(tx.personName || "").replace(/"/g, '""')}"`,
      tx.paymentMode,
      `"${(tx.slipNumber || "").replace(/"/g, '""')}"`,
      tx.amount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Danibro_PettyCash_${todayStr || "Export"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => set.add(tx.category));
    return Array.from(set);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Tab filter
      let matchesType = true;
      if (activeTab === "expenses") matchesType = tx.type === "EXPENSE";
      if (activeTab === "incomes") matchesType = tx.type === "INCOME";

      // Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.personName && tx.personName.toLowerCase().includes(q)) ||
        (tx.slipNumber && tx.slipNumber.toLowerCase().includes(q));

      // Payment Mode filter
      const matchesMode =
        paymentModeFilter === "ALL" || tx.paymentMode === paymentModeFilter;

      // Category filter
      const matchesCategory =
        categoryFilter === "ALL" || tx.category === categoryFilter;

      // Date Range filter
      let matchesDate = true;
      const txTime = new Date(tx.date).getTime();

      if (dateFilter === "today") {
        matchesDate = todayStr ? tx.date.startsWith(todayStr) : false;
      } else if (dateFilter === "week") {
        matchesDate = dateBoundaries.oneWeekAgo ? txTime >= dateBoundaries.oneWeekAgo : true;
      } else if (dateFilter === "month") {
        matchesDate = dateBoundaries.startOfMonth ? txTime >= dateBoundaries.startOfMonth : true;
      } else if (dateFilter === "custom") {
        if (customStartDate) {
          const start = new Date(customStartDate).getTime();
          if (txTime < start) matchesDate = false;
        }
        if (customEndDate) {
          const end = new Date(`${customEndDate}T23:59:59.999Z`).getTime();
          if (txTime > end) matchesDate = false;
        }
      }

      return matchesType && matchesSearch && matchesMode && matchesCategory && matchesDate;
    });
  }, [
    transactions,
    activeTab,
    searchQuery,
    paymentModeFilter,
    categoryFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    todayStr,
    dateBoundaries,
  ]);

  // Category Icon helper
  const getCategoryIcon = (category: string, type: string) => {
    const c = category.toLowerCase();
    if (c.includes("fuel"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20">
          <Fuel className="h-3.5 w-3.5" />
        </div>
      );
    if (c.includes("site visit"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20">
          <Car className="h-3.5 w-3.5" />
        </div>
      );
    if (c.includes("entertainment") || c.includes("tea"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:bg-orange-500/20">
          <Coffee className="h-3.5 w-3.5" />
        </div>
      );
    if (c.includes("billing") || c.includes("utilities"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20">
          <Receipt className="h-3.5 w-3.5" />
        </div>
      );

    return type === "INCOME" ? (
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </div>
    ) : (
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
        <ArrowDownRight className="h-3.5 w-3.5" />
      </div>
    );
  };

  // Auth gate check
  if (isAuthenticated === null) {
    return null; // Prevents flash before localStorage sync
  }

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 antialiased dark:bg-[#090d16] dark:text-slate-100">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Modern High-End Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800/90 dark:bg-[#0b1120]/95 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logodanibro.svg"
              alt="Danibro Logo"
              className="h-8 w-auto object-contain transition-transform hover:scale-105"
            />
            <span className="mt-0.5 text-[9px] font-extrabold tracking-widest text-[#2041ce] dark:text-blue-400 uppercase">
              Petty Cash
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Drawer Balance Pill */}
        <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2041ce] dark:text-blue-400 flex items-center gap-1">
              <Banknote className="h-3 w-3" /> Drawer Cash
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-1 text-base font-black text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(stats.cashInHand)}
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="mt-4 flex-1 space-y-1.5 px-3 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              activeTab === "dashboard"
                ? "bg-[#2041ce] text-white shadow-md shadow-blue-600/25 ring-1 ring-[#2041ce]"
                : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4" />
              <span>All Transactions</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "dashboard"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("expenses");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              activeTab === "expenses"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-1 ring-rose-600"
                : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <ArrowDownCircle className={`h-4 w-4 ${activeTab === "expenses" ? "text-white" : "text-rose-500"}`} />
              <span>Expenses</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "expenses"
                  ? "bg-white/20 text-white"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              {transactions.filter((t) => t.type === "EXPENSE").length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("incomes");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              activeTab === "incomes"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-600"
                : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <ArrowUpCircle className={`h-4 w-4 ${activeTab === "incomes" ? "text-white" : "text-emerald-500"}`} />
              <span>Incomes & Visits</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "incomes"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              {transactions.filter((t) => t.type === "INCOME").length}
            </span>
          </button>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 my-3">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Audit & Reports
            </span>
          </div>

          <button
            onClick={() => {
              setIsHistoryModalOpen(true);
              setIsSidebarOpen(false);
            }}
            className="group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-purple-950/30 dark:hover:text-purple-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <History className="h-3.5 w-3.5" />
              </div>
              <span>Closing Audit Log</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => {
              exportToCSV();
              setIsSidebarOpen(false);
            }}
            className="group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <FileSpreadsheet className="h-3.5 w-3.5" />
              </div>
              <span>Export to Excel</span>
            </div>
            <Download className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => {
              window.print();
              setIsSidebarOpen(false);
            }}
            className="group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-[#2041ce] dark:text-slate-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-[#2041ce] group-hover:bg-[#2041ce] group-hover:text-white transition">
                <Printer className="h-3.5 w-3.5" />
              </div>
              <span>Print Page / Report</span>
            </div>
            <Printer className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 m-2 rounded-2xl border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2041ce] text-white text-xs font-bold shadow-xs">
                DB
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Owner Admin
                </span>
                <span className="text-[10px] text-slate-400">
                  admin@danibrothers.com
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border border-rose-200/60 dark:border-rose-900/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header Navbar - Redesigned as a Distinct Command & Action Deck */}
        <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800/90 dark:bg-[#0b1120]/95 shadow-sm">
          {/* Top Row: Brand, Drawer Balance Pill (Mobile), and Action Buttons */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 sm:py-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar menu"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100/80 active:scale-95 transition lg:hidden dark:border-slate-700 dark:text-slate-300 shrink-0 shadow-2xs"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logodanibro.svg"
                  alt="Danibro Logo"
                  className="h-6 sm:h-7 w-auto object-contain transition-transform hover:scale-105"
                />
                <div className="flex flex-col lg:hidden leading-none">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#2041ce] dark:text-blue-400">
                    Petty Cash
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 tabular-nums">
                    {formatCurrency(stats.cashInHand)}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Action Buttons (Clean & Prominent) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setIsClosingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/60 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:from-amber-100 hover:to-amber-200/70 transition active:scale-95 dark:border-amber-700/60 dark:from-amber-950/50 dark:to-amber-900/40 dark:text-amber-200"
                title="Close Day & Handover Drawer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="hidden md:inline">Close Day & Handover</span>
                <span className="md:hidden">Close Day</span>
              </button>

              <button
                onClick={() => openAddModal("INCOME", "Opening Cash Balance")}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Opening</span>
              </button>

              <button
                onClick={() => openAddModal("EXPENSE")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-rose-700 hover:to-rose-800 active:scale-95 transition"
              >
                <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Expense</span>
              </button>

              <button
                onClick={() => openAddModal("INCOME", "Site Visit Charges (Inspection/Setup)")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2041ce] to-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-blue-700 hover:to-blue-800 active:scale-95 transition"
              >
                <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Site Visit</span>
                <span className="sm:hidden">Visit</span>
              </button>
            </div>
          </div>

          {/* Standalone Distinct Search Command Bar */}
          <div className="bg-slate-50/70 dark:bg-[#070b14]/70 px-3.5 py-2 sm:px-6">
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 flex items-center gap-1.5 text-slate-400">
                <Search className="h-4 w-4 text-[#2041ce]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2 hidden sm:inline">
                  Search
                </span>
              </div>
              <input
                type="text"
                placeholder="Search transactions, client names, staff, bills, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-9 sm:pl-24 pr-16 sm:pr-24 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#2041ce] focus:outline-none focus:ring-2 focus:ring-[#2041ce]/15 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-white shadow-2xs transition"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                  >
                    Clear ✕
                  </button>
                ) : (
                  <span className="rounded-md border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hidden sm:inline">
                    Ledger Filter
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {/* Primary Drawer Cash In Hand (Top Highlight) */}
            <div className="col-span-2 sm:col-span-1 animate-card-in card-hover relative overflow-hidden rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-3 sm:p-3.5 shadow-2xs dark:border-blue-900/50 dark:from-blue-950/20 dark:to-[#0f172a]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2041ce] dark:text-blue-400">
                  Cash In Hand (Drawer)
                </span>
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-[#2041ce] text-white shadow-xs">
                  <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(stats.cashInHand)}
                </h3>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  Physical Cash Available
                </div>
              </div>
            </div>

            {/* Today's Net Cash Flow */}
            <div className="col-span-2 sm:col-span-1 animate-card-in card-hover rounded-xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0f172a]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today&apos;s Flow
                </span>
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <RefreshCw className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(stats.todayBalance)}
                </h3>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold tabular-nums truncate">
                  <span className="text-emerald-600">+{formatCurrency(stats.todayIncome)}</span>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <span className="text-rose-600">-{formatCurrency(stats.todayExpense)}</span>
                </div>
              </div>
            </div>

            {/* Total Inflow */}
            <div className="animate-card-in card-hover rounded-xl border border-emerald-100 bg-white p-3 sm:p-3.5 shadow-2xs dark:border-emerald-950/40 dark:bg-[#0f172a]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Total Inflow
                </span>
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <h3 className="text-base sm:text-xl font-black tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(stats.totalIncome)}
                </h3>
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-600/80 truncate">
                  Visits: {formatCurrency(stats.siteVisitIncome)}
                </p>
              </div>
            </div>

            {/* Total Outflow */}
            <div className="animate-card-in card-hover rounded-xl border border-rose-100 bg-white p-3 sm:p-3.5 shadow-2xs dark:border-rose-950/40 dark:bg-[#0f172a]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Total Expenses
                </span>
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  <TrendingDown className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <h3 className="text-base sm:text-xl font-black tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
                  {formatCurrency(stats.totalExpense)}
                </h3>
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-rose-600/80 truncate">
                  Operational Costs
                </p>
              </div>
            </div>
          </div>

          {/* Quick Expense Categories Strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="card-hover flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-[#0f172a]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 shrink-0">
                  <Fuel className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Fuel
                </span>
              </div>
              <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(stats.fuelExpense)}
              </span>
            </div>

            <div className="card-hover flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-[#0f172a]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600 shrink-0">
                  <Car className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Transit
                </span>
              </div>
              <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(stats.siteVisitExpense)}
              </span>
            </div>

            <div className="card-hover flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-[#0f172a]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="rounded-md bg-orange-500/10 p-1.5 text-orange-600 shrink-0">
                  <Coffee className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Tea & Snacks
                </span>
              </div>
              <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(stats.entertainmentExpense)}
              </span>
            </div>

            <div className="card-hover flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-[#0f172a]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="rounded-md bg-indigo-500/10 p-1.5 text-indigo-600 shrink-0">
                  <Receipt className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Utilities
                </span>
              </div>
              <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(stats.billingExpense)}
              </span>
            </div>
          </div>

          {/* Ledger Table & Filter Toolbar */}
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-[#0f172a] overflow-hidden">
            {/* Header & Filter Controls Bar */}
            <div className="border-b border-slate-200/80 p-3 sm:px-4 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#2041ce] shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ledger Filter ({filteredTransactions.length} records)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <span className="text-[11px] text-slate-400 shrink-0">Range:</span>
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold dark:bg-slate-800 shrink-0">
                    {(["all", "today", "week", "month", "custom"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setDateFilter(mode)}
                        className={`rounded-md px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] capitalize transition whitespace-nowrap ${
                          dateFilter === mode
                            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {mode === "all" ? "All Time" : mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub-filter row: Payment Mode, Category, and Custom Date Range inputs */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                {dateFilter === "custom" && (
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] border border-slate-200 dark:border-slate-700 flex-1 sm:flex-initial"
                    />
                    <span className="text-slate-400 text-[10px]">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] border border-slate-200 dark:border-slate-700 flex-1 sm:flex-initial"
                    />
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Payment:</span>
                  <select
                    value={paymentModeFilter}
                    onChange={(e) => setPaymentModeFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Modes</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="EASYPAISA">EasyPaisa</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="max-w-[150px] sm:max-w-[200px] truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Categories</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {(dateFilter !== "all" || paymentModeFilter !== "ALL" || categoryFilter !== "ALL" || searchQuery) && (
                  <button
                    onClick={() => {
                      setDateFilter("all");
                      setPaymentModeFilter("ALL");
                      setCategoryFilter("ALL");
                      setSearchQuery("");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="text-[11px] text-[#2041ce] hover:underline font-semibold ml-auto"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Card List View (< md screen) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Loading ledger entries...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No transactions found in this view.
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 space-y-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(tx.category, tx.type)}
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">
                            {tx.category}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(tx.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-black tabular-nums text-right ${
                          tx.type === "INCOME"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}{" "}
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>

                    {tx.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {tx.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/40">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-semibold text-slate-700 dark:text-slate-300">
                          {tx.paymentMode}
                        </span>
                        {tx.slipNumber && (
                          <span className="text-slate-400 font-mono">
                            #{tx.slipNumber}
                          </span>
                        )}
                        {tx.personName && (
                          <span className="text-slate-500 font-medium truncate max-w-[120px]">
                            • {tx.personName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {tx.receiptImage && (
                          <button
                            onClick={() => setPreviewImage(tx.receiptImage!)}
                            className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#2041ce] hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                          >
                            <Eye className="h-3 w-3" />
                            Slip
                          </button>
                        )}
                        <button
                          onClick={() => setVoucherTx(tx)}
                          className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-[#2041ce] dark:hover:bg-blue-950/40"
                          title="Print Payment Voucher"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(tx)}
                          className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40"
                          title="Edit record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (>= md screen) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/30">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Staff / Client</th>
                    <th className="px-4 py-2.5">Payment</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-center">Receipt</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        Loading ledger entries...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No transactions found in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          {new Date(tx.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(tx.category, tx.type)}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {tx.category}
                            </span>
                          </div>
                        </td>

                        <td className="max-w-xs px-4 py-3 text-slate-600 dark:text-slate-300">
                          <p className="line-clamp-1">{tx.description}</p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          {tx.personName || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            {tx.paymentMode}
                          </span>
                          {tx.slipNumber && (
                            <span className="ml-1 text-[10px] text-slate-400">
                              #{tx.slipNumber}
                            </span>
                          )}
                        </td>

                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right font-black tabular-nums ${
                            tx.type === "INCOME"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}{" "}
                          {formatCurrency(tx.amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {tx.receiptImage ? (
                            <button
                              onClick={() => setPreviewImage(tx.receiptImage!)}
                              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#2041ce] hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                            >
                              <Eye className="h-3 w-3" />
                              Slip
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setVoucherTx(tx)}
                              className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-[#2041ce] dark:hover:bg-blue-950/40"
                              title="Print Payment Voucher"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => openEditModal(tx)}
                              className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40"
                              title="Edit record"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSuccess={fetchTransactions}
        initialType={modalType}
        defaultCategory={modalCategory}
        initialData={editingTx}
      />

      {/* Daily Drawer Closing & Cash Handover Modal */}
      <DayClosingModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        calculatedCash={stats.cashInHand}
        onSuccess={fetchTransactions}
        todayStr={todayStr}
      />

      {/* Daily Drawer Closing History Modal */}
      <ClosingHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Payment / Receipt Voucher Preview Modal */}
      <VoucherModal
        isOpen={Boolean(voucherTx)}
        onClose={() => setVoucherTx(null)}
        transaction={voucherTx}
      />

      {/* High-Res Receipt Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-modal-enter">
          <div className="relative max-h-[90vh] max-w-xl overflow-hidden rounded-2xl bg-white p-4 shadow-2xl dark:bg-[#0f172a]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Receipt / Slip Inspection
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Receipt Proof"
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
