import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  Award,
  Users,
  CreditCard,
  Banknote,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Sparkles,
  PieChart as PieIcon,
  Flame,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Zap,
  Info,
  DollarSign,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { DailyArchive, Transaction, Product, TransactionCategory } from '../types';
import {
  formatRupiah,
  formatDateIndo,
  CATEGORY_INFO,
} from '../utils/formatters';
import { exportTransactionsToExcel } from '../utils/excelExport';

interface SalesAnalyticsTabProps {
  archives: DailyArchive[];
  todayTransactions: Transaction[];
  todayDate: string;
  products: Product[];
}

type PeriodFilter = 'today' | '7days' | '30days' | 'all';
type ProductRankMode = 'quantity' | 'profit';

export const SalesAnalyticsTab: React.FC<SalesAnalyticsTabProps> = ({
  archives,
  todayTransactions,
  todayDate,
  products,
}) => {
  // Global Period Filter
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  // Specific Best-Selling Product Period Filter (1 week vs 1 month vs all)
  const [productPeriod, setProductPeriod] = useState<'7days' | '30days' | 'all'>('7days');
  const [rankMode, setRankMode] = useState<ProductRankMode>('quantity');
  // Visual Chart Metric for 7 Days Trend
  const [trendMetric, setTrendMetric] = useState<'revenue' | 'profit' | 'both'>('both');

  // Combine all transactions (historical archives + today's active transactions)
  const allHistoricalTransactions = useMemo(() => {
    const fromArchives: Transaction[] = [];
    archives.forEach((archive) => {
      if (archive.transactions && Array.isArray(archive.transactions)) {
        fromArchives.push(...archive.transactions);
      }
    });

    // Merge with today's transactions (ensuring no duplicate IDs)
    const existingIds = new Set(fromArchives.map((t) => t.id));
    const todayUnique = todayTransactions.filter((t) => !existingIds.has(t.id));

    return [...todayUnique, ...fromArchives];
  }, [archives, todayTransactions]);

  // Helper to filter transactions by date range
  const filterByDateRange = (trxList: Transaction[], filter: PeriodFilter | '7days' | '30days' | 'all') => {
    const now = new Date();
    const todayStr = todayDate || now.toISOString().slice(0, 10);

    if (filter === 'today') {
      return trxList.filter((t) => t.date === todayStr);
    }

    if (filter === '7days') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
      return trxList.filter((t) => t.date >= sevenDaysAgoStr && t.date <= todayStr);
    }

    if (filter === '30days') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
      return trxList.filter((t) => t.date >= thirtyDaysAgoStr && t.date <= todayStr);
    }

    return trxList;
  };

  // Transactions for General Section (Total & Pendapatan, Kebiasaan Pelanggan)
  const filteredTransactions = useMemo(() => {
    return filterByDateRange(allHistoricalTransactions, period);
  }, [allHistoricalTransactions, period, todayDate]);

  // Transactions specifically for Best-Selling Products Section (1 week vs 1 month)
  const productFilteredTransactions = useMemo(() => {
    return filterByDateRange(allHistoricalTransactions, productPeriod);
  }, [allHistoricalTransactions, productPeriod, todayDate]);

  // MODEL 1: TOTAL & PENDAPATAN METRICS
  const revenueMetrics = useMemo(() => {
    let grossRevenue = 0;
    let netProfit = 0;
    let costOfGoods = 0;
    let adminFees = 0;
    let cashIn = 0;
    let nonCashIn = 0;
    let cashCount = 0;
    let qrisCount = 0;
    let transferCount = 0;

    filteredTransactions.forEach((t) => {
      // Gross sales
      if (t.category === 'tarik_tunai') {
        grossRevenue += Number(t.adminFee) || 0;
      } else {
        grossRevenue += (Number(t.sellingPrice) || 0) + (Number(t.adminFee) || 0);
      }

      netProfit += Number(t.profit) || 0;
      costOfGoods += Number(t.costPrice) || 0;
      adminFees += Number(t.adminFee) || 0;

      if (t.paymentMethod === 'tunai') {
        cashIn += t.totalAmount;
        cashCount++;
      } else if (t.paymentMethod === 'qris') {
        nonCashIn += t.totalAmount;
        qrisCount++;
      } else {
        nonCashIn += t.totalAmount;
        transferCount++;
      }
    });

    const totalCount = filteredTransactions.length;
    const aov = totalCount > 0 ? Math.round(grossRevenue / totalCount) : 0;
    const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';

    return {
      grossRevenue,
      netProfit,
      costOfGoods,
      adminFees,
      totalCount,
      aov,
      profitMargin,
      cashIn,
      nonCashIn,
      cashCount,
      qrisCount,
      transferCount,
    };
  }, [filteredTransactions]);

  // MODEL 2: ANALISIS KEBIASAAN PELANGGAN
  const customerHabits = useMemo(() => {
    // 1. Hourly distribution (06:00 to 23:00)
    const hourlyCounts: Record<number, number> = {};
    for (let h = 6; h <= 23; h++) hourlyCounts[h] = 0;

    // Time buckets
    let morningCount = 0; // 06:00 - 10:59
    let afternoonCount = 0; // 11:00 - 14:59
    let eveningCount = 0; // 15:00 - 17:59
    let nightCount = 0; // 18:00 - 23:00

    // 2. Category distribution
    const categoryCounts: Record<string, { count: number; totalAmount: number; label: string }> = {};

    // 3. Target numbers / customer frequency
    const targetMap: Record<string, { count: number; totalAmount: number; name?: string }> = {};

    filteredTransactions.forEach((t) => {
      const timeDate = new Date(t.timestamp);
      const hour = timeDate.getHours();

      if (hour >= 6 && hour <= 23) {
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      }

      if (hour >= 6 && hour < 11) morningCount++;
      else if (hour >= 11 && hour < 15) afternoonCount++;
      else if (hour >= 15 && hour < 18) eveningCount++;
      else if (hour >= 18 && hour <= 23) nightCount++;

      // Category breakdown
      const meta = CATEGORY_INFO[t.category];
      const catKey = t.category;
      if (!categoryCounts[catKey]) {
        categoryCounts[catKey] = {
          count: 0,
          totalAmount: 0,
          label: meta?.shortLabel || catKey,
        };
      }
      categoryCounts[catKey].count += 1;
      categoryCounts[catKey].totalAmount += t.totalAmount;

      // Target numbers / Customers
      const identifier = t.targetNumber || (t.customerName && t.customerName !== 'Umum' ? t.customerName : null);
      if (identifier) {
        if (!targetMap[identifier]) {
          targetMap[identifier] = {
            count: 0,
            totalAmount: 0,
            name: t.customerName !== 'Umum' ? t.customerName : undefined,
          };
        }
        targetMap[identifier].count += 1;
        targetMap[identifier].totalAmount += t.totalAmount;
      }
    });

    // Find busiest peak hour
    let peakHour = 19;
    let peakHourCount = 0;
    Object.entries(hourlyCounts).forEach(([h, count]) => {
      if (count > peakHourCount) {
        peakHourCount = count;
        peakHour = Number(h);
      }
    });

    const hourlyChartData = Object.entries(hourlyCounts).map(([h, count]) => ({
      hourLabel: `${String(h).padStart(2, '0')}:00`,
      transaksi: count,
    }));

    // Sort categories by popularity
    const topCategories = Object.entries(categoryCounts)
      .map(([key, data]) => ({
        key,
        ...data,
      }))
      .sort((a, b) => b.count - a.count);

    // Sort recurring customers
    const topCustomers = Object.entries(targetMap)
      .map(([target, data]) => ({
        target,
        ...data,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      hourlyChartData,
      morningCount,
      afternoonCount,
      eveningCount,
      nightCount,
      peakHour,
      peakHourCount,
      topCategories,
      topCustomers,
    };
  }, [filteredTransactions]);

  // MODEL 3: ANALISIS TREN PENJUALAN DALAM SATU MINGGU (7-Day Daily Trend)
  const weeklyTrendData = useMemo(() => {
    const days: { date: string; dayName: string; omset: number; laba: number; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);

      // Find transactions for this date
      const dayTrxs = allHistoricalTransactions.filter((t) => t.date === dateStr);

      let dayOmset = 0;
      let dayLaba = 0;
      dayTrxs.forEach((t) => {
        if (t.category === 'tarik_tunai') {
          dayOmset += Number(t.adminFee) || 0;
        } else {
          dayOmset += (Number(t.sellingPrice) || 0) + (Number(t.adminFee) || 0);
        }
        dayLaba += Number(t.profit) || 0;
      });

      days.push({
        date: dateStr,
        dayName,
        omset: dayOmset,
        laba: dayLaba,
        count: dayTrxs.length,
      });
    }

    // Identify Peak Day & Low Day
    let peakDay = days[0];
    let lowDay = days[0];

    days.forEach((day) => {
      if (day.omset > peakDay.omset) peakDay = day;
      if (day.omset < lowDay.omset) lowDay = day;
    });

    const totalWeeklyOmset = days.reduce((sum, d) => sum + d.omset, 0);
    const totalWeeklyLaba = days.reduce((sum, d) => sum + d.laba, 0);
    const totalWeeklyCount = days.reduce((sum, d) => sum + d.count, 0);
    const avgDailyOmset = Math.round(totalWeeklyOmset / 7);

    return {
      days,
      peakDay,
      lowDay,
      totalWeeklyOmset,
      totalWeeklyLaba,
      totalWeeklyCount,
      avgDailyOmset,
    };
  }, [allHistoricalTransactions]);

  // MODEL 4: ANALISIS PRODUK TERLARIS (1 Minggu vs 1 Bulan vs Semua)
  const topProductsAnalytics = useMemo(() => {
    const productStats: Record<
      string,
      {
        productName: string;
        category: TransactionCategory;
        quantity: number;
        totalOmset: number;
        totalProfit: number;
        avgAdmin: number;
        adminSum: number;
      }
    > = {};

    // Provider distribution (Telkomsel, PLN, DANA, dll.)
    const providerStats: Record<string, { count: number; omset: number; profit: number }> = {};

    productFilteredTransactions.forEach((t) => {
      const name = t.productName.trim();
      if (!productStats[name]) {
        productStats[name] = {
          productName: name,
          category: t.category,
          quantity: 0,
          totalOmset: 0,
          totalProfit: 0,
          avgAdmin: 0,
          adminSum: 0,
        };
      }

      const itemOmset =
        t.category === 'tarik_tunai'
          ? Number(t.adminFee) || 0
          : (Number(t.sellingPrice) || 0) + (Number(t.adminFee) || 0);

      productStats[name].quantity += 1;
      productStats[name].totalOmset += itemOmset;
      productStats[name].totalProfit += Number(t.profit) || 0;
      productStats[name].adminSum += Number(t.adminFee) || 0;

      // Detect provider
      const lower = name.toLowerCase();
      let providerName = 'Lainnya';
      if (lower.includes('telkomsel') || lower.includes('tsel') || lower.includes('by.u')) providerName = 'Telkomsel';
      else if (lower.includes('indosat') || lower.includes('im3')) providerName = 'Indosat IM3';
      else if (lower.includes('xl') || lower.includes('axis')) providerName = 'XL Axiata';
      else if (lower.includes('tri') || lower.includes('3')) providerName = 'Tri Indonesia';
      else if (lower.includes('smartfren')) providerName = 'Smartfren';
      else if (lower.includes('pln') || lower.includes('listrik') || lower.includes('token')) providerName = 'PLN Listrik';
      else if (lower.includes('dana')) providerName = 'DANA';
      else if (lower.includes('shopee') || lower.includes('spay')) providerName = 'ShopeePay';
      else if (lower.includes('ovo')) providerName = 'OVO';
      else if (lower.includes('gopay') || lower.includes('gojek')) providerName = 'GoPay';
      else if (lower.includes('bpjs')) providerName = 'BPJS Kesehatan';

      if (!providerStats[providerName]) {
        providerStats[providerName] = { count: 0, omset: 0, profit: 0 };
      }
      providerStats[providerName].count += 1;
      providerStats[providerName].omset += itemOmset;
      providerStats[providerName].profit += Number(t.profit) || 0;
    });

    const productList = Object.values(productStats).map((p) => ({
      ...p,
      avgAdmin: p.quantity > 0 ? Math.round(p.adminSum / p.quantity) : 0,
    }));

    // Sorted by Quantity (terlaris) or Profit (paling cuan)
    const sortedByQuantity = [...productList].sort((a, b) => b.quantity - a.quantity);
    const sortedByProfit = [...productList].sort((a, b) => b.totalProfit - a.totalProfit);

    const activeRanking = rankMode === 'quantity' ? sortedByQuantity : sortedByProfit;

    // Top Providers
    const topProviders = Object.entries(providerStats)
      .map(([name, stat]) => ({ name, ...stat }))
      .sort((a, b) => b.count - a.count);

    return {
      activeRanking: activeRanking.slice(0, 15),
      totalProductsSold: productList.reduce((sum, p) => sum + p.quantity, 0),
      totalProductProfit: productList.reduce((sum, p) => sum + p.totalProfit, 0),
      topProviders,
    };
  }, [productFilteredTransactions, rankMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP HEADER: TITLE & PERIOD SELECTOR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Model Analisis Penjualan & Kebiasaan Konter
                </h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Laporan intelijen bisnis real-time: performa laba, jam sibuk pembeli, tren mingguan & produk terlaris
                </p>
              </div>
            </div>
          </div>

          {/* Period Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-800/90 p-1 border border-slate-700/80 text-xs">
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: '7days', label: '1 Minggu' },
                { id: '30days', label: '1 Bulan' },
                { id: 'all', label: 'Semua Data' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPeriod(tab.id as PeriodFilter)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    period === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => exportTransactionsToExcel(filteredTransactions, `Laporan-Analisis-${period}`)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Download Data Terfilter ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODEL 1: TOTAL DAN PENDAPATAN (REVENUE & PROFIT KPI)      */}
      {/* ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-indigo-500"></span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              1. Total dan Pendapatan ({period === 'today' ? 'Hari Ini' : period === '7days' ? '1 Minggu Terakhir' : period === '30days' ? '1 Bulan Terakhir' : 'Seluruh Riwayat'})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {revenueMetrics.totalCount} transaksi tercatat
          </span>
        </div>

        {/* 6 Key Financial Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Omset Penjualan Kotor */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Omset Penjualan
            </span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
              {formatRupiah(revenueMetrics.grossRevenue)}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1.5">
              <span>Gross Sales</span>
            </div>
          </div>

          {/* Card 2: Keuntungan Bersih (Laba) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-xs relative overflow-hidden">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
              Keuntungan Bersih
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
              +{formatRupiah(revenueMetrics.netProfit)}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Laba Murni Konter</span>
            </div>
          </div>

          {/* Card 3: Modal Kulak / HPP */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Modal / HPP (Kulak)
            </span>
            <p className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-300 mt-1 font-mono">
              {formatRupiah(revenueMetrics.costOfGoods)}
            </p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
              Harga beli barang/kuota
            </span>
          </div>

          {/* Card 4: Biaya Admin Terkumpul */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Biaya Admin / Jasa
            </span>
            <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {formatRupiah(revenueMetrics.adminFees)}
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-1.5">
              Fee layanan & transfer
            </span>
          </div>

          {/* Card 5: Margin Laba Rata-rata */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Margin Keuntungan
            </span>
            <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
              {revenueMetrics.profitMargin}%
            </p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
              Rasio laba thd omset
            </span>
          </div>

          {/* Card 6: Nilai Rata-rata Transaksi (AOV) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Rata-rata Transaksi
            </span>
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 mt-1 font-mono">
              {formatRupiah(revenueMetrics.aov)}
            </p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
              AOV per pembeli
            </span>
          </div>
        </div>

        {/* Arus Kas Masuk: Tunai vs Non-Tunai */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <span>Komposisi Pembayaran:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Tunai (Cash):</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                {formatRupiah(revenueMetrics.cashIn)} ({revenueMetrics.cashCount}x)
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Non-Tunai (QRIS / Transfer):</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                {formatRupiah(revenueMetrics.nonCashIn)} ({revenueMetrics.qrisCount + revenueMetrics.transferCount}x)
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODEL 2: ANALISIS KEBIASAAN PELANGGAN                    */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-5 rounded-full bg-amber-500"></span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            2. Analisis Kebiasaan Pelanggan
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 2A: Jam Transaksi Paling Sibuk (Peak Hours Heatmap) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Pola Jam Ramai Pembeli (06:00 - 23:00)
                  </h4>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Paling Ramai: Jam {customerHabits.peakHour}:00 ({customerHabits.peakHourCount}x)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                Grafik jumlah transaksi berdasarkan jam belanja. Sangat berguna untuk mengatur jadwal jaga kasir konter.
              </p>

              {/* Hourly Bar Chart */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerHabits.hourlyChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="hourLabel" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#ffffff',
                      }}
                      formatter={(val: any) => [`${val} Transaksi`, 'Volume']}
                    />
                    <Bar dataKey="transaksi" radius={[4, 4, 0, 0]}>
                      {customerHabits.hourlyChartData.map((entry, index) => {
                        const isPeak = entry.hourLabel.startsWith(String(customerHabits.peakHour).padStart(2, '0'));
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isPeak ? '#f59e0b' : '#6366f1'}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time Slot Distribution Badges */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Pagi (06-11)</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{customerHabits.morningCount} trx</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Siang (11-15)</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{customerHabits.afternoonCount} trx</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Sore (15-18)</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{customerHabits.eveningCount} trx</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold">Malam (18-23)</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-300 mt-0.5 block">{customerHabits.nightCount} trx</span>
              </div>
            </div>
          </div>

          {/* 2B: Kategori Favorit & Pelanggan Sering Beli */}
          <div className="lg:col-span-5 space-y-4">
            {/* Top Categories Progress */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Kategori Paling Sering Dibeli</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Persentase permintaan layanan dari seluruh pelanggan.
              </p>

              <div className="space-y-2.5">
                {customerHabits.topCategories.slice(0, 5).map((cat) => {
                  const pct =
                    filteredTransactions.length > 0
                      ? Math.round((cat.count / filteredTransactions.length) * 100)
                      : 0;
                  return (
                    <div key={cat.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-300">{cat.label}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {cat.count} trx ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Recurring Customers / Target Numbers */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Pelanggan / Nomor Tujuan Paling Rutin</span>
              </h4>
              {customerHabits.topCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Belum ada riwayat nomor tujuan yang terulang.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {customerHabits.topCustomers.map((cust, i) => (
                    <div key={cust.target} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-[10px] flex items-center justify-center text-slate-600 dark:text-slate-300">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {cust.target}
                          </span>
                          {cust.name && (
                            <span className="text-[10px] text-slate-400 ml-1.5">({cust.name})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                          {cust.count}x Transaksi
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatRupiah(cust.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODEL 3: ANALISIS TREN PENJUALAN DALAM SATU MINGGU        */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-emerald-500"></span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              3. Analisis Tren Penjualan dalam Satu Minggu (7 Hari Terakhir)
            </h3>
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTrendMetric('both')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                trendMetric === 'both' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Semua (Omset & Laba)
            </button>
            <button
              type="button"
              onClick={() => setTrendMetric('revenue')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                trendMetric === 'revenue' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Omset Saja
            </button>
            <button
              type="button"
              onClick={() => setTrendMetric('profit')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                trendMetric === 'profit' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Laba Bersih Saja
            </button>
          </div>
        </div>

        {/* 7-Day Chart Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total Omset 7 Hari:</span>
                <strong className="font-mono text-slate-900 dark:text-white ml-1.5 text-sm">
                  {formatRupiah(weeklyTrendData.totalWeeklyOmset)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total Laba 7 Hari:</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400 ml-1.5 text-sm">
                  +{formatRupiah(weeklyTrendData.totalWeeklyLaba)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                👑 Hari Teramai: {weeklyTrendData.peakDay.dayName} ({formatRupiah(weeklyTrendData.peakDay.omset)})
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData.days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="omsetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="labaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dayName" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(val) => `${val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : `${val / 1000}rb`}`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#ffffff',
                  }}
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {(trendMetric === 'revenue' || trendMetric === 'both') && (
                  <Area
                    type="monotone"
                    dataKey="omset"
                    name="Omset Penjualan (Rp)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#omsetGrad)"
                  />
                )}
                {(trendMetric === 'profit' || trendMetric === 'both') && (
                  <Area
                    type="monotone"
                    dataKey="laba"
                    name="Keuntungan Bersih (Rp)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#labaGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 7-Day Day-by-Day Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            {weeklyTrendData.days.map((d) => (
              <div key={d.date} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">{d.dayName}</span>
                <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 block mt-1">
                  {formatRupiah(d.omset)}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">
                  +{formatRupiah(d.laba)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {d.count} trx
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODEL 4: ANALISIS PRODUK TERLARIS (1 BULAN / 1 MINGGU)   */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-rose-500"></span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                4. Analisis Produk Terlaris ({productPeriod === '7days' ? '1 Minggu' : productPeriod === '30days' ? '1 Bulan' : 'Semua Periode'})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peringkat produk berdasarkan volume penjualan dan kontribusi laba bersih
              </p>
            </div>
          </div>

          {/* Dual Toggle Controls: 1 Minggu vs 1 Bulan & Mode Urut */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Periode Khusus Produk (Permintaan user: 1 bulan / 1 minggu) */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProductPeriod('7days')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  productPeriod === '7days'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1 Minggu
              </button>
              <button
                type="button"
                onClick={() => setProductPeriod('30days')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  productPeriod === '30days'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1 Bulan
              </button>
              <button
                type="button"
                onClick={() => setProductPeriod('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  productPeriod === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua
              </button>
            </div>

            {/* Rank Mode Toggle: Qty vs Profit */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRankMode('quantity')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  rankMode === 'quantity'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Terlaris (Qty)
              </button>
              <button
                type="button"
                onClick={() => setRankMode('profit')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  rankMode === 'profit'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Paling Cuan (Laba Rp)
              </button>
            </div>
          </div>
        </div>

        {/* Top 10 Best Sellers Table */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>
                Peringkat Produk {rankMode === 'quantity' ? 'Paling Laris (Volume Terbanyak)' : 'Kontributor Keuntungan Terbesar'}
              </span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Total {topProductsAnalytics.totalProductsSold} item terjual
            </span>
          </div>

          {topProductsAnalytics.activeRanking.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              Belum ada data penjualan pada periode {productPeriod === '7days' ? '1 minggu' : '1 bulan'} ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">Nama Produk / Layanan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Kuantitas Terjual</th>
                    <th className="py-3 px-4 text-right">Total Omset</th>
                    <th className="py-3 px-4 text-right">Kontribusi Laba Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {topProductsAnalytics.activeRanking.map((prod, idx) => {
                    const meta = CATEGORY_INFO[prod.category];
                    const rankMedal =
                      idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

                    return (
                      <tr
                        key={prod.productName}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-bold text-sm">
                          {rankMedal}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {prod.productName}
                          </span>
                          {prod.avgAdmin > 0 && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400">
                              Avg Admin: {formatRupiah(prod.avgAdmin)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                              meta?.badgeBg || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {meta?.shortLabel || prod.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {prod.quantity}x
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatRupiah(prod.totalOmset)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          +{formatRupiah(prod.totalProfit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Provider Breakdown Cards */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <span>Distribusi Penjualan per Operator & Layanan ({topProductsAnalytics.topProviders.length} Provider)</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topProductsAnalytics.topProviders.map((prov) => (
              <div key={prov.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{prov.name}</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">
                  {prov.count} Transaksi
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                  Laba: +{formatRupiah(prov.profit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Business Intelligence Recommendation Tips */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
            <strong className="font-bold text-slate-900 dark:text-white block">
              Rekomendasi Cerdas Konter Virgio Celluler:
            </strong>
            <p>
              • Pastikan saldo deposit e-wallet dan server pulsa terisi penuh sebelum jam puncak <strong>({customerHabits.peakHour}:00 WIB)</strong> agar transaksi tidak pending saat jam sibuk.
            </p>
            <p>
              • Produk terlaris Anda (<strong>{topProductsAnalytics.activeRanking[0]?.productName || 'Voucher/Pulsa'}</strong>) menyumbang kontribusi laba signifikan. Pertahankan ketersediaan stok fisik voucher dan kelipatan biaya admin optimal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
