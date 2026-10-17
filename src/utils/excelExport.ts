import * as XLSX from 'xlsx';
import { Transaction, DailyArchive } from '../types';
import { CATEGORY_INFO, formatDateTimeIndo } from './formatters';
import { downloadOrShareBlob } from './fileDownloader';

export async function exportTransactionsToExcel(
  transactions: Transaction[],
  fileNamePrefix: string = 'Virgio_Celluler_Transaksi'
): Promise<{ success: boolean; message?: string }> {
  const safeList = transactions || [];

  // Row mapping (or placeholder row if empty)
  const rows = safeList.length > 0
    ? safeList.map((t, idx) => ({
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
      }))
    : [
        {
          No: 1,
          'No. Struk': '-',
          'Waktu Transaksi': 'Belum ada transaksi',
          Kategori: '-',
          'Nama Produk / Layanan': '-',
          'No. Tujuan / Rek / Meter': '-',
          'Nama Pelanggan': '-',
          'Arus Kas': '-',
          'Harga Modal (Rp)': 0,
          'Harga Jual (Rp)': 0,
          'Biaya Admin (Rp)': 0,
          'Total Nominal (Rp)': 0,
          'Uang Diterima / Bayar (Rp)': 0,
          'Kembalian (Rp)': 0,
          'Keuntungan Bersih (Rp)': 0,
          'Metode Bayar': '-',
          Catatan: 'Belum ada transaksi pada periode ini',
        },
      ];

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  let totalProfit = 0;

  safeList.forEach((t) => {
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
      'Waktu Transaksi': `Total Transaksi: ${safeList.length}`,
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

  // Write as array buffer blob for universal download & Android WebView share
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return await downloadOrShareBlob(
    blob,
    fullFileName,
    'Laporan Transaksi Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export async function exportTransactionsToCSV(
  transactions: Transaction[],
  fileNamePrefix: string = 'Virgio_Celluler_Transaksi'
): Promise<{ success: boolean; message?: string }> {
  const safeList = transactions || [];

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

  const rows = safeList.length > 0
    ? safeList.map((t, idx) => [
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
      ])
    : [
        [
          1,
          '"-"',
          '"Belum ada transaksi"',
          '"-"',
          '"-"',
          '"-"',
          '"-"',
          '"-"',
          0,
          0,
          0,
          0,
          0,
          '"-"',
          '"Belum ada data"',
        ],
      ];

  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const now = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return await downloadOrShareBlob(blob, `${fileNamePrefix}_${now}.csv`, 'Laporan Transaksi CSV', 'text/csv');
}

export async function exportArchiveListToExcel(
  archives: DailyArchive[]
): Promise<{ success: boolean; message?: string }> {
  const safeList = archives || [];

  const rows = safeList.length > 0
    ? safeList.map((a, idx) => ({
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
      }))
    : [
        {
          No: 1,
          Tanggal: new Date().toISOString().slice(0, 10),
          'Waktu Tutup Buku': 'Belum ada arsip',
          'Saldo Awal (Rp)': 0,
          'Total Pemasukan (Rp)': 0,
          'Total Pengeluaran/Tarik Tunai (Rp)': 0,
          'Saldo Akhir Kas (Rp)': 0,
          'Total Keuntungan (Rp)': 0,
          'Jumlah Transaksi': 0,
          Catatan: 'Belum ada arsip tutup buku harian',
        },
      ];

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Harian');

  const now = new Date().toISOString().slice(0, 10);
  const fullFileName = `Virgio_Celluler_Rekap_Harian_${now}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return await downloadOrShareBlob(
    blob,
    fullFileName,
    'Rekapitulasi Harian Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}
