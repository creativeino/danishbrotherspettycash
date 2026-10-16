"use client";

import { Printer, X, Building2, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function VoucherModal({
  isOpen,
  onClose,
  transaction,
}: VoucherModalProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isExpense = transaction.type === "EXPENSE";
  const voucherDate = formatDateTime(transaction.date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 my-auto sm:my-8 animate-modal-enter print:border-none print:shadow-none print:my-0 print:p-8 print:w-full">
        {/* Screen Action Bar (hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800 print:hidden gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            Voucher Preview
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2041ce] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt / Voucher Body */}
        <div className="print-area font-sans text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-[#2041ce] print:text-black" />
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                  Dani Brothers
                </h1>
              </div>
              <p className="text-xs font-medium text-slate-500 print:text-slate-700 mt-0.5">
                IT Solutions • CCTV & Security • Laptop Repair • On-site Services
              </p>
              <p className="text-[11px] text-slate-400 print:text-slate-600">
                Contact: +92 300 0000000 | info@danibrothers.com
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded text-xs font-black uppercase tracking-widest ${
                  isExpense
                    ? "bg-rose-100 text-rose-800 print:border print:border-black"
                    : "bg-emerald-100 text-emerald-800 print:border print:border-black"
                }`}
              >
                {isExpense ? "Payment Voucher" : "Receipt Voucher"}
              </span>
              <p className="text-xs font-mono text-slate-500 mt-1">
                Ref: {transaction.slipNumber || `TX-${transaction.id.slice(-6).toUpperCase()}`}
              </p>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-dashed border-slate-300 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Date & Time
              </span>
              <span className="font-semibold">{voucherDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Payment Mode
              </span>
              <span className="font-semibold uppercase tracking-wider">
                {transaction.paymentMode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                {isExpense ? "Paid To / Technician" : "Received From / Client"}
              </span>
              <span className="font-semibold text-sm">
                {transaction.personName || "N/A (Cash Counter)"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Category
              </span>
              <span className="font-semibold text-slate-800">
                {transaction.category}
              </span>
            </div>
          </div>

          {/* Description & Particulars */}
          <div className="py-4 border-b border-dashed border-slate-300">
            <span className="text-slate-400 block uppercase font-bold text-[10px] mb-1">
              Particulars / Description
            </span>
            <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 print:border print:bg-transparent">
              {transaction.description}
            </p>
          </div>

          {/* Total Amount Box */}
          <div className="py-4 flex justify-between items-center border-b-2 border-slate-900">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">
                Total Amount Paid / Received
              </span>
              <p className="text-[11px] text-slate-400 italic">
                Pakistani Rupee (PKR)
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 pb-4 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
              <span className="text-slate-500 font-medium">Prepared By (Staff)</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
              <span className="text-slate-500 font-medium">Authorized Signature (Owner)</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400">
            * This is a computer-generated voucher from Dani Brothers Petty Cash Management System.
          </div>
        </div>
      </div>
    </div>
  );
}
