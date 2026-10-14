"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, ArrowRight, Banknote, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DayClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatedCash: number;
  onSuccess: () => void;
  todayStr: string;
}

export default function DayClosingModal({
  isOpen,
  onClose,
  calculatedCash,
  onSuccess,
  todayStr,
}: DayClosingModalProps) {
  const [cashWithdrawn, setCashWithdrawn] = useState<string>("");
  const [cashRetained, setCashRetained] = useState<string>("");
  const [closedBy, setClosedBy] = useState<string>("Owner");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When modal opens or calculated cash changes, set defaults
  useEffect(() => {
    if (isOpen) {
      setCashRetained(calculatedCash > 0 ? calculatedCash.toString() : "0");
      setCashWithdrawn("0");
      setError("");
    }
  }, [isOpen, calculatedCash]);

  if (!isOpen) return null;

  // Handle cash withdrawn change (auto update cash left in drawer)
  const handleWithdrawnChange = (val: string) => {
    setCashWithdrawn(val);
    const withdrawnNum = parseFloat(val) || 0;
    const remaining = calculatedCash - withdrawnNum;
    setCashRetained(remaining >= 0 ? remaining.toString() : "0");
  };

  // Handle cash retained change (auto update withdrawn)
  const handleRetainedChange = (val: string) => {
    setCashRetained(val);
    const retainedNum = parseFloat(val) || 0;
    const withdrawn = calculatedCash - retainedNum;
    setCashWithdrawn(withdrawn >= 0 ? withdrawn.toString() : "0");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const withdrawnNum = parseFloat(cashWithdrawn) || 0;
    const retainedNum = parseFloat(cashRetained) || 0;

    if (withdrawnNum + retainedNum !== calculatedCash) {
      if (!confirm(`Warning: Withdrawn (${formatCurrency(withdrawnNum)}) + Retained in drawer (${formatCurrency(retainedNum)}) does not match system cash (${formatCurrency(calculatedCash)}). Do you still wish to proceed?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      const res = await fetch("/api/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closingDateStr: todayStr || new Date().toISOString().split("T")[0],
          calculatedCash,
          cashWithdrawn: withdrawnNum,
          cashRetained: retainedNum,
          closedBy,
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to process day closing");
      }

      alert(`Day closed successfully!\n\n• Withdrawn: ${formatCurrency(withdrawnNum)}\n• Left in drawer for tomorrow: ${formatCurrency(retainedNum)}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to close day");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 my-8 animate-modal-enter">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2041ce] dark:bg-blue-950/60 dark:text-blue-400">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Daily Drawer Closing & Handover
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reconcile physical cash, log withdrawals & auto carry forward to next morning
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Current System Balance Display */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                System Cash In Drawer Today
              </span>
              <span className="text-base font-black text-[#2041ce] tabular-nums dark:text-blue-400">
                {formatCurrency(calculatedCash)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Total physical cash calculated from today&apos;s opening, site visits, and expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cash Withdrawn by Owner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cash Withdrawn by Owner
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={cashWithdrawn}
                  onChange={(e) => handleWithdrawnChange(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#2041ce] focus:outline-none focus:ring-1 focus:ring-[#2041ce] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <span className="mt-1 block text-[10px] text-slate-400">
                Amount taken for bank deposit or profit
              </span>
            </div>

            {/* Cash Retained for Next Morning */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cash Retained in Drawer
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={cashRetained}
                  onChange={(e) => handleRetainedChange(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-emerald-300 bg-emerald-50/30 px-3 py-2 text-xs font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400"
                />
              </div>
              <span className="mt-1 block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ★ Becomes Next Day Opening Balance
              </span>
            </div>
          </div>

          {/* Closed by & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Handled By
              </label>
              <input
                type="text"
                value={closedBy}
                onChange={(e) => setClosedBy(e.target.value)}
                placeholder="Owner / Manager"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#2041ce] focus:outline-none focus:ring-1 focus:ring-[#2041ce] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Closing Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Deposited in MCB account"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#2041ce] focus:outline-none focus:ring-1 focus:ring-[#2041ce] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2041ce] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? "Reconciling..." : "Confirm & Close Day"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
