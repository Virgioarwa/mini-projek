import React from 'react';
import { createPortal } from 'react-dom';
import { Transaction, StoreSettings } from '../types';
import { CATEGORY_INFO, formatDateTimeIndo, formatRupiah } from '../utils/formatters';

interface ThermalPrintReceiptProps {
  transaction: Transaction | null;
  transactionsBatch?: Transaction[] | null;
  settings: StoreSettings;
  printWidth?: '58mm' | '80mm';
}

export const ThermalPrintReceipt: React.FC<ThermalPrintReceiptProps> = ({
  transaction,
  transactionsBatch,
  settings,
  printWidth = settings.printWidth || '58mm',
}) => {
  const isBatch = Boolean(transactionsBatch && transactionsBatch.length > 1);
  const targetTrx = transaction || (transactionsBatch && transactionsBatch[0]) || null;

  if (!targetTrx && !isBatch) return null;

  const targetContainer = document.getElementById('thermal-print-container');
  if (!targetContainer) return null;

  // Set the class on the container for 80mm roll width if needed
  if (printWidth === '80mm') {
    targetContainer.className = 'print-width-80mm';
  } else {
    targetContainer.className = '';
  }

  const batchList = transactionsBatch || (transaction ? [transaction] : []);
  const totalAmount = batchList.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalAdminFee = batchList.reduce((sum, t) => sum + (t.adminFee || 0), 0);
  const firstTrx = batchList[0];
  const cashGiven = firstTrx?.cashGiven && firstTrx.cashGiven >= totalAmount
    ? firstTrx.cashGiven
    : batchList.reduce((sum, t) => sum + (t.cashGiven || t.totalAmount), 0);
  const cashChange = cashGiven >= totalAmount ? cashGiven - totalAmount : 0;
  const paymentMethod = firstTrx?.paymentMethod || 'tunai';
  const customerName = firstTrx?.customerName || 'Umum';

  const receiptContent = (
    <div
      style={{
        width: '100%',
        color: '#000000',
        backgroundColor: '#ffffff',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: printWidth === '80mm' ? '12px' : '10.5px',
        lineHeight: '1.3',
        padding: '2mm 1mm 10mm 1mm',
        boxSizing: 'border-box',
      }}
    >
      {/* HEADER TOKO */}
      <div style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '1px dashed #000' }}>
        <div style={{ fontSize: printWidth === '80mm' ? '16px' : '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          {settings.storeName || 'VIRGIO CELLULER'}
        </div>
        {settings.tagline && (
          <div style={{ fontSize: '9px', marginTop: '1px' }}>{settings.tagline}</div>
        )}
        {settings.address && (
          <div style={{ fontSize: '8.5px', marginTop: '1px', lineHeight: '1.15' }}>
            {settings.address}
          </div>
        )}
        {settings.phone && (
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>
            Telp/WA: {settings.phone}
          </div>
        )}
      </div>

      {/* METADATA TRANSAKSI */}
      <div style={{ padding: '6px 0', borderBottom: '1px dashed #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{isBatch ? 'No. Batch:' : 'No. Struk:'}</span>
          <span style={{ fontWeight: 'bold' }}>
            {isBatch ? `BATCH-${batchList.length}X (${firstTrx?.receiptNumber})` : firstTrx?.receiptNumber}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
          <span>Waktu:</span>
          <span>{formatDateTimeIndo(firstTrx?.timestamp || new Date().toISOString())}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kasir:</span>
          <span>Virgio Staff</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pelanggan:</span>
          <span>{customerName}</span>
        </div>
        {!isBatch && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Kategori:</span>
            <span>{CATEGORY_INFO[firstTrx.category]?.shortLabel || firstTrx.category}</span>
          </div>
        )}
      </div>

      {/* ITEM PRODUK (SINGLE ATAU BATCH MULTI ITEM) */}
      <div style={{ padding: '6px 0', borderBottom: '1px dashed #000' }}>
        {isBatch ? (
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', textAlign: 'center' }}>
              --- DAFTAR ITEM TRANSAKSI ({batchList.length}) ---
            </div>
            {batchList.map((item, idx) => (
              <div key={item.id || idx} style={{ marginBottom: '5px', paddingBottom: '4px', borderBottom: idx < batchList.length - 1 ? '1px dotted #ccc' : 'none' }}>
                <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{idx + 1}. {item.productName}</span>
                  <span>{formatRupiah(item.totalAmount)}</span>
                </div>
                {item.targetNumber && (
                  <div style={{ fontSize: '9px' }}>Tujuan: {item.targetNumber}</div>
                )}
                {item.adminFee > 0 && (
                  <div style={{ fontSize: '8.5px', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nominal: {formatRupiah(item.sellingPrice)}</span>
                    <span>Admin: {formatRupiah(item.adminFee)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 'bold', fontSize: printWidth === '80mm' ? '12px' : '11px', marginBottom: '2px' }}>
              {firstTrx?.productName}
            </div>
            {firstTrx?.targetNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Tujuan:</span>
                <span>{firstTrx.targetNumber}</span>
              </div>
            )}
            {firstTrx && firstTrx.adminFee > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginTop: '2px' }}>
                  <span>Harga / Nominal:</span>
                  <span>{formatRupiah(firstTrx.sellingPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px' }}>
                  <span>Biaya Admin:</span>
                  <span>{formatRupiah(firstTrx.adminFee)}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* RINCIAN PEMBAYARAN */}
      <div style={{ padding: '6px 0', borderBottom: '1px dashed #000' }}>
        {isBatch && totalAdminFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginBottom: '2px' }}>
            <span>Total Biaya Admin:</span>
            <span>{formatRupiah(totalAdminFee)}</span>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: printWidth === '80mm' ? '14px' : '12px',
            marginBottom: '4px',
          }}
        >
          <span>TOTAL BAYAR</span>
          <span>{formatRupiah(totalAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Metode:</span>
          <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            {paymentMethod}
          </span>
        </div>
        {paymentMethod === 'tunai' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tunai:</span>
              <span>{formatRupiah(cashGiven || totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Kembali:</span>
              <span>{formatRupiah(cashChange || 0)}</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '3px' }}>
          <span>Status:</span>
          <span>LUNAS / BERHASIL</span>
        </div>
        {firstTrx?.notes && (
          <div style={{ fontSize: '8.5px', marginTop: '3px', fontStyle: 'italic' }}>
            Catatan: {firstTrx.notes}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', paddingTop: '8px', fontSize: '9px', lineHeight: '1.2' }}>
        <div style={{ fontWeight: 'bold' }}>
          {settings.receiptFooterMessage || 'Terima kasih telah berbelanja di Virgio Celluler!'}
        </div>
        <div style={{ fontSize: '8px', marginTop: '3px' }}>
          Simpan struk ini sebagai bukti transaksi sah
        </div>
      </div>
    </div>
  );

  return createPortal(receiptContent, targetContainer);
};
