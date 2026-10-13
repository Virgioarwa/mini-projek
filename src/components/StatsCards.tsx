import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Coins,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface StatsCardsProps {
  initialCash: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  totalProfit: number;
  transactionCount: number;
  onEditInitialCash: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  initialCash,
  totalIncome,
  totalExpense,
  currentBalance,
  totalProfit,
  transactionCount,
  onEditInitialCash,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Saldo Keseluruhan / Kas Laci Sekarang */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg border border-indigo-700/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Wallet className="w-5 h-5 text-indigo-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Saldo Kas Laci
            </span>
          </div>
          <button
            type="button"
            onClick={onEditInitialCash}
            className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-800/80 px-2 py-1 rounded-md border border-indigo-700/50 transition cursor-pointer"
            title="Ubah Modal Awal"
          >
            <Edit2 className="w-3 h-3" />
            <span>Awal: {formatRupiah(initialCash)}</span>
          </button>
        </div>

        <div className="mt-2">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
            {formatRupiah(currentBalance)}
          </h3>
          <p className="text-xs text-indigo-300/80 mt-1 flex items-center gap-1">
            <span>Uang fisik di laci kasir saat ini</span>
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-indigo-800/40 flex items-center justify-between text-[11px] text-slate-300">
          <span>Modal Awal: {formatRupiah(initialCash)}</span>
          <span className="font-semibold text-emerald-400">
            Net: {currentBalance >= initialCash ? '+' : ''}{formatRupiah(currentBalance - initialCash)}
          </span>
        </div>
      </div>

      {/* 2. Total Pemasukan (Cash IN) */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/60 transition hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pemasukan
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium">
            Cash IN
          </span>
        </div>

        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalIncome)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Penjualan voucher, pulsa, token & tagihan
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Dari {transactionCount} transaksi</span>
          <span className="text-emerald-600 font-medium">+ Masuk ke Kas</span>
        </div>
      </div>

      {/* 3. Total Pengeluaran / Tarik Tunai (Cash OUT) */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/60 transition hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pengeluaran
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-medium">
            Tarik Tunai
          </span>
        </div>

        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono text-rose-600 dark:text-rose-400">
            {formatRupiah(totalExpense)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Uang fisik keluar ke pelanggan (Tarik Tunai)
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Mengurangi Saldo Laci</span>
          <span className="text-rose-600 font-medium">- Keluar Kas</span>
        </div>
      </div>

      {/* 4. Estimasi Keuntungan Bersih (Profit Konter) */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/60 transition hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Keuntungan Bersih
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium">
            Laba Hari Ini
          </span>
        </div>

        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono text-purple-600 dark:text-purple-400">
            {formatRupiah(totalProfit)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Margin harga jual & jasa fee admin
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Murni Untung Toko</span>
          <span className="text-purple-600 font-semibold font-mono">100% Milik Konter</span>
        </div>
      </div>
    </div>
  );
};
