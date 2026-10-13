import * as XLSX from 'xlsx';
import { Transaction, DailyArchive } from '../types';
import { CATEGORY_INFO, formatDateTimeIndo } from './formatters';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  fileNamePrefix: string = 'Virgio_Celluler_Transaksi'
) {
  if (!transactions || transactions.length === 0) {
    alert('Tidak ada transaksi untuk diekspor.');
    return;
  }

  // Row mapping
  const rows = transactions.map((t, idx) => ({
    No: idx + 1,
    'No. Struk': t.receiptNumber,
    'Waktu Transaksi': formatDateTimeIndo(t.timestamp),
    Kategori: CATEGORY_INFO[t.category]?.label || t.category,
    'Nama Produk / Layanan': t.productName,
    'No. Tujuan / Rek / Meter': t.targetNumber || '-',
    'Nama Pelanggan': t.customerName || 'Umum',
    'Arus Kas': t.cashFlow === 'pemasukan' ? 'Pemasukan (Cash IN)' : 'Pengeluaran / Tarik Tunai (Cash OUT)',
    'Harga Modal (Rp)': t.costPrice,
    'Harga Jual (Rp)': t.sellingPrice,
    'Biaya Admin (Rp)': t.adminFee,
    'Total Nominal (Rp)': t.totalAmount,
    'Uang Diterima / Bayar (Rp)': t.cashGiven || t.totalAmount,
    'Kembalian (Rp)': t.cashChange || 0,
    'Keuntungan Bersih (Rp)': t.profit,
    'Metode Bayar': t.paymentMethod.toUpperCase(),
    Catatan: t.notes || '-',
  }));

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  let totalProfit = 0;

  transactions.forEach((t) => {
    if (t.cashFlow === 'pemasukan') {
      totalIncome += t.totalAmount;
    } else {
      totalExpense += (t.cashAmountOut || t.totalAmount);
    }
    totalProfit += t.profit;
  });

  const netBalance = totalIncome - totalExpense;

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Add summary rows at bottom
  const summaryRows = [
    {},
    {
      No: 'RINGKASAN LAPORAN KASIR',
      'No. Struk': 'VIRGIO CELLULER',
      'Waktu Transaksi': `Total Transaksi: ${transactions.length}`,
    },
    {
      No: 'Total Pemasukan (Cash In)',
      'No. Struk': totalIncome,
    },
    {
      No: 'Total Pengeluaran / Tarik Tunai (Cash Out)',
      'No. Struk': totalExpense,
    },
    {
      No: 'Saldo Kas Masuk Bersih (Net)',
      'No. Struk': netBalance,
    },
    {
      No: 'Estimasi Keuntungan Bersih (Profit)',
      'No. Struk': totalProfit,
    },
  ];

  XLSX.utils.sheet_add_json(ws, summaryRows, {
    skipHeader: true,
    origin: -1,
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi');

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fullFileName);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  fileNamePrefix: string = 'Virgio_Celluler_Transaksi'
) {
  if (!transactions || transactions.length === 0) {
    alert('Tidak ada transaksi untuk diekspor.');
    return;
  }

  const headers = [
    'No',
    'No Struk',
    'Waktu',
    'Kategori',
    'Produk/Layanan',
    'No Tujuan/Meter',
    'Nama Pelanggan',
    'Arus Kas',
    'Harga Modal',
    'Harga Jual',
    'Biaya Admin',
    'Total Bayar',
    'Keuntungan',
    'Metode Bayar',
    'Catatan',
  ];

  const rows = transactions.map((t, idx) => [
    idx + 1,
    `"${t.receiptNumber}"`,
    `"${formatDateTimeIndo(t.timestamp)}"`,
    `"${CATEGORY_INFO[t.category]?.label || t.category}"`,
    `"${t.productName.replace(/"/g, '""')}"`,
    `"${t.targetNumber || '-'}"`,
    `"${(t.customerName || 'Umum').replace(/"/g, '""')}"`,
    `"${t.cashFlow}"`,
    t.costPrice,
    t.sellingPrice,
    t.adminFee,
    t.totalAmount,
    t.profit,
    `"${t.paymentMethod}"`,
    `"${(t.notes || '-').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${fileNamePrefix}_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportArchiveListToExcel(archives: DailyArchive[]) {
  if (!archives || archives.length === 0) {
    alert('Belum ada arsip harian untuk diekspor.');
    return;
  }

  const rows = archives.map((a, idx) => ({
    No: idx + 1,
    Tanggal: a.date,
    'Waktu Tutup Buku': formatDateTimeIndo(a.closedAt),
    'Saldo Awal (Rp)': a.initialCash,
    'Total Pemasukan (Rp)': a.totalIncome,
    'Total Pengeluaran/Tarik Tunai (Rp)': a.totalExpense,
    'Saldo Akhir Kas (Rp)': a.netCash,
    'Total Keuntungan (Rp)': a.totalProfit,
    'Jumlah Transaksi': a.transactionCount,
    Catatan: a.note || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Harian');

  const now = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Virgio_Celluler_Rekap_Harian_${now}.xlsx`);
}
