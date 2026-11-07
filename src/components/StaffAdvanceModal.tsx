"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, Plus, CheckCircle, Clock, AlertCircle, Banknote, ShieldAlert } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface StaffAdvance {
  id: string;
  staffName: string;
  amountGiven: number;
  amountSettled: number;
  remainingBalance: number;
  purpose: string;
  status: "PENDING" | "PARTIAL" | "SETTLED";
  dateGiven: string;
  notes?: string | null;
}

interface StaffAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdvanceUpdated: () => void;
  currentDrawerCash: number;
}

export default function StaffAdvanceModal({
  isOpen,
  onClose,
  onAdvanceUpdated,
  currentDrawerCash,
}: StaffAdvanceModalProps) {
  const [advances, setAdvances] = useState<StaffAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "issue">("list");

  // Form State
  const [staffName, setStaffName] = useState("Wahab");
  const [amountGiven, setAmountGiven] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Settlement Form State
  const [settlingAdvance, setSettlingAdvance] = useState<StaffAdvance | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [cashReturned, setCashReturned] = useState("");

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/advances");
      if (res.ok) {
        const data = await res.json();
        setAdvances(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdvances();
    }
  }, [isOpen]);

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const amountNum = parseFloat(amountGiven);
    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid amount");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffName,
          amountGiven: amountNum,
          purpose,
          notes,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to issue advance");
      }

      setAmountGiven("");
      setPurpose("");
      setNotes("");
      setActiveTab("list");
      fetchAdvances();
      onAdvanceUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to issue advance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingAdvance) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/advances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: settlingAdvance.id,
          settleAmount: parseFloat(settleAmount || "0"),
          cashReturned: parseFloat(cashReturned || "0"),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to settle advance");
      }

      setSettlingAdvance(null);
      setSettleAmount("");
      setCashReturned("");
      fetchAdvances();
      onAdvanceUpdated();
    } catch (err: any) {
      alert(err.message || "Settlement failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalOutstandingAdvance = advances
    .filter((a) => a.status !== "SETTLED")
    .reduce((sum, a) => sum + a.remainingBalance, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 my-auto sm:my-8 animate-modal-enter">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
                <UserCheck className="h-4 w-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Staff & Technician Advance Ledger (Khata)
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Issue site advances to technicians, record expense bills, and settle returned balances.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-950/60 dark:bg-amber-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Total Outstanding Advances With Staff
            </span>
            <div className="mt-1 text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums">
              {formatCurrency(totalOutstandingAdvance)}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2041ce] dark:text-blue-400">
              Available Drawer Cash In Hand
            </span>
            <div className="mt-1 text-xl font-black text-[#2041ce] dark:text-blue-300 tabular-nums">
              {formatCurrency(currentDrawerCash)}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "list"
                ? "border-[#2041ce] text-[#2041ce] dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            All Advances & Khatas ({advances.length})
          </button>
          <button
            onClick={() => setActiveTab("issue")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === "issue"
                ? "border-[#2041ce] text-[#2041ce] dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Issue New Advance</span>
          </button>
        </div>

        {/* Tab 1: Advance List */}
        {activeTab === "list" && (
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading advances...</div>
            ) : advances.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No advances currently recorded. Click &quot;Issue New Advance&quot; to give cash to staff.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Staff Member</th>
                      <th className="px-3 py-2">Purpose / Job</th>
                      <th className="px-3 py-2 text-right">Given</th>
                      <th className="px-3 py-2 text-right">Settled</th>
                      <th className="px-3 py-2 text-right">Remaining</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {advances.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                          {formatDateTime(adv.dateGiven)}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                          {adv.staffName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {adv.purpose}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(adv.amountGiven)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-600">
                          {formatCurrency(adv.amountSettled)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black tabular-nums text-amber-600 dark:text-amber-400">
                          {formatCurrency(adv.remainingBalance)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            adv.status === "SETTLED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : adv.status === "PARTIAL"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {adv.status === "SETTLED" && <CheckCircle className="h-3 w-3" />}
                            {adv.status === "PARTIAL" && <Clock className="h-3 w-3" />}
                            {adv.status === "PENDING" && <AlertCircle className="h-3 w-3" />}
                            <span>{adv.status}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {adv.status !== "SETTLED" ? (
                            <button
                              onClick={() => {
                                setSettlingAdvance(adv);
                                setSettleAmount(adv.remainingBalance.toString());
                                setCashReturned("0");
                              }}
                              className="rounded bg-[#2041ce] hover:bg-blue-700 text-white px-2 py-1 text-[11px] font-bold transition cursor-pointer"
                            >
                              Settle
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Issue Advance Form */}
        {activeTab === "issue" && (
          <form onSubmit={handleIssueAdvance} className="space-y-4 max-w-lg">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Technician / Staff Member Name *
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {["Wahab", "Subhan", "Danish"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStaffName(n)}
                    className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                      staffName === n
                        ? "border-[#2041ce] bg-blue-50 text-[#2041ce] dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Or enter custom staff name..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Advance Amount (PKR) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amountGiven}
                onChange={(e) => setAmountGiven(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job / Purpose Description *
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. CCTV Camera Installation & Fuel advance for Clifton Site"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes / Bill Reference (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#2041ce] hover:bg-blue-700 text-white font-bold py-2.5 px-5 text-xs transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Issuing..." : "Confirm & Deduct Cash From Drawer"}
            </button>
          </form>
        )}

        {/* Settlement Modal Popup */}
        {settlingAdvance && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Settle Advance for {settlingAdvance.staffName}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Total Remaining Balance: <strong className="text-amber-600">{formatCurrency(settlingAdvance.remainingBalance)}</strong>
              </p>

              <form onSubmit={handleSettleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Bills Submitted (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="e.g. 3500 (Petrol, wires, etc.)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unused Cash Returned To Drawer (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cashReturned}
                    onChange={(e) => setCashReturned(e.target.value)}
                    placeholder="e.g. 1500 returned back"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSettlingAdvance(null)}
                    className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    {submitting ? "Settling..." : "Save Settlement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
