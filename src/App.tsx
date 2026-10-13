import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Header,
} from './components/Header';
import { StatsCards } from './components/StatsCards';
import { TransactionList } from './components/TransactionList';
import { NewTransactionModal } from './components/NewTransactionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CatalogManager } from './components/CatalogManager';
import { DailyArchiveView } from './components/DailyArchiveView';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { DeveloperGuideModal } from './components/DeveloperGuideModal';
import { CloseDayModal } from './components/CloseDayModal';
import {
  Product,
  Transaction,
  DailyArchive,
  StoreSettings,
} from './types';
import {
  getStoredProducts,
  saveProducts,
  getStoredSettings,
  saveSettings,
  getActiveTransactions,
  saveActiveTransactions,
  getDailyArchives,
  saveDailyArchives,
  getActiveSession,
  saveActiveSession,
  closeDailySession,
  checkAndAutoArchiveIfDue,
  ActiveSession,
} from './utils/storage';
import { formatRupiah, getTodayDateString } from './utils/formatters';
import {
  PlusCircle,
  Clock,
  Sparkles,
  Edit2,
  X,
  CheckCircle2,
  Info,
  Calendar,
} from 'lucide-react';

export default function App() {
  // Primary States
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings());
  const [session, setSession] = useState<ActiveSession>(getActiveSession());
  const [products, setProducts] = useState<Product[]>(getStoredProducts());
  const [transactions, setTransactions] = useState<Transaction[]>(getActiveTransactions());
  const [archives, setArchives] = useState<DailyArchive[]>(getDailyArchives());

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<'pos' | 'catalog' | 'archives' | 'guide'>('pos');
  const [isNewTrxModalOpen, setIsNewTrxModalOpen] = useState(false);
  const [receiptTrx, setReceiptTrx] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);

  // Edit Initial Cash Modal
  const [isEditCashModalOpen, setIsEditCashModalOpen] = useState(false);
  const [editCashInput, setEditCashInput] = useState<number>(session.initialCash);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme state with system preference auto-detection
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('virgio_theme') as any) || 'system';
  });

  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark';
      localStorage.setItem('virgio_theme', next);
      return next;
    });
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Check 23:00 auto-close on mount and every 30s
  useEffect(() => {
    const runAutoCheck = () => {
      const res = checkAndAutoArchiveIfDue();
      if (res.didArchive && res.archive) {
        setArchives(getDailyArchives());
        setTransactions([]);
        setSession(getActiveSession());
        showToast(
          `Sistem telah otomatis melakukan Tutup Buku jam 23:00 untuk tanggal ${res.archive.date}. Kasir telah di-reset untuk hari baru!`
        );
      }
    };

    runAutoCheck();
    const interval = setInterval(runAutoCheck, 30000);
    return () => clearInterval(interval);
  }, [showToast]);

  // Calculations for today's active shift
  const { totalIncome, totalExpense, currentBalance, totalProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let profit = 0;

    transactions.forEach((t) => {
      if (t.cashFlow === 'pemasukan') {
        income += t.totalAmount;
      } else {
        expense += (t.cashAmountOut || t.totalAmount);
      }
      profit += t.profit;
    });

    const balance = session.initialCash + income - expense;
    return {
      totalIncome: income,
      totalExpense: expense,
      currentBalance: balance,
      totalProfit: profit,
    };
  }, [transactions, session.initialCash]);

  // Count items with low stock (< 5)
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.isActive && p.stock !== undefined && p.stock < 5).length;
  }, [products]);

  // Save new transaction
  const handleSaveTransaction = (newTrx: Transaction, shouldPrint: boolean) => {
    const updated = [newTrx, ...transactions];
    setTransactions(updated);
    saveActiveTransactions(updated);

    // If product has stock, decrement it
    if (newTrx.productId) {
      const updatedProducts = products.map((p) => {
        if (p.id === newTrx.productId && p.stock !== undefined && p.stock > 0) {
          return { ...p, stock: p.stock - 1 };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }

    // Gentle confetti celebration for transactions > 50k
    if (newTrx.totalAmount >= 50000) {
      try {
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // ignore
      }
    }

    showToast(`Transaksi ${newTrx.receiptNumber} (${newTrx.productName}) berhasil dicatat!`);

    if (shouldPrint) {
      setReceiptTrx(newTrx);
      setIsReceiptModalOpen(true);
    }
  };

  // Delete transaction (e.g. wrong input)
  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveActiveTransactions(updated);

    // Restore stock if product had one
    if (target?.productId) {
      const updatedProducts = products.map((p) => {
        if (p.id === target.productId && p.stock !== undefined) {
          return { ...p, stock: p.stock + 1 };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }

    showToast('Transaksi berhasil dihapus.');
  };

  // Open receipt for specific transaction
  const handleOpenReceipt = (trx: Transaction) => {
    setReceiptTrx(trx);
    setIsReceiptModalOpen(true);
  };

  // Save products update from CatalogManager
  const handleSaveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveProducts(newProducts);
    showToast('Katalog produk berhasil diperbarui.');
  };

  // Save settings
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('Pengaturan toko berhasil disimpan.');
  };

  // Manual Close Day Confirmation
  const handleConfirmCloseDay = (note?: string) => {
    const { archive, newSession } = closeDailySession(session, transactions, note);
    setArchives(getDailyArchives());
    setTransactions([]);
    setSession(newSession);
    showToast(
      `Buku kas harian ${archive.date} berhasil ditutup! Data tersimpan di Riwayat Arsip.`
    );
  };

  // Edit Initial Cash
  const handleSaveInitialCash = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSession: ActiveSession = {
      ...session,
      initialCash: Number(editCashInput) || 0,
    };
    setSession(updatedSession);
    saveActiveSession(updatedSession);
    setIsEditCashModalOpen(false);
    showToast(`Modal kas laci awal diperbarui: ${formatRupiah(editCashInput)}`);
  };

  // Refresh everything after JSON import
  const handleDataImported = () => {
    setSettings(getStoredSettings());
    setProducts(getStoredProducts());
    setTransactions(getActiveTransactions());
    setArchives(getDailyArchives());
    setSession(getActiveSession());
    showToast('Seluruh data berhasil dipulihkan dari file backup!');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <Header
        settings={settings}
        currentDate={session.date}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={() => setIsNewTrxModalOpen(true)}
        onOpenCloseDayModal={() => setIsCloseDayModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        todayTransactionCount={transactions.length}
        lowStockCount={lowStockCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: KASIR & TRANSAKSI HARI INI */}
        {activeTab === 'pos' && (
          <div className="space-y-6">
            {/* 4 Stats Cards */}
            <StatsCards
              initialCash={session.initialCash}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              currentBalance={currentBalance}
              totalProfit={totalProfit}
              transactionCount={transactions.length}
              onEditInitialCash={() => {
                setEditCashInput(session.initialCash);
                setIsEditCashModalOpen(true);
              }}
            />

            {/* Quick Action Bar */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kasir Aktif: {session.date}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Otomatis tutup buku setiap jam 23:00 malam (11 malam)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsNewTrxModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Input Transaksi Baru</span>
                </button>
              </div>
            </div>

            {/* List of Today's Transactions */}
            <TransactionList
              transactions={transactions}
              onOpenReceipt={handleOpenReceipt}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenNewTransaction={() => setIsNewTrxModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 2: KATALOG & TAMBAH BARANG */}
        {activeTab === 'catalog' && (
          <CatalogManager
            products={products}
            onSaveProducts={handleSaveProducts}
          />
        )}

        {/* TAB 3: BUKU KAS & RIWAYAT ARSIP */}
        {activeTab === 'archives' && (
          <DailyArchiveView
            archives={archives}
            onOpenReceipt={handleOpenReceipt}
            onOpenManualClosing={() => setIsCloseDayModalOpen(true)}
            todayTransactions={transactions}
            todayDate={session.date}
          />
        )}

        {/* TAB 4: PETUNJUK MASA DEPAN */}
        {activeTab === 'guide' && <DeveloperGuideModal />}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-700 dark:text-slate-300">
              {settings.storeName || 'Virgio Celluler'}
            </strong>{' '}
            • Sistem Kasir & Rekapitulasi Konter
          </div>
          <div className="text-[11px] text-slate-400">
            Reset harian otomatis jam 23:00 • Dukungan Cetak Struk Thermal & Export Excel
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Modal Input Transaksi Baru */}
      <NewTransactionModal
        isOpen={isNewTrxModalOpen}
        onClose={() => setIsNewTrxModalOpen(false)}
        products={products}
        onSaveTransaction={handleSaveTransaction}
        todaySequence={transactions.length + 1}
      />

      {/* 2. Modal Cetak Struk */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={receiptTrx}
        settings={settings}
      />

      {/* 3. Modal Tutup Buku Harian */}
      <CloseDayModal
        isOpen={isCloseDayModalOpen}
        onClose={() => setIsCloseDayModalOpen(false)}
        date={session.date}
        initialCash={session.initialCash}
        transactions={transactions}
        onConfirmClose={handleConfirmCloseDay}
      />

      {/* 4. Modal Pengaturan Toko */}
      <StoreSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onDataImported={handleDataImported}
      />

      {/* 5. Modal Edit Modal Awal Kasir */}
      {isEditCashModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>Ubah Modal Kas Laci Awal</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditCashModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInitialCash} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Uang Fisik Awal di Laci (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={editCashInput || ''}
                    onChange={(e) => setEditCashInput(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Uang tunai kembalian yang dimasukkan ke laci saat membuka toko di pagi hari.
                </p>
              </div>

              <div className="flex gap-2">
                {[100000, 300000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEditCashInput(val)}
                    className="flex-1 py-1 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {(val / 1000).toFixed(0)}rb
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCashModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Simpan Modal Awal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
