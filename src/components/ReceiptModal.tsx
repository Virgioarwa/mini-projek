import React, { useRef } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Share2,
  Receipt as ReceiptIcon,
  Sparkles,
} from 'lucide-react';
import { Transaction, StoreSettings } from '../types';
import {
  CATEGORY_INFO,
  formatDateTimeIndo,
  formatRupiah,
} from '../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings: StoreSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
}) => {
  const [copied, setCopied] = React.useState(false);
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const categoryMeta = CATEGORY_INFO[transaction.category];

  // Function to print receipt
  const handlePrint = () => {
    window.print();
  };

  // Generate clean WhatsApp text receipt
  const handleCopyWhatsApp = () => {
    const lines = [
      `*================================*`,
      `*${settings.storeName.toUpperCase()}*`,
      `${settings.tagline || 'Layanan Transaksi & Pulsa'}`,
      `${settings.address || ''}`,
      `WA/Telp: ${settings.phone || ''}`,
      `*================================*`,
      `No. Struk : ${transaction.receiptNumber}`,
      `Waktu     : ${formatDateTimeIndo(transaction.timestamp)}`,
      `Pelanggan : ${transaction.customerName || 'Umum'}`,
      `Kategori  : ${categoryMeta?.label || transaction.category}`,
      `--------------------------------`,
      `*Layanan  : ${transaction.productName}*`,
      transaction.targetNumber ? `*No.Tujuan: ${transaction.targetNumber}*` : '',
      `--------------------------------`,
      transaction.adminFee > 0
        ? `Nominal   : ${formatRupiah(transaction.sellingPrice)}`
        : '',
      transaction.adminFee > 0
        ? `Biaya Adm : ${formatRupiah(transaction.adminFee)}`
        : '',
      `*TOTAL    : ${formatRupiah(transaction.totalAmount)}*`,
      `Bayar (${transaction.paymentMethod.toUpperCase()}): ${formatRupiah(
        transaction.cashGiven || transaction.totalAmount
      )}`,
      transaction.cashChange
        ? `Kembalian : ${formatRupiah(transaction.cashChange)}`
        : '',
      `Status    : LUNAS / BERHASIL ✅`,
      transaction.notes ? `Catatan   : ${transaction.notes}` : '',
      `*================================*`,
      `${settings.receiptFooterMessage || 'Terima kasih atas kunjungan Anda!'}`,
      `*================================*`,
    ]
      .filter((line) => line !== '')
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-4">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Struk Transaksi Pembelian</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Container */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center overflow-y-auto max-h-[70vh]">
          {/* Printable Receipt Paper */}
          <div
            id="printable-receipt"
            ref={receiptPrintRef}
            className="w-full max-w-[320px] bg-white text-slate-900 p-5 rounded-lg shadow-md border border-slate-200 font-mono text-xs leading-relaxed transition-all"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Header Store Info */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
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
                <span className="text-slate-500">No. Struk</span>
                <span className="font-bold">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu</span>
                <span>{formatDateTimeIndo(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir / Toko</span>
                <span>Virgio Staff</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan</span>
                <span>{transaction.customerName || 'Umum'}</span>
              </div>
            </div>

            {/* Product Item & Target */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="font-bold text-slate-900 text-xs">
                {transaction.productName}
              </div>

              {transaction.targetNumber && (
                <div className="flex justify-between bg-slate-50 p-1 rounded font-bold text-slate-800">
                  <span className="text-slate-500">Tujuan:</span>
                  <span>{transaction.targetNumber}</span>
                </div>
              )}

              {transaction.adminFee > 0 ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Harga / Nominal:</span>
                    <span>{formatRupiah(transaction.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Admin:</span>
                    <span>{formatRupiah(transaction.adminFee)}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Total Payment Breakdown */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-xs font-extrabold text-slate-900 pt-1">
                <span>TOTAL BAYAR</span>
                <span className="text-sm">{formatRupiah(transaction.totalAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Metode:</span>
                <span className="font-semibold uppercase">{transaction.paymentMethod}</span>
              </div>

              {transaction.paymentMethod === 'tunai' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Tunai:</span>
                    <span>
                      {formatRupiah(transaction.cashGiven || transaction.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kembali:</span>
                    <span className="font-semibold">{formatRupiah(transaction.cashChange || 0)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between font-bold text-emerald-600 pt-1">
                <span>Status:</span>
                <span>LUNAS / BERHASIL</span>
              </div>

              {transaction.notes && (
                <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                  Catatan: {transaction.notes}
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

        {/* Modal Actions (No-print) */}
        <div className="no-print p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersalin ke WA!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Salin Teks WhatsApp</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Thermal Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
