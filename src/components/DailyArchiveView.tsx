import React, { useState } from 'react';
import {
  Archive,
  Calendar,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  ChevronDown,
  ChevronUp,
  Printer,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { DailyArchive, Transaction } from '../types';
import { CashFlowTrendChart } from './CashFlowTrendChart';
import {
  formatDateIndo,
  formatDateTimeIndo,
  formatRupiah,
  CATEGORY_INFO,
} from '../utils/formatters';
import {
  exportArchiveListToExcel,
  exportTransactionsToExcel,
  exportTransactionsToCSV,
} from '../utils/excelExport';

interface DailyArchiveViewProps {
  archives: DailyArchive[];
  onOpenReceipt: (trx: Transaction) => void;
  onOpenManualClosing: () => void;
  todayTransactions?: Transaction[];
  todayDate?: string;
}

export const DailyArchiveView: React.FC<DailyArchiveViewProps> = ({
  archives,
  onOpenReceipt,
  onOpenManualClosing,
  todayTransactions = [],
  todayDate,
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Archive className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Buku Kas Harian & Arsip Riwayat Transaksi
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Sistem otomatis menyimpan riwayat setiap jam 11 malam (23:00) dan mereset kasir untuk hari baru. Seluruh data historis tersimpan rapi dan dapat diekspor ke Excel kapan saja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => exportArchiveListToExcel(archives)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Download Seluruh Rekapitulasi Harian ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Rekap Excel</span>
            </button>

            <button
              type="button"
              onClick={onOpenManualClosing}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
            >
              <Clock className="w-4 h-4" />
              <span>Tutup Buku Kasir Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Data Visualization: Grafik Tren Pemasukan & Pengeluaran */}
      <CashFlowTrendChart
        archives={archives}
        todayTransactions={todayTransactions}
        todayDate={todayDate}
      />

      {/* Archives List */}
      {archives.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-3">
            <Archive className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Arsip Buku Kas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Arsip harian akan otomatis dibuat setiap jam 23:00 malam setelah kasir tutup, atau Anda dapat menutup buku hari ini secara manual kapan saja.
          </p>
          <button
            type="button"
            onClick={onOpenManualClosing}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Tutup Buku Harian Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {archives.map((archive) => {
            const isExpanded = expandedDate === archive.date;

            return (
              <div
                key={archive.date}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all"
              >
                {/* Archive Header Summary */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Date & Meta */}
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {formatDateIndo(archive.date)}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {archive.transactionCount} Transaksi
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ditutup: {formatDateTimeIndo(archive.closedAt)}</span>
                        {archive.note && <span className="italic">• {archive.note}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Financial Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/80">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Pemasukan
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(archive.totalIncome)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Tarik Tunai / Out
                      </span>
                      <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {formatRupiah(archive.totalExpense)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Saldo Akhir Kas
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {formatRupiah(archive.netCash)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Keuntungan Bersih
                      </span>
                      <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                        +{formatRupiah(archive.totalProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() =>
                        exportTransactionsToExcel(
                          archive.transactions,
                          `Virgio_Celluler_Arsip_${archive.date}`
                        )
                      }
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                      title="Export Excel Transaksi Tanggal Ini"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(archive.date)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>{isExpanded ? 'Tutup Rincian' : 'Lihat Transaksi'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Table */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Rincian {archive.transactions.length} Transaksi Pada {archive.date}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            exportTransactionsToCSV(
                              archive.transactions,
                              `Virgio_Celluler_Arsip_${archive.date}`
                            )
                          }
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Download CSV</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 font-semibold">No. Struk</th>
                            <th className="py-2.5 px-3 font-semibold">Layanan / Produk</th>
                            <th className="py-2.5 px-3 font-semibold">Tujuan</th>
                            <th className="py-2.5 px-3 font-semibold">Arus Kas</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Untung</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Struk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                          {archive.transactions.map((trx) => (
                            <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                {trx.receiptNumber}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {trx.productName}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px]">
                                {trx.targetNumber || '-'}
                              </td>
                              <td className="py-2 px-3">
                                {trx.cashFlow === 'pemasukan' ? (
                                  <span className="text-[10px] text-emerald-600 font-semibold">
                                    + Masuk
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-600 font-semibold">
                                    - Tarik Tunai
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold">
                                {formatRupiah(trx.totalAmount)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-purple-600 dark:text-purple-400 font-semibold">
                                +{formatRupiah(trx.profit)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => onOpenReceipt(trx)}
                                  className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                  title="Cetak Ulang Struk"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
