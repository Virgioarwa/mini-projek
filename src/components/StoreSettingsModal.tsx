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
} from 'lucide-react';
import { StoreSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { exportAllDataBackup, importDataBackup } from '../utils/storage';

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
  const [importStatus, setImportStatus] = useState<string>('');

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = importDataBackup(text);
        if (ok) {
          setImportStatus('Data berhasil dipulihkan!');
          onDataImported();
          setTimeout(() => setImportStatus(''), 3000);
        } else {
          setImportStatus('Gagal memulihkan data. Format file tidak sesuai.');
        }
      } catch (err) {
        setImportStatus('File tidak valid.');
      }
    };
    reader.readAsText(file);
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
                    placeholder="Jl. Raya Utama No. 88"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Konfigurasi Kasir & Tutup Buku */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Sistem Kasir & Jam Reset Harian</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modal Awal Kasir Standar (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={initialCashDefault === 0 ? '0' : (initialCashDefault || '')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      setInitialCashDefault(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {[0, 100000, 300000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInitialCashDefault(val)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                        val === 0
                          ? initialCashDefault === 0
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : initialCashDefault === val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {val === 0 ? 'Rp 0 (Tanpa Kas)' : `${(val / 1000).toFixed(0)}rb`}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Pilih Rp 0 jika ingin kasir harian selalu mulai tanpa kas fisik.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jam Tutup Buku Otomatis (Malam)
                </label>
                <select
                  value={autoCloseHour}
                  onChange={(e) => setAutoCloseHour(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={21}>Jam 21:00 (9 Malam)</option>
                  <option value={22}>Jam 22:00 (10 Malam)</option>
                  <option value={23}>Jam 23:00 (11 Malam - Rekomendasi)</option>
                  <option value={24}>Jam 24:00 (Tengah Malam)</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  Transaksi disimpan ke riwayat dan di-reset untuk pagi
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

          {/* Cadangan & Pulihkan Database */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cadangan & Pulihkan Data Lokal (100% Offline & Aman)</span>
            </h4>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <p>
                  <strong>Penyimpanan Lokal Mandiri:</strong> Seluruh data transaksi, buku kas harian, dan katalog produk tersimpan secara lokal di memori perangkat ini. Tidak membutuhkan internet ataupun akun cloud pihak ketiga.
                </p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Unduh file cadangan data lengkap (.json) secara berkala untuk disimpan di komputer/HP atau dipindahkan ke perangkat kasir lain.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={exportAllDataBackup}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup File (.json)</span>
                </button>

                <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pulihkan dari File (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

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
