import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DailyArchive, Transaction } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface CashFlowTrendChartProps {
  archives: DailyArchive[];
  todayTransactions?: Transaction[];
  todayDate?: string;
}

export const CashFlowTrendChart: React.FC<CashFlowTrendChartProps> = ({
  archives,
  todayTransactions = [],
  todayDate,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'profit'>('area');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '14days'>('all');

  // Compute today's running totals if today has transactions
  const todaySummary = useMemo(() => {
    if (!todayTransactions || todayTransactions.length === 0) return null;
    let income = 0;
    let expense = 0;
    let profit = 0;
    todayTransactions.forEach((t) => {
      if (t.cashFlow === 'pemasukan') {
        income += t.totalAmount;
      } else {
        expense += t.cashAmountOut || t.totalAmount;
      }
      profit += t.profit;
    });
    return {
      date: todayDate || new Date().toISOString().slice(0, 10),
      labelDate: 'Hari Ini (Aktif)',
      totalIncome: income,
      totalExpense: expense,
      totalProfit: profit,
      transactionCount: todayTransactions.length,
      isToday: true,
    };
  }, [todayTransactions, todayDate]);

  // Combine archives data in chronological order (earliest to latest for graph timeline)
  const chartData = useMemo(() => {
    // Sort archives by date ascending
    const sorted = [...archives].sort((a, b) => a.date.localeCompare(b.date));

    const mapped = sorted.map((a) => {
      // Format short date (misal: 12 Okt)
      const d = new Date(a.date);
      const shortLabel = isNaN(d.getTime())
        ? a.date
        : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);

      return {
        date: a.date,
        labelDate: shortLabel,
        totalIncome: a.totalIncome,
        totalExpense: a.totalExpense,
        totalProfit: a.totalProfit,
        transactionCount: a.transactionCount,
        isToday: false,
      };
    });

    // If today is active and not already closed in archives
    if (todaySummary && !sorted.some((a) => a.date === todaySummary.date)) {
      mapped.push(todaySummary);
    }

    // Filter by date range
    if (dateRange === '7days') {
      return mapped.slice(-7);
    } else if (dateRange === '14days') {
      return mapped.slice(-14);
    }
    return mapped;
  }, [archives, todaySummary, dateRange]);

  // Summary Metrics
  const metrics = useMemo(() => {
    if (chartData.length === 0) {
      return { totalIncome: 0, totalExpense: 0, totalProfit: 0, avgIncome: 0, daysCount: 0 };
    }
    let inc = 0;
    let exp = 0;
    let prof = 0;
    chartData.forEach((d) => {
      inc += d.totalIncome;
      exp += d.totalExpense;
      prof += d.totalProfit;
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      totalProfit: prof,
      avgIncome: Math.round(inc / chartData.length),
      daysCount: chartData.length,
    };
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
          <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1.5 mb-2 flex items-center justify-between">
            <span>{formatDateIndo(data.date)}</span>
            {data.isToday && (
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-normal">
                Hari Ini
              </span>
            )}
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Pemasukan:
              </span>
              <span className="font-bold">{formatRupiah(data.totalIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1 font-sans">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Pengeluaran/Tarik:
              </span>
              <span className="font-bold">{formatRupiah(data.totalExpense)}</span>
            </div>
            <div className="flex items-center justify-between text-purple-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1 font-sans">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Keuntungan:
              </span>
              <span className="font-bold">+{formatRupiah(data.totalProfit)}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans text-right pt-0.5">
              {data.transactionCount} transaksi
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // If no data at all (no archives & no today transactions)
  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Visualisasi Grafik Tren Pemasukan & Pengeluaran
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analisis pergerakan uang masuk dan tarik tunai konter
              </p>
            </div>
          </div>
        </div>
        <div className="py-10 text-center text-slate-400">
          <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold">Grafik akan muncul setelah transaksi tercatat atau saat tutup buku harian.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Mulai input transaksi hari ini untuk melihat visualisasi data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60 mb-6">
      {/* Top Header & Chart Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Grafik Tren Pemasukan & Pengeluaran Harian</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {chartData.length} Periode
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualisasi tren arus kas masuk (penjualan) vs arus kas keluar (tarik tunai)
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Tren Area
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Batang
            </button>
            <button
              type="button"
              onClick={() => setChartType('profit')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                chartType === 'profit'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Laba Saja
            </button>
          </div>

          {/* Date range dropdown */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Riwayat</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="14days">14 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Total Pemasukan
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
            {formatRupiah(metrics.totalIncome)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Total Pengeluaran / Tarik
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400">
            {formatRupiah(metrics.totalExpense)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Rata-rata Pemasukan / Hari
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
            {formatRupiah(metrics.avgIncome)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Akumulasi Keuntungan
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400">
            +{formatRupiah(metrics.totalProfit)}
          </span>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="w-full h-[320px] select-none">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="labelDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                  return `${val}`;
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {val === 'totalIncome'
                      ? 'Pemasukan (Cash IN)'
                      : val === 'totalExpense'
                      ? 'Pengeluaran / Tarik Tunai (Cash OUT)'
                      : 'Keuntungan Bersih (Profit)'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="totalIncome"
                name="totalIncome"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="totalExpense"
                name="totalExpense"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
              <Area
                type="monotone"
                dataKey="totalProfit"
                name="totalProfit"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#profitGradient)"
              />
            </AreaChart>
          ) : chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="labelDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                  return `${val}`;
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {val === 'totalIncome'
                      ? 'Pemasukan'
                      : val === 'totalExpense'
                      ? 'Pengeluaran/Tarik'
                      : 'Keuntungan'}
                  </span>
                )}
              />
              <Bar dataKey="totalIncome" name="totalIncome" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalExpense" name="totalExpense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalProfit" name="totalProfit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="labelDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                  return `${val}`;
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={() => (
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Tren Keuntungan Bersih Harian (Profit Konter)
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="totalProfit"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8b5cf6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
