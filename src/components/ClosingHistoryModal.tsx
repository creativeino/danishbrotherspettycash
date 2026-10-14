"use client";

import { useState, useEffect } from "react";
import { X, Calendar, User, ArrowDownRight, ArrowUpRight, Banknote, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DayClosing {
  id: string;
  closingDateStr: string;
  calculatedCash: number;
  cashWithdrawn: number;
  cashRetained: number;
  closedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface ClosingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClosingHistoryModal({
  isOpen,
  onClose,
}: ClosingHistoryModalProps) {
  const [closings, setClosings] = useState<DayClosing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchClosings();
    }
  }, [isOpen]);

  const fetchClosings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/closing");
      if (res.ok) {
        const data = await res.json();
        setClosings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load closings", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 my-8 animate-modal-enter">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2041ce]" />
              Daily Drawer Closing & Cash Audit History
            </h2>
            <p className="text-xs text-slate-500">
              Audit log of past daily cash drawer handovers, profit withdrawals, and carried balances.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            Loading closing history...
          </div>
        ) : closings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <FileText className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No daily closings recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Use "Close Day & Drawer" on the dashboard at the end of each work day.
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
            {closings.map((closing) => (
              <div
                key={closing.id}
                className="py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-3 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {closing.closingDateStr}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <User className="h-3 w-3" />
                      {closing.closedBy || "Admin"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Calculated Drawer Cash:{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {formatCurrency(closing.calculatedCash)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                      <ArrowDownRight className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Cash Withdrawn by Owner
                      </span>
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(closing.cashWithdrawn)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Cash Retained for Next Day
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(closing.cashRetained)}
                      </span>
                    </div>
                  </div>
                </div>

                {closing.notes && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                    Note: "{closing.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
