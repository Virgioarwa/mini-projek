import React, { useState } from 'react';
import { Download, Smartphone, X, Check, ExternalLink, HelpCircle, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed and running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs"
        title="Pasang Aplikasi Kasir di HP Android / APK"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="hidden sm:inline">Install App / APK</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* Modal Petunjuk Install APK / Tambah ke Layar HP */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pasang Aplikasi Kasir di HP (APK)
                  </h3>
                  <p className="text-xs text-slate-400">Virgio Celluler POS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {/* Opsi 1: Pasang Langsung Tanpa Download (PWA) */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-500 text-white font-bold text-[10px] uppercase">
                    Metode 1 (Paling Cepat)
                  </span>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    Pasang Langsung ke Layar HP (PWA)
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Aplikasi ini sudah berstandar <strong>PWA (Progressive Web App)</strong>. Anda bisa langsung memasangnya di HP tanpa perlu mengunduh file berat dari Play Store:
                </p>
                <ol className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5 list-decimal pl-4 pt-1">
                  <li>Buka link aplikasi ini di browser <strong>Google Chrome</strong> HP Anda.</li>
                  <li>Tekan menu <strong>titik 3 (⋮)</strong> di pojok kanan atas browser.</li>
                  <li>Pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li>
                    Ikon <strong>Virgio Celluler</strong> akan otomatis muncul di menu aplikasi HP Anda, terbuka secara layar penuh (layar penuh tanpa kotak URL), dan siap dipakai kasir!
                  </li>
                </ol>
              </div>

              {/* Opsi 2: Konversi ke File .APK Asli (PWABuilder) */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-600 text-white font-bold text-[10px] uppercase">
                    Metode 2 (File .APK Asli)
                  </span>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                    Generate File .APK Mandiri (Gratis via PWABuilder)
                  </h4>
                </div>
                <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                  Jika Anda membutuhkan file mentahan <code>.apk</code> untuk dibagikan lewat Bluetooth, WhatsApp, atau di-share ke HP kasir lain:
                </p>
                <ol className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5 list-decimal pl-4 pt-1">
                  <li>
                    Buka situs resmi <strong>PWABuilder (pwabuilder.com)</strong> dari Microsoft di komputer/laptop.
                  </li>
                  <li>Masukkan URL website aplikasi Virgio Celluler ini, lalu klik <strong>Start</strong>.</li>
                  <li>Pilih opsi <strong>"Package for Android"</strong> dan klik <strong>Generate APK</strong>.</li>
                  <li>File <code>.apk</code> siap diunduh dan langsung dapat diinstal di HP Android mana pun!</li>
                </ol>
              </div>

              {/* Opsi 3: Pengguna iPhone / iOS */}
              {isIOS && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Untuk Pengguna iPhone / Safari:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    1. Buka di Safari, tekan tombol <strong>Share</strong> (ikon kotak dengan panah atas).<br />
                    2. Geser ke bawah lalu pilih <strong>"Add to Home Screen" (Tambahkan ke Layar Utama)</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
