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
import { InstallGuideModal } from './components/InstallGuideModal';
import { ManualCalculator } from './components/ManualCalculator';
import { EditTransactionModal } from './components/EditTransactionModal';
import { FinancialGuideModal } from './components/FinancialGuideModal';
import { SalesAnalyticsTab } from './components/SalesAnalyticsTab';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { User } from 'firebase/auth';
import {
  initAuth,
  uploadBackupToDrive,
  findOrCreateSpreadsheet,
  syncDataToGoogleSpreadsheet,
} from './utils/googleWorkspace';
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
  const [activeTab, setActiveTab] = useState<'pos' | 'catalog' | 'archives' | 'analytics' | 'calculator' | 'guide'>('pos');
  const [isNewTrxModalOpen, setIsNewTrxModalOpen] = useState(false);
  const [newTrxInitialAmount, setNewTrxInitialAmount] = useState<number | undefined>(undefined);
  const [receiptTrx, setReceiptTrx] = useState<Transaction | null>(null);
  const [receiptBatch, setReceiptBatch] = useState<Transaction[] | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [isEditTrxModalOpen, setIsEditTrxModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
  const [isFinancialGuideOpen, setIsFinancialGuideOpen] = useState(false);

  // Edit Initial Cash Modal
  const [isEditCashModalOpen, setIsEditCashModalOpen] = useState(false);
  const [editCashInput, setEditCashInput] = useState<number>(session.initialCash);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Cloud & Workspace Sync
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Initialize Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

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
  const {
    totalIncome,
    totalExpense,
    currentBalance,
    totalProfit,
    totalGrossSales,
    totalCostPrice,
    totalCashIncome,
    totalNonCashIncome,
  } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let profit = 0;
    let grossSales = 0;
    let costPrice = 0;
    let cashIncome = 0;
    let nonCashIncome = 0;

    transactions.forEach((t) => {
      if (t.cashFlow === 'pemasukan') {
        income += t.totalAmount;
        if (t.paymentMethod === 'tunai') {
          cashIncome += t.totalAmount;
        } else {
          nonCashIncome += t.totalAmount;
        }
      } else {
        expense += (t.cashAmountOut || t.totalAmount);
      }
      profit += t.profit;
      costPrice += Number(t.costPrice) || 0;

      // Omset penjualan kotor:
      // Untuk tarik tunai: omset murninya adalah biaya admin layanan
      if (t.category === 'tarik_tunai') {
        grossSales += Number(t.adminFee) || 0;
      } else {
        grossSales += (Number(t.sellingPrice) || 0) + (Number(t.adminFee) || 0);
      }
    });

    const balance = session.initialCash + income - expense;
    return {
      totalIncome: income,
      totalExpense: expense,
      currentBalance: balance,
      totalProfit: profit,
      totalGrossSales: grossSales,
      totalCostPrice: costPrice,
      totalCashIncome: cashIncome,
      totalNonCashIncome: nonCashIncome,
    };
  }, [transactions, session.initialCash]);

  // Count items with low stock (< 5)
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.isActive && p.stock !== undefined && p.stock < 5).length;
  }, [products]);

  // Otomatis cadangkan data transaksi ke Google Drive & Google Spreadsheet di background
  const triggerBackgroundCloudSync = useCallback(
    async (
      updatedTransactions: Transaction[],
      updatedArchives: DailyArchive[],
      updatedProducts: Product[],
      currentSession: ActiveSession,
      currentSettings: StoreSettings
    ) => {
      if (!accessToken || !currentUser) return;
      const autoTrxEnabled = localStorage.getItem('virgio_auto_sync_trx') !== 'false';
      if (!autoTrxEnabled) return;

      try {
        // 1. Cadangkan ke Google Drive
        const backupData = {
          storeSettings: currentSettings,
          products: updatedProducts,
          activeTransactions: updatedTransactions,
          dailyArchives: updatedArchives,
          activeSession: currentSession,
          exportDate: new Date().toISOString(),
          appName: 'Virgio Celluler POS',
          appVersion: '1.0.0',
        };
        const driveRes = await uploadBackupToDrive(accessToken, backupData);
        if (driveRes.modifiedTime) {
          setLastBackupTime(new Date(driveRes.modifiedTime).toLocaleString('id-ID'));
        }

        // 2. Sinkronkan ke Google Spreadsheet
        const sheet = await findOrCreateSpreadsheet(accessToken);
        await syncDataToGoogleSpreadsheet(accessToken, sheet.id, {
          activeTransactions: updatedTransactions,
          dailyArchives: updatedArchives,
          products: updatedProducts,
          sessionDate: currentSession.date,
          settings: currentSettings,
        });
      } catch (err) {
        console.warn('Auto-sync background notice:', err);
      }
    },
    [accessToken, currentUser]
  );

  // Save new transaction
  const handleSaveTransaction = (newTrx: Transaction, shouldPrint: boolean) => {
    const updated = [newTrx, ...transactions];
    setTransactions(updated);
    saveActiveTransactions(updated);

    let updatedProducts = products;
    // If product has stock, decrement it
    if (newTrx.productId) {
      updatedProducts = products.map((p) => {
        if (p.id === newTrx.productId && p.stock !== undefined && p.stock > 0) {
          return { ...p, stock: p.stock - 1 };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }

    // Auto-sync ke Google Drive & Google Spreadsheet
    triggerBackgroundCloudSync(updated, archives, updatedProducts, session, settings);

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
      setReceiptBatch(null);
      setIsReceiptModalOpen(true);
    }
  };

  // Save batch transactions (Input beberapa transaksi dalam 1 keranjang)
  const handleSaveBatchTransactions = (batchTrxs: Transaction[], shouldPrint: boolean) => {
    if (!batchTrxs || batchTrxs.length === 0) return;

    const updated = [...batchTrxs, ...transactions];
    setTransactions(updated);
    saveActiveTransactions(updated);

    // Decrement stock for tracked products
    const countMap: Record<string, number> = {};
    batchTrxs.forEach((t) => {
      if (t.productId) {
        countMap[t.productId] = (countMap[t.productId] || 0) + 1;
      }
    });

    let finalProducts = products;
    if (Object.keys(countMap).length > 0) {
      finalProducts = products.map((p) => {
        const qty = countMap[p.id];
        if (qty && p.stock !== undefined && p.stock > 0) {
          return { ...p, stock: Math.max(0, p.stock - qty) };
        }
        return p;
      });
      setProducts(finalProducts);
      saveProducts(finalProducts);
    }

    // Auto-sync batch ke Google Drive & Google Spreadsheet
    triggerBackgroundCloudSync(updated, archives, finalProducts, session, settings);

    const batchTotal = batchTrxs.reduce((sum, t) => sum + t.totalAmount, 0);
    if (batchTotal >= 50000) {
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // ignore
      }
    }

    showToast(
      `Batch Berhasil! ${batchTrxs.length} transaksi (${formatRupiah(batchTotal)}) berhasil disimpan.`
    );

    if (shouldPrint) {
      setReceiptTrx(batchTrxs[0]);
      setReceiptBatch(batchTrxs);
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
    setReceiptBatch(null);
    setIsReceiptModalOpen(true);
  };

  // Open edit modal for transaction
  const handleOpenEditTransaction = (trx: Transaction) => {
    setEditingTrx(trx);
    setIsEditTrxModalOpen(true);
  };

  // Update existing transaction
  const handleUpdateTransaction = (updatedTrx: Transaction, shouldPrint: boolean) => {
    const original = transactions.find((t) => t.id === updatedTrx.id);
    const updated = transactions.map((t) => (t.id === updatedTrx.id ? updatedTrx : t));
    setTransactions(updated);
    saveActiveTransactions(updated);

    // If productId changed and tracked stock
    if (original && original.productId !== updatedTrx.productId) {
      const updatedProducts = products.map((p) => {
        if (original.productId && p.id === original.productId && p.stock !== undefined) {
          return { ...p, stock: p.stock + 1 };
        }
        if (updatedTrx.productId && p.id === updatedTrx.productId && p.stock !== undefined && p.stock > 0) {
          return { ...p, stock: p.stock - 1 };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }

    showToast(
      `Transaksi ${updatedTrx.receiptNumber} (${updatedTrx.productName}) berhasil diperbarui!`
    );

    if (shouldPrint) {
      setReceiptTrx(updatedTrx);
      setIsReceiptModalOpen(true);
    }
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
    const updatedArchives = getDailyArchives();
    setArchives(updatedArchives);
    setTransactions([]);
    setSession(newSession);

    // Auto-sync closing book ke Google Drive & Sheets
    triggerBackgroundCloudSync([], updatedArchives, products, newSession, settings);

    showToast(
      `Buku kas harian ${archive.date} berhasil ditutup! Data tersimpan di Riwayat Arsip & Google Drive/Sheets.`
    );
  };

  // Edit Initial Cash
  const handleSaveInitialCash = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedInitialCash = Math.max(0, Number(editCashInput) || 0);
    const updatedSession: ActiveSession = {
      ...session,
      initialCash: updatedInitialCash,
    };
    setSession(updatedSession);
    saveActiveSession(updatedSession);
    setIsEditCashModalOpen(false);
    if (updatedInitialCash === 0) {
      showToast('Modal kas laci awal diatur ke Rp 0 (Mode Tanpa Kas).');
    } else {
      showToast(`Modal kas laci awal diperbarui: ${formatRupiah(updatedInitialCash)}`);
    }
  };

  // Set Initial Cash to 0 (Without Cash Mode) directly
  const handleSetZeroCash = () => {
    const updatedSession: ActiveSession = {
      ...session,
      initialCash: 0,
    };
    setSession(updatedSession);
    saveActiveSession(updatedSession);
    setEditCashInput(0);
    showToast('Modal kas laci awal diatur ke Rp 0 (Mode Tanpa Kas aktif).');
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
        onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
        isGoogleConnected={Boolean(currentUser)}
        googleUserEmail={currentUser?.email || undefined}
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
              totalGrossSales={totalGrossSales}
              totalCostPrice={totalCostPrice}
              totalCashIncome={totalCashIncome}
              totalNonCashIncome={totalNonCashIncome}
              onEditInitialCash={() => {
                setEditCashInput(session.initialCash);
                setIsEditCashModalOpen(true);
              }}
              onSetZeroCash={handleSetZeroCash}
              onOpenFinancialGuide={() => setIsFinancialGuideOpen(true)}
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
              onEditTransaction={handleOpenEditTransaction}
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

        {/* TAB 4: MODEL ANALISIS PENJUALAN & KEBIASAAN PELANGGAN (TAB BARU) */}
        {activeTab === 'analytics' && (
          <SalesAnalyticsTab
            archives={archives}
            todayTransactions={transactions}
            todayDate={session.date}
            products={products}
          />
        )}

        {/* TAB 5: KALKULATOR KASIR & HITUNG MANUAL (SETELAH RIWAYAT TRANSAKSI) */}
        {activeTab === 'calculator' && (
          <ManualCalculator
            currentCashBalance={currentBalance}
            onOpenNewTransactionWithAmount={(amount) => {
              setNewTrxInitialAmount(amount);
              setIsNewTrxModalOpen(true);
            }}
          />
        )}

        {/* TAB 6: PETUNJUK MASA DEPAN */}
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
        onClose={() => {
          setIsNewTrxModalOpen(false);
          setNewTrxInitialAmount(undefined);
        }}
        products={products}
        onSaveTransaction={handleSaveTransaction}
        onSaveBatchTransactions={handleSaveBatchTransactions}
        todaySequence={transactions.length + 1}
        initialSellingPrice={newTrxInitialAmount}
      />

      {/* 2. Modal Cetak Struk */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptBatch(null);
        }}
        transaction={receiptTrx}
        transactionsBatch={receiptBatch}
        settings={settings}
      />

      {/* 2b. Modal Edit Riwayat Transaksi */}
      <EditTransactionModal
        isOpen={isEditTrxModalOpen}
        onClose={() => {
          setIsEditTrxModalOpen(false);
          setEditingTrx(null);
        }}
        transaction={editingTrx}
        products={products}
        onUpdateTransaction={handleUpdateTransaction}
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
        onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
      />

      {/* 4b. Modal Cadangan Google Drive & Google Spreadsheet */}
      <GoogleDriveSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
        currentUser={currentUser}
        accessToken={accessToken}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          setAccessToken(token);
        }}
        onAuthLogout={() => {
          setCurrentUser(null);
          setAccessToken(null);
        }}
        onDataRestored={handleDataImported}
        settings={settings}
        lastBackupTime={lastBackupTime}
        setLastBackupTime={setLastBackupTime}
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
                    value={editCashInput === 0 ? '0' : (editCashInput || '')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      setEditCashInput(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pilih <strong className="text-rose-600 dark:text-rose-400 font-bold">Rp 0 (Tanpa Kas)</strong> jika Anda tidak ingin mencatat uang kas laci atau ingin melihat perhitungan murni transaksi.
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Tombol Cepat Shortcut:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 100000, 300000, 500000, 1000000].map((val) => {
                    const isSelected = editCashInput === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditCashInput(val)}
                        className={`py-1.5 text-[11px] font-bold rounded-lg border transition cursor-pointer text-center ${
                          val === 0
                            ? isSelected
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {val === 0 ? 'Rp 0' : `${(val / 1000).toFixed(0)}rb`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCashModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                >
                  Simpan Modal Awal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Panduan Pasang Layar Beranda / APK */}
      <InstallGuideModal />

      {/* 7. Modal Panduan Sistem Keuangan & Rumus */}
      <FinancialGuideModal
        isOpen={isFinancialGuideOpen}
        onClose={() => setIsFinancialGuideOpen(false)}
        onSetZeroCash={handleSetZeroCash}
        currentInitialCash={session.initialCash}
      />
    </div>
  );
}
