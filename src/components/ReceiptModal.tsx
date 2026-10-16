import React, { useState } from 'react';
import {
  X,
  Printer,
  Check,
  Share2,
  Receipt as ReceiptIcon,
  Bluetooth,
  Smartphone,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, StoreSettings } from '../types';
import {
  CATEGORY_INFO,
  formatDateTimeIndo,
  formatRupiah,
} from '../utils/formatters';
import { ThermalPrintReceipt } from './ThermalPrintReceipt';
import {
  printWithRawBT,
  printWithWebBluetooth,
} from '../utils/thermalPrinter';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  transactionsBatch?: Transaction[] | null;
  settings: StoreSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  transactionsBatch,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [printWidth, setPrintWidth] = useState<'58mm' | '80mm'>(
    settings.printWidth || '58mm'
  );
  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [isBtPrinting, setIsBtPrinting] = useState(false);
  const [rawbtNotice, setRawbtNotice] = useState(false);

  const isBatch = Boolean(transactionsBatch && transactionsBatch.length > 1);
  const activeTrx = transaction || (transactionsBatch && transactionsBatch[0]) || null;

  if (!isOpen || (!activeTrx && !isBatch)) return null;

  const batchList = transactionsBatch || (activeTrx ? [activeTrx] : []);
  const totalAmount = batchList.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalAdminFee = batchList.reduce((sum, t) => sum + (t.adminFee || 0), 0);
  const firstTrx = batchList[0];
  const cashGiven = firstTrx?.cashGiven && firstTrx.cashGiven >= totalAmount
    ? firstTrx.cashGiven
    : batchList.reduce((sum, t) => sum + (t.cashGiven || t.totalAmount), 0);
  const cashChange = cashGiven >= totalAmount ? cashGiven - totalAmount : 0;
  const paymentMethod = firstTrx?.paymentMethod || 'tunai';
  const customerName = firstTrx?.customerName || 'Umum';

  const categoryMeta = activeTrx ? CATEGORY_INFO[activeTrx.category] : null;

  // 1. Direct Browser / System Print (Standard)
  const handleSystemPrint = () => {
    window.print();
  };

  // 2. Direct RawBT Print (Popular Android Driver for Mini Bluetooth Printers)
  const handleRawBTPrint = () => {
    const target = isBatch ? batchList : activeTrx!;
    const success = printWithRawBT(target, { ...settings, printWidth });
    if (success) {
      setRawbtNotice(true);
      setTimeout(() => setRawbtNotice(false), 3000);
    }
  };

  // 3. Web Bluetooth ESC/POS Direct Print
  const handleBluetoothPrint = async () => {
    setIsBtPrinting(true);
    setBtStatus('Mempersiapkan koneksi...');
    try {
      const target = isBatch ? batchList : activeTrx!;
      const res = await printWithWebBluetooth(
        target,
        { ...settings, printWidth },
        (status) => setBtStatus(status)
      );
      setBtStatus(res.message);
      setTimeout(() => {
        setBtStatus(null);
        setIsBtPrinting(false);
      }, 3500);
    } catch {
      setBtStatus('Gagal menghubungkan ke printer bluetooth.');
      setTimeout(() => {
        setBtStatus(null);
        setIsBtPrinting(false);
      }, 3500);
    }
  };

  // 4. Generate clean WhatsApp text receipt
  const handleCopyWhatsApp = () => {
    let messageText = '';
    if (isBatch) {
      const lines = [
        `*================================*`,
        `*${(settings.storeName || 'VIRGIO CELLULER').toUpperCase()}*`,
        `${settings.tagline || 'Layanan Transaksi & Pulsa'}`,
        `${settings.address || ''}`,
        `WA/Telp: ${settings.phone || ''}`,
        `*================================*`,
        `No. Batch : BATCH-${batchList.length}X`,
        `Ref Struk : ${firstTrx.receiptNumber}`,
        `Waktu     : ${formatDateTimeIndo(firstTrx.timestamp)}`,
        `Pelanggan : ${customerName}`,
        `--------------------------------`,
        `*RINCIAN BELANJA (${batchList.length} ITEM):*`,
      ];

      batchList.forEach((t, i) => {
        lines.push(`${i + 1}. *${t.productName}*`);
        if (t.targetNumber) lines.push(`   No.Tujuan: ${t.targetNumber}`);
        if (t.adminFee > 0) {
          lines.push(`   Nominal: ${formatRupiah(t.sellingPrice)} | Admin: ${formatRupiah(t.adminFee)}`);
        }
        lines.push(`   Subtotal: ${formatRupiah(t.totalAmount)}`);
      });

      lines.push(`--------------------------------`);
      if (totalAdminFee > 0) {
        lines.push(`Total Biaya Adm : ${formatRupiah(totalAdminFee)}`);
      }
      lines.push(`*TOTAL BAYAR   : ${formatRupiah(totalAmount)}*`);
      lines.push(`Bayar (${paymentMethod.toUpperCase()}): ${formatRupiah(cashGiven)}`);
      if (paymentMethod === 'tunai') {
        lines.push(`Kembalian      : ${formatRupiah(cashChange)}`);
      }
      lines.push(`Status         : LUNAS / BERHASIL ✅`);
      lines.push(`*================================*`);
      lines.push(`${settings.receiptFooterMessage || 'Terima kasih atas kunjungan Anda!'}`);
      lines.push(`*================================*`);
      messageText = lines.filter(Boolean).join('\n');
    } else {
      const lines = [
        `*================================*`,
        `*${(settings.storeName || 'VIRGIO CELLULER').toUpperCase()}*`,
        `${settings.tagline || 'Layanan Transaksi & Pulsa'}`,
        `${settings.address || ''}`,
        `WA/Telp: ${settings.phone || ''}`,
        `*================================*`,
        `No. Struk : ${activeTrx!.receiptNumber}`,
        `Waktu     : ${formatDateTimeIndo(activeTrx!.timestamp)}`,
        `Pelanggan : ${activeTrx!.customerName || 'Umum'}`,
        `Kategori  : ${categoryMeta?.label || activeTrx!.category}`,
        `--------------------------------`,
        `*Layanan  : ${activeTrx!.productName}*`,
        activeTrx!.targetNumber ? `*No.Tujuan: ${activeTrx!.targetNumber}*` : '',
        `--------------------------------`,
        activeTrx!.adminFee > 0
          ? `Nominal   : ${formatRupiah(activeTrx!.sellingPrice)}`
          : '',
        activeTrx!.adminFee > 0
          ? `Biaya Adm : ${formatRupiah(activeTrx!.adminFee)}`
          : '',
        `*TOTAL    : ${formatRupiah(activeTrx!.totalAmount)}*`,
        `Bayar (${activeTrx!.paymentMethod.toUpperCase()}): ${formatRupiah(
          activeTrx!.cashGiven || activeTrx!.totalAmount
        )}`,
        activeTrx!.cashChange
          ? `Kembalian : ${formatRupiah(activeTrx!.cashChange)}`
          : '',
        `Status    : LUNAS / BERHASIL ✅`,
        activeTrx!.notes ? `Catatan   : ${activeTrx!.notes}` : '',
        `*================================*`,
        `${settings.receiptFooterMessage || 'Terima kasih atas kunjungan Anda!'}`,
        `*================================*`,
      ];
      messageText = lines.filter(Boolean).join('\n');
    }

    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <ThermalPrintReceipt
        transaction={activeTrx}
        transactionsBatch={transactionsBatch}
        settings={settings}
        printWidth={printWidth}
      />

      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-4">
          {/* Modal Header */}
          <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                {isBatch ? `Struk Belanja Batch (${batchList.length} Item)` : 'Struk Transaksi Pembelian'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Paper Width Selector & Tips */}
          <div className="no-print px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Ukuran Kertas Printer:
            </span>
            <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5">
              <button
                type="button"
                onClick={() => setPrintWidth('58mm')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  printWidth === '58mm'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                58mm (Standar Mini)
              </button>
              <button
                type="button"
                onClick={() => setPrintWidth('80mm')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  printWidth === '80mm'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                80mm (Lebar)
              </button>
            </div>
          </div>

          {/* Status Alert for Bluetooth / RawBT */}
          {btStatus && (
            <div className="no-print mx-4 mt-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
              <Bluetooth className="w-4 h-4 animate-pulse shrink-0" />
              <span>{btStatus}</span>
            </div>
          )}

          {rawbtNotice && (
            <div className="no-print mx-4 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Membuka aplikasi RawBT untuk mencetak otomatis...</span>
            </div>
          )}

          {/* Visual Receipt Paper Preview */}
          <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-950 flex justify-center overflow-y-auto max-h-[50vh]">
            <div
              className={`w-full bg-white text-slate-900 p-5 rounded-lg shadow-md border border-slate-200 font-mono text-xs leading-relaxed transition-all ${
                printWidth === '80mm' ? 'max-w-[360px]' : 'max-w-[300px]'
              }`}
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            >
              {/* Header Store Info */}
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  {settings.storeName || 'VIRGIO CELLULER'}
                </h2>
                {settings.tagline && (
                  <p className="text-[10px] text-slate-600 mt-0.5">{settings.tagline}</p>
                )}
                {settings.address && (
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                    {settings.address}
                  </p>
                )}
                {settings.phone && (
                  <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                    Telp/WA: {settings.phone}
                  </p>
                )}
              </div>

              {/* Receipt Meta */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isBatch ? 'No. Batch' : 'No. Struk'}</span>
                  <span className="font-bold">
                    {isBatch ? `BATCH-${batchList.length}X (${firstTrx?.receiptNumber})` : activeTrx?.receiptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu</span>
                  <span>{formatDateTimeIndo(firstTrx?.timestamp || new Date().toISOString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kasir</span>
                  <span>Virgio Staff</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan</span>
                  <span>{customerName}</span>
                </div>
                {!isBatch && categoryMeta && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori</span>
                    <span>{categoryMeta?.shortLabel || activeTrx?.category}</span>
                  </div>
                )}
              </div>

              {/* Product Item & Target */}
              <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1.5 text-[11px]">
                {isBatch ? (
                  <div>
                    <div className="text-[10px] font-bold text-center text-slate-500 uppercase tracking-wide mb-2 pb-1 border-b border-slate-200">
                      Daftar Item ({batchList.length})
                    </div>
                    {batchList.map((item, idx) => (
                      <div key={item.id || idx} className="py-1.5 border-b border-slate-100 last:border-0 space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{idx + 1}. {item.productName}</span>
                          <span>{formatRupiah(item.totalAmount)}</span>
                        </div>
                        {item.targetNumber && (
                          <div className="text-[10px] text-slate-600 pl-3">
                            Tujuan: {item.targetNumber}
                          </div>
                        )}
                        {item.adminFee > 0 && (
                          <div className="text-[10px] text-slate-500 pl-3 flex justify-between">
                            <span>Harga: {formatRupiah(item.sellingPrice)}</span>
                            <span>Admin: {formatRupiah(item.adminFee)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="font-bold text-slate-900 text-xs">
                      {activeTrx?.productName}
                    </div>

                    {activeTrx?.targetNumber && (
                      <div className="flex justify-between bg-slate-50 p-1 rounded font-bold text-slate-800">
                        <span className="text-slate-500">Tujuan:</span>
                        <span>{activeTrx.targetNumber}</span>
                      </div>
                    )}

                    {activeTrx && activeTrx.adminFee > 0 ? (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Harga / Nominal:</span>
                          <span>{formatRupiah(activeTrx.sellingPrice)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Biaya Admin:</span>
                          <span>{formatRupiah(activeTrx.adminFee)}</span>
                        </div>
                      </>
                    ) : null}
                  </>
                )}
              </div>

              {/* Total Payment Breakdown */}
              <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1 text-[11px]">
                {isBatch && totalAdminFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Total Biaya Admin:</span>
                    <span>{formatRupiah(totalAdminFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-extrabold text-slate-900 pt-1">
                  <span>TOTAL BAYAR</span>
                  <span className="text-sm">{formatRupiah(totalAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Metode:</span>
                  <span className="font-semibold uppercase">{paymentMethod}</span>
                </div>

                {paymentMethod === 'tunai' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Tunai:</span>
                      <span>
                        {formatRupiah(cashGiven || totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Kembali:</span>
                      <span className="font-semibold">
                        {formatRupiah(cashChange || 0)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between font-bold text-emerald-600 pt-1">
                  <span>Status:</span>
                  <span>LUNAS / BERHASIL</span>
                </div>

                {firstTrx?.notes && (
                  <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                    Catatan: {firstTrx.notes}
                  </div>
                )}
              </div>

              {/* Footer Message */}
              <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
                <p className="whitespace-pre-line font-sans font-medium">
                  {settings.receiptFooterMessage ||
                    'Terima kasih telah berbelanja di Virgio Celluler!'}
                </p>
                <p className="text-[9px] text-slate-400">
                  Simpan struk ini sebagai bukti transaksi sah
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="no-print p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            {/* Primary Print Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSystemPrint}
                className="py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Thermal ({printWidth})</span>
              </button>

              <button
                type="button"
                onClick={handleRawBTPrint}
                className="py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer active:scale-95"
                title="Cetak cepat via aplikasi driver RawBT Android"
              >
                <Smartphone className="w-4 h-4" />
                <span>Cetak via RawBT (HP)</span>
              </button>
            </div>

            {/* Secondary Buttons: Bluetooth & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isBtPrinting}
                onClick={handleBluetoothPrint}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
                <span>{isBtPrinting ? 'Mencetak...' : 'Cetak via Bluetooth'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin ke WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Salin Teks WhatsApp</span>
                  </>
                )}
              </button>
            </div>

            {/* Helpful Note for Counter Staff */}
            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>
                <strong>Bebas Kertas Terbuang:</strong> Cetakan kini dipotong pas sesuai panjang struk (tidak keluar 4x atau terpotong lagi).
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
