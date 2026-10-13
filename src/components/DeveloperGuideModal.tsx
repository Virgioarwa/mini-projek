import React, { useState } from 'react';
import {
  HelpCircle,
  Bluetooth,
  Server,
  Camera,
  Database,
  Cloud,
  Code2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  BookOpen,
  Terminal,
} from 'lucide-react';

interface DeveloperGuideModalProps {
  onClose?: () => void;
  isStandalone?: boolean;
}

export const DeveloperGuideModal: React.FC<DeveloperGuideModalProps> = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const bluetoothSnippet = `// Contoh Snippet Web Bluetooth API untuk Printer Thermal ESC/POS di Chrome/Android
async function connectBluetoothPrinter() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    // Kirim byte ESC/POS untuk cetak teks receipt langsung!
    console.log("Printer terhubung:", device.name);
  } catch (error) {
    console.error("Gagal koneksi printer bluetooth:", error);
  }
}`;

  const ppobSnippet = `// Contoh Integrasi API PPOB (Digiflazz / VIP Reseller / Tripay)
// Buat endpoint proxy di backend Express /server.ts:
app.post('/api/ppob/topup', async (req, res) => {
  const { buyer_sku_code, customer_no, ref_id } = req.body;
  // Sign request dengan API Key Digiflazz / Provider
  const response = await fetch('https://api.digiflazz.com/v1/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.PPOB_USERNAME,
      buyer_sku_code,
      customer_no,
      ref_id,
      sign: generateSignature(ref_id)
    })
  });
  const data = await response.json();
  res.json(data);
});`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Panduan Pengembangan Fitur di Masa Depan
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Petunjuk arsitektur, integrasi hardware, API PPOB, dan database untuk mengembangkan toko <strong className="text-white">Virgio Celluler</strong> ke tingkat yang lebih canggih.
            </p>
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Panduan 1: Printer Bluetooth Thermal */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Bluetooth className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  1. Printer Bluetooth Thermal (ESC/POS)
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cetak struk tanpa dialog print browser
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Saat ini, aplikasi sudah mendukung <strong>Direct Print (window.print)</strong> dengan tata letak khusus struk thermal 58mm/80mm. Jika ingin menghubungkan langsung ke printer mini Bluetooth (seperti Panda, VSC, Iware, RPP02) di HP Android/Chrome tanpa dialog dialog popup:
            </p>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4 mb-3">
              <li>Gunakan standar <strong>Web Bluetooth API</strong> bawaan browser Google Chrome.</li>
              <li>Manfaatkan library <code>esc-pos-encoder</code> untuk format teks, bold, cut paper, dan logo toko.</li>
              <li>Printer akan terhubung sekali dan struk keluar dalam hitungan 0.5 detik.</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleCopy(bluetoothSnippet, 'bt')}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition cursor-pointer"
            >
              {copiedKey === 'bt' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Snippet Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Contoh Kode Bluetooth</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panduan 2: Integrasi API Server PPOB Asli */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  2. Integrasi Server PPOB Otomatis
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Digiflazz, VIP Reseller, Tripay, Mobilepulsa
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Untuk mengotomatiskan injeksi pulsa, paket data, dan token listrik langsung ke nomor tujuan pelanggan:
            </p>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4 mb-3">
              <li>Daftar akun di agregator PPOB resmi (contoh: <strong>Digiflazz.com</strong> atau <strong>VIP-Reseller.co.id</strong>).</li>
              <li>Simpan <code>API_KEY</code> dan <code>USERNAME</code> di variabel lingkungan server (misal <code>.env</code>).</li>
              <li>Buat route proxy di <code>/server.ts</code> agar secret key tidak bocor ke sisi klien.</li>
              <li>Tampilkan respon Serial Number (SN) atau Kode Token PLN 20-digit langsung di struk transaksi!</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleCopy(ppobSnippet, 'ppob')}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition cursor-pointer"
            >
              {copiedKey === 'ppob' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Snippet Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Contoh Endpoint PPOB</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panduan 3: Barcode Scanner Kamera HP & USB */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                3. Scanner Barcode Fisik & Aksesoris
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Scan barcode voucher fisik atau kotak aksesoris
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Untuk mempercepat input voucher dan penjualan aksesoris HP di konter:
          </p>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              <strong>Barcode Scanner USB:</strong> Bisa langsung dicolok ke komputer kasir. Scanner USB bertindak seperti keyboard, jadi cukup tempatkan kursor pada kotak input SKU/Kode di form kasir.
            </li>
            <li>
              <strong>Scanner Kamera HP:</strong> Dapat menggunakan library open-source ringan seperti <code>html5-qrcode</code> untuk membaca barcode 1D (EAN-13, Code 128) dan QR Code pelanggan melalui kamera smartphone.
            </li>
          </ul>
        </div>

        {/* Panduan 4: Sinkronisasi Multi-Device / Cloud */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                4. Database Cloud & Multi-Kasir
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Akses kasir dari HP pegawai dan laptop bos secara bersamaan
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Saat ini aplikasi menyimpan data secara instan di peramban (Local Storage) dan aman dari mati lampu dengan fitur Ekspor Excel & File Cadangan (.json). Jika di masa depan toko membuka cabang atau memiliki beberapa karyawan:
          </p>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              Dapat mengaktifkan integrasi <strong>Firebase Firestore</strong> atau <strong>Cloud SQL (PostgreSQL)</strong>.
            </li>
            <li>
              Sistem akan secara otomatis menyinkronkan data transaksi dan saldo kasir real-time antar perangkat.
            </li>
            <li>
              Dapat ditambahkan fitur login kasir (Kasir Siang, Kasir Malam, dan Owner).
            </li>
          </ul>
        </div>
      </div>

      {/* Checklist Ringkasan Operasional */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Tips Operasional Harian Konter Virgio Celluler</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300 mt-3">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              ☀️ Pagi (Buka Toko)
            </span>
            Pastikan modal kas laci awal diisi sesuai uang fisik kembalian riil di laci kasir (misal Rp 500.000).
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              ⚡ Siang - Sore
            </span>
            Catat setiap penjualan dan tarik tunai secara realtime agar selisih uang fisik dan catatan selalu cocok 100%.
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              🌙 Malam (23:00)
            </span>
            Sistem otomatis menutup buku dan mengarsipkan riwayat. Anda dapat mendownload file Excel harian untuk pembukuan bulanan.
          </div>
        </div>
      </div>
    </div>
  );
};
