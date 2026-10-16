import { Product, Transaction, DailyArchive, StoreSettings } from '../types';
import { DEFAULT_PRODUCTS } from '../data/defaultProducts';
import { getTodayDateString } from './formatters';
import { downloadOrShareBlob } from './fileDownloader';

const STORAGE_KEYS = {
  PRODUCTS: 'virgio_celluler_products',
  ACTIVE_TRANSACTIONS: 'virgio_celluler_active_transactions',
  DAILY_ARCHIVES: 'virgio_celluler_daily_archives',
  SETTINGS: 'virgio_celluler_settings',
  ACTIVE_SESSION: 'virgio_celluler_active_session',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Virgio Celluler',
  tagline: 'Solusi Pulsa, Paket Data, PPOB & Layanan Keuangan Terlengkap',
  address: 'Jl. Raya Utama No. 88 (Depan Pasar)',
  phone: '0812-3456-7890',
  initialCashDefault: 500000, // Rp 500.000 modal kas laci awal
  autoCloseHour: 23, // Jam 23:00 (11 Malam)
  receiptFooterMessage: 'Terima kasih atas kunjungan Anda!\nBarang/pulsa yang sudah dibeli tidak dapat ditukar kecuali gangguan sistem.',
  soundEnabled: true,
  printWidth: '58mm',
};

export interface ActiveSession {
  date: string; // YYYY-MM-DD
  initialCash: number;
  openedAt: string;
  isClosed: boolean;
}

// PRODUCTS
export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load products from storage:', err);
    return DEFAULT_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save products:', err);
  }
}

// SETTINGS
export function getStoredSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// ACTIVE TRANSACTIONS
export function getActiveTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRANSACTIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load active transactions:', err);
    return [];
  }
}

export function saveActiveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save active transactions:', err);
  }
}

// DAILY ARCHIVES
export function getDailyArchives(): DailyArchive[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_ARCHIVES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load daily archives:', err);
    return [];
  }
}

export function saveDailyArchives(archives: DailyArchive[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_ARCHIVES, JSON.stringify(archives));
  } catch (err) {
    console.error('Failed to save daily archives:', err);
  }
}

// ACTIVE SESSION
export function getActiveSession(): ActiveSession {
  const today = getTodayDateString();
  const settings = getStoredSettings();

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (raw) {
      const session: ActiveSession = JSON.parse(raw);
      return session;
    }
  } catch (err) {
    console.error('Failed to parse session:', err);
  }

  const newSession: ActiveSession = {
    date: today,
    initialCash: settings.initialCashDefault,
    openedAt: new Date().toISOString(),
    isClosed: false,
  };
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(newSession));
  return newSession;
}

export function saveActiveSession(session: ActiveSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save active session:', err);
  }
}

/**
 * Tutup buku harian:
 * Mengarsipkan transaksi hari ini ke dailyArchives, menghitung saldo akhir,
 * lalu mereset transaksi aktif untuk hari baru.
 */
export function closeDailySession(
  session: ActiveSession,
  transactions: Transaction[],
  note?: string
): { archive: DailyArchive; newSession: ActiveSession } {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalProfit = 0;

  transactions.forEach((t) => {
    if (t.cashFlow === 'pemasukan') {
      totalIncome += t.totalAmount;
    } else {
      totalExpense += t.cashAmountOut || t.totalAmount;
    }
    totalProfit += t.profit;
  });

  const netCash = session.initialCash + totalIncome - totalExpense;

  const archive: DailyArchive = {
    date: session.date,
    closedAt: new Date().toISOString(),
    initialCash: session.initialCash,
    totalIncome,
    totalExpense,
    netCash,
    totalProfit,
    transactionCount: transactions.length,
    transactions: [...transactions],
    note: note || 'Tutup buku harian otomatis/manual',
  };

  // Simpan ke arsip
  const archives = getDailyArchives();
  // Filter out any duplicate archive for the same date if closing re-occurred
  const filteredArchives = archives.filter((a) => a.date !== session.date);
  const updatedArchives = [archive, ...filteredArchives];
  saveDailyArchives(updatedArchives);

  // Buat sesi baru untuk hari berikutnya/sekarang
  const today = getTodayDateString();
  const settings = getStoredSettings();

  const newSession: ActiveSession = {
    date: today,
    initialCash: settings.initialCashDefault,
    openedAt: new Date().toISOString(),
    isClosed: false,
  };

  // Reset active transactions
  saveActiveTransactions([]);
  saveActiveSession(newSession);

  return { archive, newSession };
}

/**
 * Cek otomatis jam 23:00 atau pergantian hari:
 * Jika tanggal sesi lama != hari ini, atau sudah lewat jam 23:00 pada tanggal sesi,
 * maka arsipkan otomatis!
 */
export function checkAndAutoArchiveIfDue(): { didArchive: boolean; archive?: DailyArchive } {
  const session = getActiveSession();
  const today = getTodayDateString();
  const transactions = getActiveTransactions();
  const now = new Date();
  const currentHour = now.getHours();

  // Jika tanggal sesi sudah kemarin, atau tanggal sama tapi jam >= 23 malam
  const isPastClosingHour = currentHour >= 23;
  const isDifferentDate = session.date !== today;

  if ((isDifferentDate || (isPastClosingHour && !session.isClosed)) && transactions.length > 0) {
    const { archive } = closeDailySession(
      session,
      transactions,
      `Tutup buku otomatis sistem (Jam 23:00 / Pergantian Hari ${session.date})`
    );
    return { didArchive: true, archive };
  }

  // Jika tanggal beda dan transaksi kosong, cukup update tanggal sesi ke hari ini
  if (isDifferentDate && transactions.length === 0) {
    const settings = getStoredSettings();
    const refreshedSession: ActiveSession = {
      date: today,
      initialCash: settings.initialCashDefault,
      openedAt: new Date().toISOString(),
      isClosed: false,
    };
    saveActiveSession(refreshedSession);
  }

  return { didArchive: false };
}

// Backup & Restore Database
export function getBackupDataPackage(): any {
  return {
    storeSettings: getStoredSettings(),
    products: getStoredProducts(),
    activeTransactions: getActiveTransactions(),
    dailyArchives: getDailyArchives(),
    activeSession: getActiveSession(),
    exportDate: new Date().toISOString(),
    appVersion: '1.0.0',
    appName: 'Virgio Celluler POS',
  };
}

export function getBackupJSONString(): string {
  const data = getBackupDataPackage();
  return JSON.stringify(data, null, 2);
}

export async function exportAllDataBackup(): Promise<{ success: boolean; method: string; message?: string }> {
  const jsonStr = getBackupJSONString();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const fileName = `Virgio_Celluler_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  return await downloadOrShareBlob(blob, fileName, 'Cadangan Data Virgio Celluler', 'application/json');
}

export function importDataBackup(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return false;
    if (parsed.products && Array.isArray(parsed.products)) saveProducts(parsed.products);
    if (parsed.storeSettings && typeof parsed.storeSettings === 'object') saveSettings(parsed.storeSettings);
    if (parsed.dailyArchives && Array.isArray(parsed.dailyArchives)) saveDailyArchives(parsed.dailyArchives);
    if (parsed.activeTransactions && Array.isArray(parsed.activeTransactions)) saveActiveTransactions(parsed.activeTransactions);
    if (parsed.activeSession && typeof parsed.activeSession === 'object') saveActiveSession(parsed.activeSession);
    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}
