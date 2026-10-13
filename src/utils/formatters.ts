import { TransactionCategory } from '../types';

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberOnly(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatDateIndo(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTimeIndo(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDateTimeIndo(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return '-';
  return `${formatDateIndo(date)} ${formatTimeIndo(date)}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateReceiptNumber(sequence: number): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateCode = `${year}${month}${day}`;
  const seqStr = String(sequence).padStart(4, '0');
  return `VC-${dateCode}-${seqStr}`;
}

export interface CategoryMeta {
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  iconName: string;
  defaultAdmin: number;
}

export const CATEGORY_INFO: Record<TransactionCategory, CategoryMeta> = {
  voucher: {
    label: 'Voucher Fisik / Gosok',
    shortLabel: 'Voucher',
    badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    borderCol: 'border-emerald-200 dark:border-emerald-800',
    iconName: 'Ticket',
    defaultAdmin: 0,
  },
  kuota_tembak: {
    label: 'Kuota Tembak / Inject',
    shortLabel: 'Kuota Tembak',
    badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    badgeText: 'text-blue-700 dark:text-blue-300',
    borderCol: 'border-blue-200 dark:border-blue-800',
    iconName: 'Zap',
    defaultAdmin: 0,
  },
  pulsa: {
    label: 'Pulsa Reguler',
    shortLabel: 'Pulsa',
    badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    borderCol: 'border-indigo-200 dark:border-indigo-800',
    iconName: 'Smartphone',
    defaultAdmin: 0,
  },
  token_listrik: {
    label: 'Token Listrik PLN',
    shortLabel: 'Token PLN',
    badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    badgeText: 'text-amber-700 dark:text-amber-300',
    borderCol: 'border-amber-200 dark:border-amber-800',
    iconName: 'Flame',
    defaultAdmin: 2500,
  },
  tagihan: {
    label: 'Bayar Tagihan (PPOB)',
    shortLabel: 'Tagihan',
    badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderCol: 'border-purple-200 dark:border-purple-800',
    iconName: 'Receipt',
    defaultAdmin: 3000,
  },
  ewallet: {
    label: 'Top Up E-Wallet',
    shortLabel: 'E-Wallet',
    badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    badgeText: 'text-sky-700 dark:text-sky-300',
    borderCol: 'border-sky-200 dark:border-sky-800',
    iconName: 'Wallet',
    defaultAdmin: 3000,
  },
  tarik_tunai: {
    label: 'Tarik Tunai',
    shortLabel: 'Tarik Tunai',
    badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    badgeText: 'text-rose-700 dark:text-rose-300',
    borderCol: 'border-rose-200 dark:border-rose-800',
    iconName: 'Banknote',
    defaultAdmin: 5000,
  },
  transfer: {
    label: 'Transfer Antar Bank',
    shortLabel: 'Transfer',
    badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    badgeText: 'text-teal-700 dark:text-teal-300',
    borderCol: 'border-teal-200 dark:border-teal-800',
    iconName: 'ArrowRightLeft',
    defaultAdmin: 5000,
  },
  aksesoris: {
    label: 'Aksesoris HP',
    shortLabel: 'Aksesoris',
    badgeBg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    badgeText: 'text-orange-700 dark:text-orange-300',
    borderCol: 'border-orange-200 dark:border-orange-800',
    iconName: 'Headphones',
    defaultAdmin: 0,
  },
  lainnya: {
    label: 'Lainnya / Umum',
    shortLabel: 'Lainnya',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    badgeText: 'text-slate-700 dark:text-slate-300',
    borderCol: 'border-slate-200 dark:border-slate-700',
    iconName: 'Layers',
    defaultAdmin: 0,
  },
};
