import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  AlertTriangle,
  FileSpreadsheet,
  HardDrive,
  LogOut,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  googleSignOut,
  uploadBackupToDrive,
  downloadBackupFromDrive,
  findDriveBackupFile,
  findOrCreateSpreadsheet,
  syncDataToGoogleSpreadsheet,
  SpreadsheetInfo,
  DriveFileInfo,
} from '../utils/googleWorkspace';
import {
  getStoredSettings,
  getStoredProducts,
  getActiveTransactions,
  getDailyArchives,
  getActiveSession,
  importDataBackup,
} from '../utils/storage';
import { StoreSettings } from '../types';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
  onDataRestored: () => void;
  settings: StoreSettings;
  lastBackupTime: string | null;
  setLastBackupTime: (time: string | null) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accessToken,
  onAuthSuccess,
  onAuthLogout,
  onDataRestored,
  settings,
  lastBackupTime,
  setLastBackupTime,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [driveFileInfo, setDriveFileInfo] = useState<DriveFileInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-backup toggle preferences
  const [autoSyncOnTransaction, setAutoSyncOnTransaction] = useState<boolean>(() => {
    return localStorage.getItem('virgio_auto_sync_trx') !== 'false';
  });
  const [autoSyncOnCloseBook, setAutoSyncOnCloseBook] = useState<boolean>(() => {
    return localStorage.getItem('virgio_auto_sync_close') !== 'false';
  });

  // Check existing Drive backup file & spreadsheet on open
  useEffect(() => {
    if (isOpen && accessToken) {
      checkCloudFiles(accessToken);
    }
  }, [isOpen, accessToken]);

  const checkCloudFiles = async (token: string) => {
    try {
      const driveFile = await findDriveBackupFile(token);
      if (driveFile) {
        setDriveFileInfo(driveFile);
        if (driveFile.modifiedTime) {
          setLastBackupTime(new Date(driveFile.modifiedTime).toLocaleString('id-ID'));
        }
      }

      const sheet = await findOrCreateSpreadsheet(token);
      if (sheet) {
        setSpreadsheetInfo(sheet);
      }
    } catch (err: any) {
      console.warn('Error checking cloud files:', err);
    }
  };

  const handleToggleAutoTrx = (val: boolean) => {
    setAutoSyncOnTransaction(val);
    localStorage.setItem('virgio_auto_sync_trx', val ? 'true' : 'false');
  };

  const handleToggleAutoClose = (val: boolean) => {
    setAutoSyncOnCloseBook(val);
    localStorage.setItem('virgio_auto_sync_close', val ? 'true' : 'false');
  };

  // 1. Google Sign-in Handler
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        setStatusMessage({
          text: `Berhasil terhubung dengan Google Account: ${result.user.email}`,
          type: 'success',
        });
        checkCloudFiles(result.accessToken);
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Gagal masuk dengan Google: ${err.message || 'Proses dibatalkan'}`,
        type: 'error',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // 2. Google Logout Handler
  const handleSignOut = async () => {
    if (confirm('Apakah Anda yakin ingin memutuskan sambungan akun Google?')) {
      await googleSignOut();
      onAuthLogout();
      setSpreadsheetInfo(null);
      setDriveFileInfo(null);
      setStatusMessage({
        text: 'Akun Google berhasil diputuskan.',
        type: 'info',
      });
    }
  };

  // 3. Cadangkan ke Google Drive
  const handleBackupToDrive = async () => {
    if (!accessToken) {
      setStatusMessage({ text: 'Silakan masuk dengan Google terlebih dahulu.', type: 'error' });
      return;
    }

    setIsSyncingDrive(true);
    setStatusMessage(null);

    try {
      const backupData = {
        storeSettings: getStoredSettings(),
        products: getStoredProducts(),
        activeTransactions: getActiveTransactions(),
        dailyArchives: getDailyArchives(),
        activeSession: getActiveSession(),
        exportDate: new Date().toISOString(),
        appName: 'Virgio Celluler POS',
        appVersion: '1.0.0',
      };

      const result = await uploadBackupToDrive(accessToken, backupData);
      const timeStr = new Date(result.modifiedTime).toLocaleString('id-ID');
      setLastBackupTime(timeStr);

      setStatusMessage({
        text: `Data kasir berhasil dicadangkan ke Google Drive pada ${timeStr}!`,
        type: 'success',
      });

      checkCloudFiles(accessToken);
    } catch (err: any) {
      setStatusMessage({
        text: `Gagal mencadangkan ke Google Drive: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // 4. Sinkronkan ke Google Spreadsheet
  const handleSyncToSheets = async () => {
    if (!accessToken) {
      setStatusMessage({ text: 'Silakan masuk dengan Google terlebih dahulu.', type: 'error' });
      return;
    }

    setIsSyncingSheets(true);
    setStatusMessage(null);

    try {
      const sheet = await findOrCreateSpreadsheet(accessToken);
      setSpreadsheetInfo(sheet);

      const session = getActiveSession();
      await syncDataToGoogleSpreadsheet(accessToken, sheet.id, {
        activeTransactions: getActiveTransactions(),
        dailyArchives: getDailyArchives(),
        products: getStoredProducts(),
        sessionDate: session.date,
        settings: getStoredSettings(),
      });

      setStatusMessage({
        text: `Data transaksi berhasil disinkronkan ke Google Spreadsheet "${sheet.name}"!`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({
        text: `Gagal memperbarui Google Spreadsheet: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // 5. Cadangkan Keduanya Sekaligus
  const handleFullBackup = async () => {
    await handleBackupToDrive();
    await handleSyncToSheets();
  };

  // 6. Pulihkan Data dari Google Drive (Destructive: Requires explicit confirmation)
  const handleRestoreFromDrive = async () => {
    if (!accessToken) return;

    const confirmed = window.confirm(
      'PERINGATAN PEMULIHAN DATA:\n\n' +
      'Memulihkan data dari Google Drive akan memperbarui transaksi, katalog, dan arsip di browser ini dengan file cadangan cloud.\n\n' +
      'Apakah Anda yakin ingin memulihkan data dari Google Drive?'
    );

    if (!confirmed) return;

    setIsRestoring(true);
    setStatusMessage(null);

    try {
      const backupData = await downloadBackupFromDrive(accessToken);
      const jsonStr = JSON.stringify(backupData);
      const success = importDataBackup(jsonStr);

      if (success) {
        onDataRestored();
        setStatusMessage({
          text: 'Data berhasil dipulihkan dari Google Drive! Sistem kasir telah disegarkan.',
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: 'Format cadangan di Google Drive tidak sesuai.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Gagal memulihkan dari Google Drive: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Cadangan Google Drive & Spreadsheet</span>
              </h3>
              <p className="text-xs text-slate-400">
                Data transaksi tetap aman di cloud pengguna meskipun browser dibersihkan atau ganti HP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            className={`px-5 py-3 text-xs font-semibold flex items-center justify-between gap-2 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* SECTION 1: GOOGLE AUTH STATUS */}
          {!currentUser ? (
            <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Cloud className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Hubungkan dengan Akun Google
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Masuk dengan akun Google Anda untuk mengaktifkan pencadangan otomatis ke <strong>Google Drive</strong> dan sinkronisasi rekap kasir langsung ke <strong>Google Spreadsheet</strong>.
                </p>
              </div>

              {/* Official Standard Sign In with Google Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleSignIn}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-3 transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentUser.displayName || 'Akun Google'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Tersambung
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 transition cursor-pointer self-end sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan Sambungan</span>
              </button>
            </div>
          )}

          {/* SECTION 2: THE TWO MAIN CLOUD DESTINATIONS */}
          {currentUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD 1: GOOGLE DRIVE BACKUP */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      <HardDrive className="w-4 h-4" />
                      <span>Cadangan Google Drive</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                      JSON Database
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Menyimpan seluruh transaksi, katalog produk, stok, dan arsip harian agar bisa dipulihkan kapan saja.
                  </p>
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-300 font-mono space-y-1">
                    <div>File: <strong className="text-slate-900 dark:text-white">virgio_celluler_pos_backup.json</strong></div>
                    <div>Cadangan terakhir: <strong>{lastBackupTime || 'Belum pernah'}</strong></div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    disabled={isSyncingDrive}
                    onClick={handleBackupToDrive}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDrive ? 'Mencadangkan...' : 'Cadangkan ke Drive Sekarang'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRestoring || !driveFileInfo}
                    onClick={handleRestoreFromDrive}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>{isRestoring ? 'Memulihkan Data...' : 'Pulihkan Data dari Drive'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 2: GOOGLE SPREADSHEET REKAP */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Google Spreadsheet</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                      Live Sheets
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Rekap tabel transaksi langsung masuk ke file Google Spreadsheet Anda (bisa dibuka di Excel / HP).
                  </p>
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-300 font-mono space-y-1">
                    <div>Spreadsheet: <strong className="text-slate-900 dark:text-white">Virgio Celluler - Rekap Kasir</strong></div>
                    <div>Tabs: <strong>Transaksi Hari Ini, Arsip, Stok</strong></div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {spreadsheetInfo?.url && (
                    <a
                      href={spreadsheetInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Google Spreadsheet ↗</span>
                    </a>
                  )}

                  <button
                    type="button"
                    disabled={isSyncingSheets}
                    onClick={handleSyncToSheets}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                    <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Perbarui Isi Spreadsheet Sekarang'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: AUTO-SYNC CONFIGURATION */}
          {currentUser && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Otomatisasi Pencadangan Cloud (Auto-Sync)
                </h4>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSyncOnTransaction}
                    onChange={(e) => handleToggleAutoTrx(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Otomatis Cadangkan & Sinkronkan setiap ada transaksi baru
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                      Setiap kasir mencatat transaksi atau batch di aplikasi, data langsung dikirim ke Google Drive & baris spreadsheet otomatis bertambah.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSyncOnCloseBook}
                    onChange={(e) => handleToggleAutoClose(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Otomatis Cadangkan saat Tutup Buku (Jam 23:00 / Manual)
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                      Saat sistem melakukan tutup buku harian otomatis jam 23:00, rekap kas harian langsung diarsipkan ke sheet 'Rekap Tutup Buku'.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Quick Info & Safety */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Keamanan Terjamin:</strong> File cadangan dan spreadsheet tersimpan secara privat di Google Drive pribadi Anda sendiri. Hanya akun Google Anda yang memiliki izin untuk membaca dan mengeditnya.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {currentUser ? 'Tersambung ke Google Drive & Sheets' : 'Belum terhubung ke Google'}
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                type="button"
                onClick={handleFullBackup}
                disabled={isSyncingDrive || isSyncingSheets}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive || isSyncingSheets ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Keduanya Sekarang</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
