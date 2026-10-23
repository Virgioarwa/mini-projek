import React, { useState, useEffect } from 'react';
import {
  Store,
  Clock,
  PlusCircle,
  Archive,
  Layers,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Lock,
  Calculator,
  TrendingUp,
} from 'lucide-react';
import { StoreSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  settings: StoreSettings;
  currentDate: string;
  activeTab: 'pos' | 'catalog' | 'archives' | 'analytics' | 'calculator' | 'guide';
  setActiveTab: (tab: 'pos' | 'catalog' | 'archives' | 'analytics' | 'calculator' | 'guide') => void;
  onOpenNewTransaction: () => void;
  onOpenCloseDayModal: () => void;
  onOpenSettings: () => void;
  todayTransactionCount: number;
  lowStockCount?: number;
  theme?: 'system' | 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentDate,
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenCloseDayModal,
  onOpenSettings,
  todayTransactionCount,
  lowStockCount = 0,
  theme,
  onToggleTheme,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timeUntilClosing, setTimeUntilClosing] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );

      // Hitung sisa waktu menuju jam 23:00 malam ini
      const closingDate = new Date();
      closingDate.setHours(settings.autoCloseHour || 23, 0, 0, 0);

      const diffMs = closingDate.getTime() - now.getTime();
      if (diffMs > 0) {
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilClosing(`${diffHrs}j ${diffMins}m`);
      } else {
        setTimeUntilClosing('Tutup Buku (23:00)');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.autoCloseHour]);

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs dark:shadow-md pt-safe transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* BARIS 1: Header Atas - Kiri: Logo Toko | Kanan: Jam, Tutup Kasir Manual, Pengaturan, Tema */}
        <div className="flex items-center justify-between py-2.5 sm:py-3.5 gap-2">
          {/* Logo & Store Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-blue-500/20 shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center transition-colors duration-300">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {settings.storeName || 'Virgio Celluler'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 shrink-0">
                  POS Konter
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-md">
                {settings.tagline || 'Pulsa, Data, PPOB, Token, E-Wallet & Tarik Tunai'}
              </p>
            </div>
          </div>

          {/* KANAN ATAS: Jam, Tutup Kasir Manual, Pengaturan, Tema */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Realtime Clock */}
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs transition-colors duration-300">
              <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono font-medium text-[11px] sm:text-xs">{currentTime || '--:-- WIB'}</span>
            </div>

            {/* Daily cycle badge (Desktop only) */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs transition-colors duration-300">
              <Lock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              <span>23:00: <strong className="font-medium text-amber-700 dark:text-amber-200">{timeUntilClosing}</strong></span>
            </div>

            {/* Tutup Kasir Harian Manual (Ditaruh di Kanan Atas) */}
            <button
              type="button"
              onClick={onOpenCloseDayModal}
              className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white border border-slate-200 dark:border-slate-700 font-medium text-xs transition-all active:scale-95 cursor-pointer"
              title="Tutup Kasir Harian Manual (Closing)"
              aria-label="Tutup Kasir Harian"
            >
              <Archive className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Tutup Kasir</span>
            </button>

            {/* Pengaturan Toko (Ditaruh di Kanan Atas) */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
              title="Pengaturan Toko & Kasir"
              aria-label="Pengaturan Toko"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Tombol Install App / APK */}
            <PWAInstallButton />

            {/* Tombol Ganti Tema Mode Siang (Putih & Outline Biru) / Mode Malam */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-amber-600 border-2 border-blue-600 ring-2 ring-blue-500/25 shadow-sm shadow-blue-500/10'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 shadow-xs'
                }`}
                title={
                  theme === 'light'
                    ? 'Mode Siang Aktif (Klik untuk Ganti ke Mode Malam)'
                    : 'Mode Malam Aktif (Klik untuk Ganti ke Mode Siang)'
                }
                aria-label="Ganti Tema Mode Siang atau Malam"
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500 animate-spin-slow shrink-0" />
                    <span className="hidden sm:inline font-bold text-blue-600">Siang</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="hidden sm:inline font-medium text-slate-300">Malam</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* BARIS 2: Tombol Input Transaksi Baru yang DI-PERLEBAR */}
        <div className="pb-2.5 sm:pb-3 pt-0.5">
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm sm:text-base transition-all shadow-md shadow-emerald-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            title="Input Transaksi Baru"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Input Transaksi Baru</span>
          </button>
        </div>

        {/* BARIS 3: Navigasi Tab - 6 Tab dengan Outline Biru di Mode Siang */}
        <div className="grid grid-cols-6 border-t border-slate-200 dark:border-slate-800/80 pt-1">
          {/* Tab 1: Kasir Hari Ini */}
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`py-2 px-1 sm:px-2.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'pos'
                ? 'text-blue-600 border-blue-600 bg-blue-50/90 font-bold dark:text-indigo-400 dark:border-indigo-500 dark:bg-slate-800/60 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/30'
            }`}
            title="Kasir Hari Ini"
            aria-label="Kasir Hari Ini"
          >
            <Store className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Kasir</span>
            {todayTransactionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 dark:bg-indigo-500 text-white font-bold leading-none">
                {todayTransactionCount}
              </span>
            )}
          </button>

          {/* Tab 2: Katalog Barang */}
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`py-2 px-1 sm:px-2.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer border-b-2 relative ${
              activeTab === 'catalog'
                ? 'text-blue-600 border-blue-600 bg-blue-50/90 font-bold dark:text-indigo-400 dark:border-indigo-500 dark:bg-slate-800/60 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/30'
            }`}
            title={lowStockCount > 0 ? `Katalog Barang (${lowStockCount} perlu restock)` : 'Katalog & Tambah Barang'}
            aria-label="Katalog & Tambah Barang"
          >
            <div className="relative flex items-center justify-center">
              <Layers className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-ping sm:hidden" />
              )}
            </div>
            <span className="hidden sm:inline">Katalog</span>
            {lowStockCount > 0 && (
              <span
                className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold leading-none shadow-xs flex items-center gap-0.5"
                title={`${lowStockCount} barang memiliki stok di bawah 5`}
              >
                <span>{lowStockCount}</span>
              </span>
            )}
          </button>

          {/* Tab 3: Buku Kas & Riwayat Arsip */}
          <button
            type="button"
            onClick={() => setActiveTab('archives')}
            className={`py-2 px-1 sm:px-2.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'archives'
                ? 'text-blue-600 border-blue-600 bg-blue-50/90 font-bold dark:text-indigo-400 dark:border-indigo-500 dark:bg-slate-800/60 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/30'
            }`}
            title="Buku Kas & Riwayat Arsip"
            aria-label="Buku Kas & Riwayat Arsip"
          >
            <Archive className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Buku Kas</span>
          </button>

          {/* Tab 4: Analisis Penjualan & Performa */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 sm:px-2.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-blue-600 bg-blue-50/90 font-bold dark:text-indigo-400 dark:border-indigo-500 dark:bg-slate-800/60 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/30'
            }`}
            title="Model Analisis Penjualan & Kebiasaan Pelanggan"
            aria-label="Analisis Penjualan"
          >
            <TrendingUp className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
            <span className="hidden sm:inline">Analisis</span>
          </button>

          {/* Tab 5: Kalkulator Kasir Manual */}
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-1 sm:px-2.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'calculator'
                ? 'text-blue-600 border-blue-600 bg-blue-50/90 font-bold dark:text-indigo-400 dark:border-indigo-500 dark:bg-slate-800/60 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/30'
            }`}
            title="Kalkulator Kasir & Hitung Manual"
            aria-label="Kalkulator Kasir"
          >
            <Calculator className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Kalkulator</span>
          </button>

          {/* Tab 6: Petunjuk Fitur Masa Depan */}
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-1 sm:px-2.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'guide'
                ? 'text-blue-600 border-blue-600 bg-blue-50/90 font-bold dark:text-indigo-400 dark:border-indigo-500 dark:bg-slate-800/60 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/30'
            }`}
            title="Petunjuk Fitur Masa Depan"
            aria-label="Petunjuk Fitur Masa Depan"
          >
            <HelpCircle className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Petunjuk</span>
          </button>
        </div>
      </div>
    </header>
  );
};
