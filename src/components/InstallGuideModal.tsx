import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share2,
  MoreVertical,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Download,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const STORAGE_KEY = 'virgio_install_guide_seen_v1';

interface InstallGuideModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Do not show if already running in standalone mode (already installed as PWA/APK)
    if (isInstalled) {
      return;
    }

    // Check if user has already seen and dismissed the modal
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      // Delay opening slightly (1.5s) so the user sees the dashboard first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [forceOpen, isInstalled]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsOpen(false);
        if (onClose) onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300">
        {/* Header with App Branding */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white border-b border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Pasang ke Layar Utama HP
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wide">
                    Mode APK
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Gunakan Virgio Celluler layaknya aplikasi native Android/iOS
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Tutup panduan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Advantages Pill Strip */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-300">
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Layar Penuh (Full)</span>
            </div>
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Sangat Ringan</span>
            </div>
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Bisa Offline</span>
            </div>
          </div>
        </div>

        {/* Content Body: Guided Steps */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Quick Install Action if browser supports beforeinstallprompt */}
          {isInstallable && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-300">
                  Perangkat Mendukung Instalasi 1-Klik
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Tekan tombol di samping untuk memasang langsung ke menu aplikasi HP Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Pasang Sekarang</span>
              </button>
            </div>
          )}

          {/* Panduan Khusus iOS / Safari */}
          {isIOS ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-700">
                  Panduan Khusus iPhone / iPad (Safari)
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white mb-0.5">
                      Langkah 1: Tekan Tombol Bagikan (Share)
                    </strong>
                    Pada toolbar bawah browser Safari, tekan tombol ikon <strong>Share</strong> (kotak dengan panah mengarah ke atas).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white mb-0.5">
                      Langkah 2: Pilih "Tambahkan ke Layar Utama"
                    </strong>
                    Gulir ke bawah pada menu opsi lalu pilih <strong>"Add to Home Screen" (Tambahkan ke Layar Utama)</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white mb-0.5">
                      Langkah 3: Tekan "Tambah" (Add)
                    </strong>
                    Tekan <strong>Tambah</strong> di sudut kanan atas. Ikon Virgio Celluler akan langsung muncul di beranda iPhone Anda!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Panduan Android / Google Chrome */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-700">
                  Panduan Android (Google Chrome)
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white mb-0.5">
                      Langkah 1: Tekan Titik Tiga (⋮) di Chrome
                    </strong>
                    Buka menu browser dengan menekan ikon <strong>titik tiga (⋮)</strong> di sudut kanan atas browser Google Chrome.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white mb-0.5">
                      Langkah 2: Pilih "Instal aplikasi" / "Tambahkan ke Layar Utama"
                    </strong>
                    Cari dan pilih opsi <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white mb-0.5">
                      Langkah 3: Selesai!
                    </strong>
                    Aplikasi kasir <strong>Virgio Celluler</strong> akan terpasang di menu aplikasi HP Anda, terbuka secara layar penuh tanpa URL bar browser!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Jangan tampilkan panduan ini lagi</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-sm transition cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
