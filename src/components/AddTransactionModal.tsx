"use client";

import { useState, useEffect } from "react";
import {
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
  Upload,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { getLocalDateString, getLocalTimeString, createKarachiIsoString } from "@/lib/utils";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: "EXPENSE" | "INCOME";
  defaultCategory?: string;
  initialData?: {
    id: string;
    type: "EXPENSE" | "INCOME";
    category: string;
    amount: number;
    description: string;
    personName?: string | null;
    paymentMode: string;
    slipNumber?: string | null;
    receiptImage?: string | null;
    date: string;
  } | null;
}

const CATEGORIES = {
  INCOME: [
    "Site Visit Charges (Inspection/Setup)",
    "Opening Cash Balance",
    "Computer / Laptop Repair Service",
    "Hardware & Accessories Sale",
    "Security Camera (CCTV) Installation",
    "Network / Office Setup Service",
    "Other Income",
  ],
  EXPENSE: [
    "Site Visit Expense (Transit/Toll)",
    "Fuel Expense (Vehicle Petrol)",
    "Entertainment Expense (Tea, Snacks, Lunch)",
    "Billing & Utilities (Internet, Electricity)",
    "Hardware Tools & Consumables (Thermal Paste, Cables)",
    "Client Accessories Purchase",
    "Staff Daily Allowance",
    "Other Expense",
  ],
};

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "EXPENSE",
  defaultCategory,
  initialData,
}: AddTransactionModalProps) {
  const [type, setType] = useState<"EXPENSE" | "INCOME">(initialType);
  const [category, setCategory] = useState(
    defaultCategory || CATEGORIES[initialType][0]
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [personName, setPersonName] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [slipNumber, setSlipNumber] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(initialData?.id);

  // Next.js 16 prerender safe date initialization
  useEffect(() => {
    if (!date) {
      setDate(getLocalDateString());
      setTime(getLocalTimeString());
    }
  }, [date]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setCategory(initialData.category);
        setAmount(initialData.amount.toString());
        setDescription(initialData.description || "");
        setPersonName(initialData.personName || "");
        setPaymentMode(initialData.paymentMode || "CASH");
        setSlipNumber(initialData.slipNumber || "");
        setReceiptImage(initialData.receiptImage || null);
        if (initialData.date) {
          setDate(getLocalDateString(initialData.date));
          setTime(getLocalTimeString(initialData.date));
        } else {
          setDate(getLocalDateString());
          setTime(getLocalTimeString());
        }
      } else {
        setType(initialType);
        setCategory(defaultCategory || CATEGORIES[initialType][0]);
        setAmount("");
        setDescription("");
        setPersonName("");
        setPaymentMode("CASH");
        setSlipNumber("");
        setReceiptImage(null);
        setDate(getLocalDateString());
        setTime(getLocalTimeString());
      }
    }
  }, [isOpen, initialType, defaultCategory, initialData]);


  if (!isOpen) return null;

  const handleTypeChange = (newType: "EXPENSE" | "INCOME") => {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description or reason");
      return;
    }

    try {
      setLoading(true);
      const url = isEditing
        ? `/api/transactions/${initialData?.id}`
        : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";

      // Save exact timestamp locked to Karachi timezone (+05:00)
      const finalDateTimeIso = date
        ? createKarachiIsoString(date, time || getLocalTimeString())
        : new Date().toISOString();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category,
          amount: parseFloat(amount),
          description,
          personName,
          paymentMode,
          slipNumber,
          receiptImage,
          date: finalDateTimeIso,
        }),
      });

      if (!res.ok) {
        throw new Error(isEditing ? "Failed to update transaction" : "Failed to save transaction");
      }

      // Reset
      setAmount("");
      setDescription("");
      setPersonName("");
      setSlipNumber("");
      setReceiptImage(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-auto sm:my-8 animate-modal-enter">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pr-8">
          {isEditing
            ? "Edit Transaction"
            : type === "EXPENSE"
            ? "Record Expense"
            : "Record Income"}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {isEditing
            ? "Update transaction details, category, or amount."
            : "Add operational expenditures or service charges to the petty cash ledger."}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange("EXPENSE")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition ${
                type === "EXPENSE"
                  ? "bg-rose-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("INCOME")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition ${
                type === "INCOME"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Income
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {CATEGORIES[type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount, Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Amount (PKR) *
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Payment Mode & Bill/Slip Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="CASH">Cash in Hand</option>
                <option value="JAZZCASH">JazzCash</option>
                <option value="EASYPAISA">EasyPaisa</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Bill / Slip No. (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. SLIP-4089"
                value={slipNumber}
                onChange={(e) => setSlipNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Person Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Technician / Staff / Client Name
            </label>
            <input
              type="text"
              placeholder="e.g. Ali (Technician), Bilal (Client)"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Description / Reason *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. CCTV setup at Plaza, petrol 2L, chai refreshment for technicians"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Receipt Image Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Receipt / Bill Photo
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <Camera className="h-4 w-4 text-blue-500" />
                Upload Slip / Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {receiptImage && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <ImageIcon className="h-4 w-4" />
                  Receipt Attached
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="text-red-500 hover:underline text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-md transition ${
                type === "EXPENSE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } disabled:opacity-50`}
            >
              <PlusCircle className="h-4 w-4" />
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Record"
                : type === "EXPENSE"
                ? "Save Expense"
                : "Save Income"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
