import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Coins,
  Edit2,
  AlertCircle,
  HelpCircle,
  Layers,
  Banknote,
  QrCode,
  Package,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export type FinancialDisplayMode = 'with_cash' | 'without_cash';

interface StatsCardsProps {
  initialCash: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  totalProfit: number;
  transactionCount: number;
  totalGrossSales?: number;
  totalCostPrice?: number;
  totalCashIncome?: number;
  totalNonCashIncome?: number;
  onEditInitialCash: () => void;
  onSetZeroCash?: () => void;
  onOpenFinancialGuide?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  initialCash,
  totalIncome,
  totalExpense,
  currentBalance,
  totalProfit,
  transactionCount,
  totalGrossSales = totalIncome,
  totalCostPrice = Math.max(0, totalGrossSales - totalProfit),
  totalCashIncome = totalIncome,
  totalNonCashIncome = 0,
  onEditInitialCash,
  onSetZeroCash,
  onOpenFinancialGuide,
}) => {
  // Mode tampilan: dengan kas laci vs tanpa kas
  const [displayMode, setDisplayMode] = useState<FinancialDisplayMode>(() => {
    return initialCash === 0 ? 'without_cash' : 'with_cash';
  });

  return (
    <div className="space-y-3 mb-6">
      {/* Baris Kontrol: Mode Perhitungan & Tombol Panduan Rumus */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-800/80 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
        {/* Toggle Mode */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDisplayMode('with_cash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              displayMode === 'with_cash'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Mode Kas Laci</span>
            {initialCash === 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 rounded-full font-mono">
                Rp 0
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('without_cash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              displayMode === 'without_cash'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Mode Tanpa Kas</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-700 text-white rounded-full font-medium">
              Murni Transaksi
            </span>
          </button>
        </div>

        {/* Action Buttons: Set Kas Rp 0 & Panduan Keuangan */}
        <div className="flex items-center gap-2 flex-wrap">
          {initialCash > 0 && onSetZeroCash && (
            <button
              type="button"
              onClick={onSetZeroCash}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Atur Modal Kas Laci Awal menjadi Rp 0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nol-kan Kas (Rp 0)</span>
            </button>
          )}

          {onOpenFinancialGuide && (
            <button
              type="button"
              onClick={onOpenFinancialGuide}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>❓ Rumus & Penjelasan Keuangan</span>
            </button>
          )}
        </div>
      </div>

      {/* TAMPILAN 1: MODE DENGAN KAS LACI FISIK */}
      {displayMode === 'with_cash' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Saldo Kas Laci */}
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
                <span>Awal: {initialCash === 0 ? 'Rp 0 (Nol)' : formatRupiah(initialCash)}</span>
              </button>
            </div>

            <div className="mt-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                {formatRupiah(currentBalance)}
              </h3>
              <p className="text-xs text-indigo-300/80 mt-1 flex items-center gap-1">
                <span>{initialCash === 0 ? 'Murni perputaran uang tunai hari ini' : 'Uang fisik di laci kasir saat ini'}</span>
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
              <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
              <h3 className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
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
              <h3 className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
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
      )}

      {/* TAMPILAN 2: MODE TANPA KAS (MURNI TRANSAKSI & OMSET) */}
      {displayMode === 'without_cash' && (
        <div>
          {/* Info Banner Mode Tanpa Kas */}
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Mode Tanpa Kas Aktif:</strong> Menampilkan ringkasan murni transaksi (Omset, Modal Produk, dan Laba Bersih) tanpa mencampur saldo modal kas laci.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDisplayMode('with_cash')}
              className="text-[11px] font-bold underline hover:opacity-80 shrink-0 ml-2 cursor-pointer"
            >
              Lihat Kas Laci
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Omset Penjualan (Kotor) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-5 text-white shadow-lg border border-emerald-700/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <TrendingUp className="w-5 h-5 text-emerald-300" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                    Total Omset Penjualan
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-medium">
                  Kotor
                </span>
              </div>

              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                  {formatRupiah(totalGrossSales)}
                </h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  Total nilai transaksi yang terjual hari ini
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-slate-300">
                <span>{transactionCount} transaksi</span>
                <span className="font-semibold text-emerald-400">Harga Jual + Admin</span>
              </div>
            </div>

            {/* 2. Total Modal Produk / HPP */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/90 p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/60 transition hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Modal Produk (HPP)
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">
                  Modal Server/Stok
                </span>
              </div>

              <div className="mt-2">
                <h3 className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  {formatRupiah(totalCostPrice)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Modal pulsa, kuota, token & barang fisik
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Beban Kulak / Server</span>
                <span className="text-amber-600 font-medium">Modal Pokok</span>
              </div>
            </div>

            {/* 3. Keuntungan Bersih (Murni Laba) */}
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
                  Murni Untung
                </span>
              </div>

              <div className="mt-2">
                <h3 className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                  {formatRupiah(totalProfit)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Rumus: Omset Penjualan - Modal Produk
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Margin + Fee Jasa</span>
                <span className="text-purple-600 font-bold font-mono">Laba Bersih</span>
              </div>
            </div>

            {/* 4. Rincian Metode Bayar (Tunai vs Non-Tunai) */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/90 p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/60 transition hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rincian Pembayaran
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium">
                  Tunai vs Bank
                </span>
              </div>

              <div className="mt-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Uang Tunai:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupiah(totalCashIncome)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                    <span>QRIS / Bank:</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(totalNonCashIncome)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Total Penerimaan</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {formatRupiah(totalCashIncome + totalNonCashIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
