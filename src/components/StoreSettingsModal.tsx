import React, { useState } from 'react';
import {
  X,
  Settings,
  Store,
  Printer,
  Download,
  Upload,
  Coins,
  Clock,
  Phone,
  MapPin,
  FileText,
  Check,
  ShieldCheck,
  Copy,
  Share2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { StoreSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  exportAllDataBackup,
  importDataBackup,
  getBackupJSONString,
  getAllTransactionsCombined,
} from '../utils/storage';
import { copyTextToClipboard } from '../utils/fileDownloader';
import { exportTransactionsToExcel } from '../utils/excelExport';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onDataImported: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataImported,
}) => {
  const [storeName, setStoreName] = useState(settings.storeName || 'Virgio Celluler');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [initialCashDefault, setInitialCashDefault] = useState(settings.initialCashDefault || 500000);
  const [autoCloseHour, setAutoCloseHour] = useState(settings.autoCloseHour || 23);
  const [receiptFooterMessage, setReceiptFooterMessage] = useState(settings.receiptFooterMessage || '');
  const [printWidth, setPrintWidth] = useState<'58mm' | '80mm'>(settings.printWidth || '58mm');

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [showPasteRestore, setShowPasteRestore] = useState(false);
  const [pastedJSON, setPastedJSON] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      storeName: storeName.trim() || 'Virgio Celluler',
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      initialCashDefault: Number(initialCashDefault) || 0,
      autoCloseHour: Number(autoCloseHour) || 23,
      receiptFooterMessage: receiptFooterMessage.trim(),
      printWidth,
    });
    onClose();
  };

  // 1. Ekspor file cadangan via Native Share / Download
  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportMessage('Memproses data cadangan...');
    try {
      const res = await exportAllDataBackup();
      if (res.success) {
        if (res.method === 'share') {
          setExportMessage('✅ Menu penyimpanan Android dibuka. Pilih "Simpan ke File / Drive / WhatsApp".');
        } else if (res.method === 'cancelled') {
          setExportMessage('Penyimpanan dibatalkan.');
        } else {
          setExportMessage('✅ File cadangan (.json) berhasil diunduh ke perangkat Anda!');
        }
      } else {
        setExportMessage('⚠️ Pengunduhan otomatis terkendala. Gunakan tombol "Salin Teks Cadangan" di bawah.');
      }
    } catch (err: any) {
      setExportMessage('⚠️ Terjadi kendala saat mengunduh. Gunakan tombol "Salin Teks Cadangan".');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 6000);
    }
  };

  // 2. Salin teks JSON cadangan ke clipboard (100% Berfungsi di semua Android APK & WebView)
  const handleCopyBackupText = async () => {
    try {
      const jsonStr = getBackupJSONString();
      const success = await copyTextToClipboard(jsonStr);
      if (success) {
        setExportMessage('✅ Seluruh teks data cadangan berhasil disalin ke clipboard! Anda bisa menyimpannya di Catatan HP atau chat WA.');
      } else {
        setShowRawJSON(true);
        setExportMessage('Silakan salin teks JSON langsung dari kotak di bawah.');
      }
    } catch (err) {
      setShowRawJSON(true);
    } finally {
      setTimeout(() => setExportMessage(null), 6000);
    }
  };

  // 2b. Ekspor seluruh riwayat transaksi ke Excel (.xlsx)
  const handleExportAllExcel = async () => {
    setIsExporting(true);
    setExportMessage('Menyiapkan file Excel seluruh transaksi...');
    try {
      const allTrxs = getAllTransactionsCombined();
      const res = await exportTransactionsToExcel(allTrxs, 'Virgio_Celluler_Semua_Transaksi');
      setExportMessage(res?.message || '✅ File Excel berhasil disiapkan!');
    } catch (err: any) {
      setExportMessage('⚠️ Gagal menyiapkan file Excel.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 6000);
    }
  };

  // 3. Upload file dari picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = importDataBackup(text);
        if (ok) {
          setImportStatus('✅ Data berhasil dipulihkan dari file!');
          onDataImported();
          setTimeout(() => setImportStatus(''), 4000);
        } else {
          setImportStatus('❌ Gagal memulihkan data. Format file tidak sesuai.');
        }
      } catch (err) {
        setImportStatus('❌ File tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
  };

  // 4. Pulihkan dari teks yang ditempel (Sangat ampuh jika file picker Android terblokir)
  const handleRestoreFromPastedText = () => {
    if (!pastedJSON.trim()) {
      setImportStatus('❌ Kotak teks cadangan masih kosong.');
      return;
    }

    try {
      const ok = importDataBackup(pastedJSON.trim());
      if (ok) {
        setImportStatus('✅ Seluruh data berhasil dipulihkan dari teks cadangan!');
        setPastedJSON('');
        setShowPasteRestore(false);
        onDataImported();
        setTimeout(() => setImportStatus(''), 4000);
      } else {
        setImportStatus('❌ Format teks JSON tidak valid. Pastikan Anda menyalin seluruh isi file cadangan.');
      }
    } catch (err) {
      setImportStatus('❌ Gagal membaca teks JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Pengaturan Toko & Kasir</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Identitas Toko */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-indigo-500" />
              <span>Profil Konter</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Toko Konter
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Virgio Celluler"
                  className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Solusi Pulsa, Paket Data, PPOB & Layanan Keuangan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Toko
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Raya Konter No. 12"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pengaturan Operasional Kasir */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Operasional & Kas Laci</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modal Kas Laci Default (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={initialCashDefault === 0 ? '0' : (initialCashDefault || '')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      setInitialCashDefault(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Bisa diatur Rp 0 jika tidak ingin menghitung uang kas laci.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jam Tutup Buku Otomatis
                </label>
                <select
                  value={autoCloseHour}
                  onChange={(e) => setAutoCloseHour(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={21}>Jam 21:00 (9 Malam)</option>
                  <option value={22}>Jam 22:00 (10 Malam)</option>
                  <option value={23}>Jam 23:00 (11 Malam - Standar)</option>
                  <option value={24}>Jam 00:00 (Tengah Malam)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Sistem otomatis mengarsipkan transaksi harian pada jam ini.
                </span>
              </div>
            </div>
          </div>

          {/* Pengaturan Struk */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-emerald-500" />
              <span>Format Cetak Struk</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pesan Footer di Bawah Struk
                </label>
                <textarea
                  rows={2}
                  value={receiptFooterMessage}
                  onChange={(e) => setReceiptFooterMessage(e.target.value)}
                  placeholder="Terima kasih atas kunjungan Anda!"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lebar Kertas Printer Thermal
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="printWidth"
                      checked={printWidth === '58mm'}
                      onChange={() => setPrintWidth('58mm')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>58mm (Standar Mini Thermal POS)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="printWidth"
                      checked={printWidth === '80mm'}
                      onChange={() => setPrintWidth('80mm')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>80mm (Printer Kasir Besar)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CADANGAN & PULIHKAN DATA LOKAL (KOMPATIBEL ANDROID APK)  */}
          {/* ======================================================== */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cadangkan & Pulihkan Data (100% Offline & Aman)</span>
            </h4>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <p>
                  <strong>Penyimpanan Lokal Mandiri:</strong> Seluruh data tersimpan di memori perangkat ini. Khusus aplikasi APK Android / WebView, Anda dapat menggunakan tombol <strong>"Simpan / Bagikan File"</strong> atau <strong>"Salin Teks Cadangan"</strong> untuk menyimpan cadangan ke File Manager, Drive, atau WhatsApp.
                </p>
              </div>

              {/* Status & Feedback message */}
              {exportMessage && (
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{exportMessage}</span>
                </div>
              )}

              {/* ACTION BUTTONS: CADANGKAN DATA */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Opsi Cadangkan Data (Backup):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Tombol 1: Simpan / Bagikan File */}
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    <span>Simpan / Bagikan File (.json)</span>
                  </button>

                  {/* Tombol 1b: Ekspor Seluruh Transaksi ke Excel */}
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExportAllExcel}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Simpan atau bagikan laporan seluruh transaksi ke format Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Ekspor Excel (.xlsx)</span>
                  </button>

                  {/* Tombol 2: Salin ke Clipboard (100% Works in any offline APK) */}
                  <button
                    type="button"
                    onClick={handleCopyBackupText}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Salin seluruh data dalam format teks untuk disimpan di Catatan HP / WhatsApp"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Salin Teks Cadangan</span>
                  </button>

                  {/* Tombol 3: Intip Teks JSON */}
                  <button
                    type="button"
                    onClick={() => setShowRawJSON(!showRawJSON)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs"
                    title="Lihat teks kode data cadangan"
                  >
                    {showRawJSON ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Area Pratinjau Teks JSON Raw */}
              {showRawJSON && (
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 text-[10px] font-mono space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kode Data Cadangan JSON:</span>
                    <button
                      type="button"
                      onClick={handleCopyBackupText}
                      className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold"
                    >
                      Salin Semua
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={4}
                    value={getBackupJSONString()}
                    className="w-full p-2 bg-slate-950 text-emerald-400 rounded border border-slate-800 focus:outline-none select-all"
                  />
                </div>
              )}

              {/* ACTION BUTTONS: PULIHKAN DATA */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Opsi Pulihkan Data (Restore):
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Opsi 1: File Picker */}
                  <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Pilih File (.json)</span>
                    <input
                      type="file"
                      accept=".json,application/json,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Opsi 2: Tempel Teks */}
                  <button
                    type="button"
                    onClick={() => setShowPasteRestore(!showPasteRestore)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-500" />
                    <span>{showPasteRestore ? 'Tutup Tempel Teks' : 'Tempel Teks Cadangan (.json)'}</span>
                  </button>
                </div>
              </div>

              {/* Area Tempel Teks Cadangan */}
              {showPasteRestore && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <span>Tempel (Paste) Teks JSON Cadangan:</span>
                  </div>
                  <textarea
                    rows={4}
                    value={pastedJSON}
                    onChange={(e) => setPastedJSON(e.target.value)}
                    placeholder="Tempelkan seluruh kode JSON yang disalin di sini..."
                    className="w-full p-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPastedJSON('')}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400"
                    >
                      Bersihkan
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreFromPastedText}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                    >
                      Pulihkan Data Sekarang
                    </button>
                  </div>
                </div>
              )}

              {importStatus && (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                  {importStatus}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
            >
              Simpan Pengaturan Toko
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
