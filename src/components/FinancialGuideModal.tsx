import React from 'react';
import {
  X,
  HelpCircle,
  Calculator,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Banknote,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface FinancialGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetZeroCash?: () => void;
  currentInitialCash: number;
}

export const FinancialGuideModal: React.FC<FinancialGuideModalProps> = ({
  isOpen,
  onClose,
  onSetZeroCash,
  currentInitialCash,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Panduan Sistem Keuangan & Rumus Perhitungan
              </h2>
              <p className="text-xs text-slate-400">
                Memahami perbedaan perhitungan manual vs sistem kasir konter
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-slate-800 dark:text-slate-200 text-sm">
          {/* Quick Notice: Kenapa Hitungan Manual Berbeda? */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                  Mengapa Jika Dihitung Manual Hasilnya Bisa Berbeda?
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
                  Perbedaan biasanya terjadi karena membandingkan <strong>Uang Fisik Kas Laci</strong> dengan <strong>Omset / Laba Bersih Transaksi</strong>, atau karena adanya <strong>Modal Kas Awal</strong> yang tersimpan di sistem.
                </p>
              </div>
            </div>
          </div>

          {/* Opsi Cepat: Nol-kan Kas */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                Status Kas Awal Saat Ini
              </span>
              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                {formatRupiah(currentInitialCash)}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentInitialCash === 0
                  ? 'Kas laci sudah Rp 0 (Mode Tanpa Kas aktif).'
                  : 'Jika Anda ingin menghitung tanpa modal kas laci, Anda bisa menol-kannya sekarang.'}
              </p>
            </div>

            {currentInitialCash > 0 && onSetZeroCash && (
              <button
                type="button"
                onClick={() => {
                  onSetZeroCash();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition shrink-0 cursor-pointer"
              >
                Atur Kas Jadi Rp 0 (Tanpa Kas)
              </button>
            )}
          </div>

          {/* 4 Alasan Perbedaan & Penjelasannya */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>4 Faktor Utama Perhitungan Keuangan Konter</span>
            </h4>

            {/* Faktor 1: Modal Awal Kas Laci */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Wallet className="w-4 h-4" />
                <span>1. Modal Kas Awal di Laci (Uang Kembalian Pagi)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Di sistem kasir, terdapat <strong>Modal Awal</strong> (misal Rp 300.000 atau Rp 500.000). Saldo Kas Laci = <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono font-bold">Modal Awal + Uang Masuk - Uang Keluar</code>. Jika Anda menghitung manual murni dari total penjualan hari ini tanpa modal awal, tentu ada selisih sebesar modal awal tersebut.
              </p>
            </div>

            {/* Faktor 2: Arus Uang Fisik vs Modal Digital */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <ArrowDownLeft className="w-4 h-4" />
                <span>2. Arus Uang Tunai di Laci vs Modal Saldo Digital di HP</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Contoh: Pelanggan membeli Pulsa Rp 10.000 seharga <strong>Rp 12.000</strong> (modal saldo server Rp 10.500).
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc pl-5 space-y-1">
                <li><strong>Uang tunai masuk ke laci:</strong> +Rp 12.000 (seluruh uang yang diserahkan pelanggan masuk ke laci kasir).</li>
                <li><strong>Modal saldo chip/server:</strong> -Rp 10.500 (dipotong dari aplikasi digipos/server konter di HP, bukan dari laci uang).</li>
                <li><strong>Laba bersih konter:</strong> Rp 12.000 - Rp 10.500 = <strong>+Rp 1.500</strong>.</li>
              </ul>
            </div>

            {/* Faktor 3: Transaksi Tarik Tunai */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                <ArrowUpRight className="w-4 h-4" />
                <span>3. Transaksi Tarik Tunai (Uang Keluar dari Laci)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Contoh: Pelanggan tarik tunai DANA <strong>Rp 100.000</strong> dengan biaya admin <strong>Rp 5.000</strong>:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc pl-5 space-y-1">
                <li><strong>Uang fisik laci berkurang:</strong> -Rp 100.000 (diserahkan ke tangan pelanggan).</li>
                <li><strong>Saldo digital masuk ke e-wallet konter:</strong> +Rp 105.000 (uang ditransfer pelanggan ke HP kasir).</li>
                <li><strong>Keuntungan konter:</strong> <strong>+Rp 5.000</strong> (murni jasa admin).</li>
              </ul>
            </div>

            {/* Faktor 4: Metode Bayar Non-Tunai (QRIS / Bank) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                <QrCode className="w-4 h-4" />
                <span>4. Pembayaran Non-Tunai (QRIS & Transfer Bank)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Uang hasil pembayaran QRIS dan transfer bank langsung masuk ke <strong>rekening bank</strong>, bukan uang tunai di laci kasir. Oleh karena itu, sistem memisahkan rincian <strong>Uang Tunai Laci</strong> dan <strong>Non-Tunai</strong>.
              </p>
            </div>
          </div>

          {/* Tabel Perbandingan Dua Mode */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pilih Mode Perhitungan Sesuai Kebutuhan Anda:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3.5 h-3.5" />
                  Mode Kas Laci Fisik (Default)
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Menghitung uang fisik di laci kasir. Cocok jika setiap tutup toko Anda menghitung fisik lembaran uang kertas & koin di laci.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Mode Tanpa Kas (Murni Transaksi)
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Menghitung murni <strong>Total Omset Penjualan</strong>, <strong>Modal Produk</strong>, dan <strong>Laba Bersih</strong> tanpa memperhitungkan uang kas awal laci. Cocok untuk penghitungan manual transaksi konter!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Virgio Celluler • Sistem Keuangan Transparan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
