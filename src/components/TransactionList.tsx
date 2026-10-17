import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Tag,
  Receipt,
  Eye,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { Transaction, TransactionCategory } from '../types';
import {
  CATEGORY_INFO,
  formatDateTimeIndo,
  formatRupiah,
} from '../utils/formatters';
import { exportTransactionsToExcel, exportTransactionsToCSV } from '../utils/excelExport';

interface TransactionListProps {
  transactions: Transaction[];
  onOpenReceipt: (trx: Transaction) => void;
  onEditTransaction: (trx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenNewTransaction: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onOpenReceipt,
  onEditTransaction,
  onDeleteTransaction,
  onOpenNewTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cashFlowFilter, setCashFlowFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }
      // Cash flow filter
      if (cashFlowFilter !== 'all' && t.cashFlow !== cashFlowFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = t.productName.toLowerCase().includes(query);
        const matchCustomer = (t.customerName || '').toLowerCase().includes(query);
        const matchTarget = (t.targetNumber || '').toLowerCase().includes(query);
        const matchReceipt = t.receiptNumber.toLowerCase().includes(query);
        if (!matchName && !matchCustomer && !matchTarget && !matchReceipt) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, selectedCategory, cashFlowFilter, searchQuery]);

  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExportExcel = async () => {
    setExportStatus('Menyiapkan file Excel...');
    try {
      const res = await exportTransactionsToExcel(transactions);
      setExportStatus(res?.message || 'File Excel siap!');
    } catch (err: any) {
      setExportStatus('Gagal mengekspor Excel.');
    } finally {
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  const handleExportCSV = async () => {
    setExportStatus('Menyiapkan file CSV...');
    try {
      const res = await exportTransactionsToCSV(transactions);
      setExportStatus(res?.message || 'File CSV siap!');
    } catch (err: any) {
      setExportStatus('Gagal mengekspor CSV.');
    } finally {
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60 overflow-hidden">
      {/* Top Bar Filter & Export */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Daftar Transaksi Hari Ini</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {transactions.length} Transaksi
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Semua transaksi kasir sebelum reset tutup buku jam 23:00 malam
          </p>
          {exportStatus && (
            <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5 animate-in fade-in">
              <span>{exportStatus}</span>
            </div>
          )}
        </div>

        {/* Action & Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition cursor-pointer"
            title="Download Excel Spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-semibold transition cursor-pointer"
            title="Download CSV file"
          >
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 sm:px-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no struk, HP, produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {(Object.keys(CATEGORY_INFO) as TransactionCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_INFO[cat].label}
              </option>
            ))}
          </select>

          {/* Cash flow filter */}
          <select
            value={cashFlowFilter}
            onChange={(e) => setCashFlowFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Arus Kas</option>
            <option value="pemasukan">Hanya Pemasukan (Cash IN)</option>
            <option value="pengeluaran">Hanya Tarik Tunai (Cash OUT)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-slate-700 text-indigo-500 mx-auto flex items-center justify-center mb-3">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {transactions.length === 0
              ? 'Belum Ada Transaksi Hari Ini'
              : 'Tidak Ada Transaksi Sesuai Filter'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {transactions.length === 0
              ? 'Mulai catat transaksi penjualan pulsa, voucher, token, bayar tagihan atau tarik tunai sekarang.'
              : 'Coba ubah kata kunci pencarian atau reset filter kategori di atas.'}
          </p>
          {transactions.length === 0 && (
            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Transaksi Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 font-semibold">No. Struk / Waktu</th>
                <th className="py-3 px-4 font-semibold">Kategori & Produk</th>
                <th className="py-3 px-4 font-semibold">Tujuan / Pelanggan</th>
                <th className="py-3 px-4 font-semibold">Arus Kasir</th>
                <th className="py-3 px-4 font-semibold text-right">Total Transaksi</th>
                <th className="py-3 px-4 font-semibold text-right">Laba Bersih</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredTransactions.map((trx) => {
                const catMeta = CATEGORY_INFO[trx.category] || CATEGORY_INFO.lainnya;
                const isIncome = trx.cashFlow === 'pemasukan';

                return (
                  <tr
                    key={trx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* No Struk & Waktu */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {trx.receiptNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDateTimeIndo(trx.timestamp).split(' ').slice(-2).join(' ')}
                      </div>
                    </td>

                    {/* Kategori & Produk */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catMeta.badgeBg}`}
                        >
                          {catMeta.shortLabel}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                          {trx.paymentMethod}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">
                        {trx.productName}
                      </div>
                    </td>

                    {/* Tujuan / Pelanggan */}
                    <td className="py-3 px-4">
                      {trx.targetNumber ? (
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {trx.targetNumber}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {trx.customerName || 'Umum'}
                      </div>
                    </td>

                    {/* Arus Kas */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isIncome ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pemasukan (+ Kas)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tarik Tunai (- Kas)</span>
                        </span>
                      )}
                    </td>

                    {/* Total Transaksi */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div
                        className={`font-mono font-bold text-xs ${
                          isIncome ? 'text-slate-900 dark:text-white' : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(trx.totalAmount)}
                      </div>
                      {trx.adminFee > 0 && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          (Termasuk Admin {formatRupiah(trx.adminFee)})
                        </div>
                      )}
                    </td>

                    {/* Keuntungan */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">
                        +{formatRupiah(trx.profit)}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(trx)}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Cetak Struk Transaksi"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditTransaction(trx)}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Edit Transaksi (Koreksi Nominal / Nama)"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus transaksi ${trx.receiptNumber} (${trx.productName})?`
                              )
                            ) {
                              onDeleteTransaction(trx.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Hapus Transaksi (Salah Input)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
