import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Transaction, DailyArchive, Product, StoreSettings } from '../types';
import { CATEGORY_INFO, formatDateTimeIndo } from './formatters';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Google Auth Provider with Workspace Scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;

// Cache the access token in memory (MANDATORY: never in localStorage)
let cachedAccessToken: string | null = null;

// Auth state change listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token will be acquired via user sign-in popup or refreshed on sign in
        if (onAuthSuccess && cachedAccessToken) {
          onAuthSuccess(user, cachedAccessToken);
        } else if (onAuthFailure) {
          onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google OAuth.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Sign out and clear in-memory token
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ========================================================
// GOOGLE DRIVE BACKUP UTILITIES
// ========================================================

const BACKUP_FILE_NAME = 'virgio_celluler_pos_backup.json';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Cari file cadangan Virgio Celluler di Google Drive pengguna
 */
export async function findDriveBackupFile(token: string): Promise<DriveFileInfo | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size,webViewLink)&pageSize=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Gagal mencari cadangan di Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Simpan atau perbarui cadangan JSON lengkap ke Google Drive
 */
export async function uploadBackupToDrive(
  token: string,
  backupData: any
): Promise<{ fileId: string; modifiedTime: string }> {
  const existing = await findDriveBackupFile(token);
  const jsonContent = JSON.stringify(backupData, null, 2);

  if (existing?.id) {
    // Update existing file
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`;
    const res = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!res.ok) {
      throw new Error(`Gagal memperbarui file di Google Drive: ${res.statusText}`);
    }

    const updated = await res.json();
    return {
      fileId: existing.id,
      modifiedTime: updated.modifiedTime || new Date().toISOString(),
    };
  } else {
    // Create new file with multipart upload
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: 'Cadangan Otomatis Data Kasir & Transaksi Virgio Celluler',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonContent +
      closeDelim;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal membuat file baru di Google Drive: ${res.statusText}`);
    }

    const created = await res.json();
    return {
      fileId: created.id,
      modifiedTime: created.modifiedTime || new Date().toISOString(),
    };
  }
}

/**
 * Unduh data cadangan dari Google Drive
 */
export async function downloadBackupFromDrive(token: string): Promise<any> {
  const existing = await findDriveBackupFile(token);
  if (!existing?.id) {
    throw new Error('File cadangan tidak ditemukan di Google Drive Anda.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengunduh file cadangan: ${res.statusText}`);
  }

  return await res.json();
}

// ========================================================
// GOOGLE SHEETS (SPREADSHEET) UTILITIES
// ========================================================

const SPREADSHEET_TITLE = 'Virgio Celluler - Rekap Kasir & Transaksi';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}

/**
 * Temukan spreadsheet Virgio Celluler atau buat baru jika belum ada
 */
export async function findOrCreateSpreadsheet(token: string): Promise<SpreadsheetInfo> {
  // 1. Cari file spreadsheet di Drive
  const query = encodeURIComponent(
    `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const file = searchData.files[0];
      return {
        id: file.id,
        name: file.name,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      };
    }
  }

  // 2. Jika belum ada, buat spreadsheet baru via Google Sheets API
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        { properties: { title: 'Transaksi Hari Ini' } },
        { properties: { title: 'Rekap Tutup Buku & Arsip' } },
        { properties: { title: 'Katalog Produk & Stok' } },
      ],
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Gagal membuat Google Spreadsheet baru: ${createRes.statusText}`);
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl =
    created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    id: spreadsheetId,
    name: SPREADSHEET_TITLE,
    url: spreadsheetUrl,
  };
}

/**
 * Sinkronkan seluruh data transaksi hari ini, arsip tutup buku, dan produk ke Google Spreadsheet
 */
export async function syncDataToGoogleSpreadsheet(
  token: string,
  spreadsheetId: string,
  payload: {
    activeTransactions: Transaction[];
    dailyArchives: DailyArchive[];
    products: Product[];
    sessionDate: string;
    settings: StoreSettings;
  }
): Promise<boolean> {
  // 1. Data Sheet 'Transaksi Hari Ini'
  const trxHeader = [
    'No',
    'Waktu',
    'Tanggal',
    'No. Struk',
    'Kategori',
    'Nama Produk / Layanan',
    'Nomor Tujuan / No Meter PLN / Rek',
    'Pelanggan',
    'Harga Modal (Rp)',
    'Harga Jual / Nominal (Rp)',
    'Biaya Admin (Rp)',
    'Total Transaksi (Rp)',
    'Keuntungan Bersih (Rp)',
    'Metode Bayar',
    'Arus Kas',
    'Catatan',
  ];

  const trxRows = payload.activeTransactions.map((t, idx) => {
    const meta = CATEGORY_INFO[t.category];
    return [
      idx + 1,
      formatDateTimeIndo(t.timestamp),
      t.date,
      t.receiptNumber,
      meta?.label || t.category,
      t.productName,
      t.targetNumber || '-',
      t.customerName || 'Umum',
      t.costPrice || 0,
      t.sellingPrice || 0,
      t.adminFee || 0,
      t.totalAmount || 0,
      t.profit || 0,
      t.paymentMethod.toUpperCase(),
      t.cashFlow === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)',
      t.notes || '-',
    ];
  });

  // Kosongkan dan update sheet Transaksi Hari Ini
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Transaksi Hari Ini'!A1:Z?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'Transaksi Hari Ini'!A1:P",
        values: [
          [`REKAP TRANSAKSI HARI INI - ${payload.settings.storeName || 'Virgio Celluler'} (${payload.sessionDate})`],
          [`Terakhir Diperbarui: ${new Date().toLocaleString('id-ID')} | Total: ${payload.activeTransactions.length} Transaksi`],
          [],
          trxHeader,
          ...trxRows,
        ],
      }),
    }
  );

  // 2. Data Sheet 'Rekap Tutup Buku & Arsip'
  const archiveHeader = [
    'No',
    'Tanggal Buku Kas',
    'Waktu Tutup Buku',
    'Modal Awal Kas (Rp)',
    'Total Pemasukan (Rp)',
    'Total Pengeluaran (Rp)',
    'Saldo Kas Akhir (Rp)',
    'Total Keuntungan / Laba (Rp)',
    'Jumlah Transaksi',
    'Keterangan',
  ];

  const archiveRows = payload.dailyArchives.map((a, idx) => [
    idx + 1,
    a.date,
    formatDateTimeIndo(a.closedAt),
    a.initialCash,
    a.totalIncome,
    a.totalExpense,
    a.netCash,
    a.totalProfit,
    a.transactionCount,
    a.note || '-',
  ]);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rekap Tutup Buku & Arsip'!A1:Z?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'Rekap Tutup Buku & Arsip'!A1:J",
        values: [
          [`RIWAYAT TUTUP BUKU & REKAP KASIR - ${payload.settings.storeName || 'Virgio Celluler'}`],
          [`Total Arsip: ${payload.dailyArchives.length} Hari | Terakhir Sinkron: ${new Date().toLocaleString('id-ID')}`],
          [],
          archiveHeader,
          ...archiveRows,
        ],
      }),
    }
  );

  // 3. Data Sheet 'Katalog Produk & Stok'
  const productHeader = [
    'No',
    'Kode Produk',
    'Nama Produk',
    'Kategori',
    'Provider / Operator',
    'Harga Modal (Rp)',
    'Harga Jual (Rp)',
    'Biaya Admin (Rp)',
    'Sisa Stok',
    'Status',
  ];

  const productRows = payload.products.map((p, idx) => {
    const meta = CATEGORY_INFO[p.category];
    return [
      idx + 1,
      p.code || '-',
      p.name,
      meta?.label || p.category,
      p.provider || '-',
      p.costPrice || 0,
      p.sellingPrice || 0,
      p.adminFee || 0,
      p.stock !== undefined ? p.stock : 'Tanpa Stok',
      p.isActive ? 'Aktif' : 'Non-Aktif',
    ];
  });

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Katalog Produk & Stok'!A1:Z?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'Katalog Produk & Stok'!A1:J",
        values: [
          [`KATALOG PRODUK & STOK BARANG - ${payload.settings.storeName || 'Virgio Celluler'}`],
          [`Total Produk: ${payload.products.length} Item | Terakhir Sinkron: ${new Date().toLocaleString('id-ID')}`],
          [],
          productHeader,
          ...productRows,
        ],
      }),
    }
  );

  return true;
}
