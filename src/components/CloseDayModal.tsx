import React, { useState } from 'react';
import {
  X,
  Archive,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface CloseDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  initialCash: number;
  transactions: Transaction[];
  onConfirmClose: (note?: string) => void;
}

export const CloseDayModal: React.FC<CloseDayModalProps> = ({
  isOpen,
  onClose,
  date,
  initialCash,
  transactions,
  onConfirmClose,
}) => {
  const [note, setNote] = useState('Tutup buku harian');

  if (!isOpen) return null;

  let totalIncome = 0;
  let totalExpense = 0;
  let totalProfit = 0;

  transactions.forEach((t) => {
    if (t.cashFlow === 'pemasukan') {
      totalIncome += t.totalAmount;
    } else {
      totalExpense += t.cashAmountOut || t.totalAmount;
    }
    totalProfit += t.profit;
  });

  const finalCash = initialCash + totalIncome - totalExpense;

  const handleConfirm = () => {
    onConfirmClose(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Tutup Buku Kasir Harian</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Konfirmasi Penutupan Buku Hari Ini ({formatDateIndo(date)})</p>
              <p className="mt-0.5 opacity-90">
                Sistem akan menyimpan seluruh riwayat transaksi hari ini ke dalam Arsip Buku Kas dan mereset kasir untuk hari baru.
              </p>
            </div>
          </div>

          {/* Breakdown Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Modal Kas Laci Awal:</span>
              <span className="font-mono font-semibold">{formatRupiah(initialCash)}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Total Pemasukan (Cash In):</span>
              </span>
              <span className="font-mono font-bold">+{formatRupiah(totalIncome)}</span>
            </div>

            <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Total Pengeluaran / Tarik Tunai:</span>
              </span>
              <span className="font-mono font-bold">-{formatRupiah(totalExpense)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-900 dark:text-white font-bold text-sm">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4 text-indigo-500" />
                <span>Saldo Akhir Kas Laci:</span>
              </span>
              <span className="font-mono text-base text-indigo-600 dark:text-indigo-400">
                {formatRupiah(finalCash)}
              </span>
            </div>

            <div className="flex justify-between items-center text-purple-600 dark:text-purple-400 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Total Keuntungan Bersih:</span>
              </span>
              <span className="font-mono">+{formatRupiah(totalProfit)}</span>
            </div>

            <div className="text-[11px] text-slate-400 text-right">
              Total {transactions.length} transaksi tercatat hari ini
            </div>
          </div>

          {/* Notes input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Penutupan Kasir (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kas fisik cocok, shift selesai aman"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Konfirmasi & Tutup Buku Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
