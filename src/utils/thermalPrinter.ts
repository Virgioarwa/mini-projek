import { Transaction, StoreSettings } from '../types';
import { CATEGORY_INFO, formatDateTimeIndo, formatRupiah } from './formatters';

/**
 * Format a plain-text thermal receipt suitable for RawBT, WhatsApp, or ESC/POS text print.
 * @param transaction Transaction object
 * @param settings StoreSettings
 * @param lineLength Number of columns (32 for 58mm, 42-48 for 80mm)
 */
export function generatePlainTextReceipt(
  transaction: Transaction,
  settings: StoreSettings,
  lineLength: number = 32
): string {
  const divider = '='.repeat(lineLength);
  const subDivider = '-'.repeat(lineLength);

  // Center a string within lineLength
  const center = (str: string): string => {
    if (str.length >= lineLength) return str.slice(0, lineLength);
    const padTotal = lineLength - str.length;
    const padLeft = Math.floor(padTotal / 2);
    const padRight = padTotal - padLeft;
    return ' '.repeat(padLeft) + str + ' '.repeat(padRight);
  };

  // Two columns (left label, right value)
  const twoCol = (left: string, right: string): string => {
    const spaceNeeded = lineLength - left.length - right.length;
    if (spaceNeeded > 0) {
      return left + ' '.repeat(spaceNeeded) + right;
    }
    // If too long, put on two lines
    return `${left}\n  ${right}`;
  };

  const categoryMeta = CATEGORY_INFO[transaction.category];
  const lines: string[] = [];

  // Header
  lines.push(divider);
  lines.push(center((settings.storeName || 'VIRGIO CELLULER').toUpperCase()));
  if (settings.tagline) {
    lines.push(center(settings.tagline));
  }
  if (settings.address) {
    // Wrap address if needed
    lines.push(center(settings.address));
  }
  if (settings.phone) {
    lines.push(center(`Telp/WA: ${settings.phone}`));
  }
  lines.push(divider);

  // Transaction Meta
  lines.push(twoCol('No. Struk', transaction.receiptNumber));
  lines.push(twoCol('Waktu', formatDateTimeIndo(transaction.timestamp)));
  lines.push(twoCol('Kasir', 'Virgio Staff'));
  lines.push(twoCol('Pelanggan', transaction.customerName || 'Umum'));
  lines.push(twoCol('Kategori', categoryMeta?.shortLabel || transaction.category));
  lines.push(subDivider);

  // Item details
  lines.push(transaction.productName);
  if (transaction.targetNumber) {
    lines.push(`No. Tujuan: ${transaction.targetNumber}`);
  }
  lines.push(subDivider);

  if (transaction.adminFee > 0) {
    lines.push(twoCol('Harga/Nominal', formatRupiah(transaction.sellingPrice)));
    lines.push(twoCol('Biaya Admin', formatRupiah(transaction.adminFee)));
    lines.push(subDivider);
  }

  // Payment Breakdown
  lines.push(twoCol('TOTAL BAYAR', formatRupiah(transaction.totalAmount)));
  lines.push(twoCol('Metode', transaction.paymentMethod.toUpperCase()));

  if (transaction.paymentMethod === 'tunai') {
    lines.push(twoCol('Tunai', formatRupiah(transaction.cashGiven || transaction.totalAmount)));
    lines.push(twoCol('Kembali', formatRupiah(transaction.cashChange || 0)));
  }

  lines.push(twoCol('Status', 'LUNAS / BERHASIL'));

  if (transaction.notes) {
    lines.push(`Catatan: ${transaction.notes}`);
  }

  lines.push(divider);
  lines.push(center(settings.receiptFooterMessage || 'Terima kasih atas kunjungan Anda!'));
  lines.push(center('Simpan struk ini sbg bukti sah'));
  lines.push(divider);
  lines.push('\n\n'); // Feed lines for paper tear

  return lines.join('\n');
}

export function generatePlainTextBatchReceipt(
  transactions: Transaction[],
  settings: StoreSettings,
  lineLength: number = 32
): string {
  if (!transactions || transactions.length === 0) return '';
  if (transactions.length === 1) return generatePlainTextReceipt(transactions[0], settings, lineLength);

  const divider = '='.repeat(lineLength);
  const subDivider = '-'.repeat(lineLength);

  const center = (str: string): string => {
    if (str.length >= lineLength) return str.slice(0, lineLength);
    const padTotal = lineLength - str.length;
    const padLeft = Math.floor(padTotal / 2);
    const padRight = padTotal - padLeft;
    return ' '.repeat(padLeft) + str + ' '.repeat(padRight);
  };

  const twoCol = (left: string, right: string): string => {
    const spaceNeeded = lineLength - left.length - right.length;
    if (spaceNeeded > 0) {
      return left + ' '.repeat(spaceNeeded) + right;
    }
    return `${left}\n  ${right}`;
  };

  const firstTrx = transactions[0];
  const lastTrx = transactions[transactions.length - 1];
  const customerName = firstTrx.customerName || 'Umum';
  const paymentMethod = firstTrx.paymentMethod || 'tunai';
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalAdminFee = transactions.reduce((sum, t) => sum + (t.adminFee || 0), 0);
  const cashGiven = firstTrx.cashGiven && firstTrx.cashGiven >= totalAmount
    ? firstTrx.cashGiven
    : transactions.reduce((sum, t) => sum + (t.cashGiven || t.totalAmount), 0);
  const cashChange = cashGiven >= totalAmount ? cashGiven - totalAmount : 0;

  const lines: string[] = [];

  // Header
  lines.push(divider);
  lines.push(center((settings.storeName || 'VIRGIO CELLULER').toUpperCase()));
  if (settings.tagline) lines.push(center(settings.tagline));
  if (settings.address) lines.push(center(settings.address));
  if (settings.phone) lines.push(center(`Telp/WA: ${settings.phone}`));
  lines.push(divider);

  // Batch Meta
  lines.push(twoCol('No. Batch', `BATCH-${transactions.length}X`));
  lines.push(twoCol('Struk Ref', `${firstTrx.receiptNumber}..`));
  lines.push(twoCol('Waktu', formatDateTimeIndo(firstTrx.timestamp)));
  lines.push(twoCol('Kasir', 'Virgio Staff'));
  lines.push(twoCol('Pelanggan', customerName));
  lines.push(subDivider);
  lines.push(center(`RINCIAN BELANJA (${transactions.length} ITEM)`));
  lines.push(subDivider);

  // Line items
  transactions.forEach((t, idx) => {
    lines.push(`${idx + 1}. ${t.productName}`);
    if (t.targetNumber) {
      lines.push(`   Tujuan: ${t.targetNumber}`);
    }
    if (t.adminFee > 0) {
      lines.push(twoCol(`   ${formatRupiah(t.sellingPrice)} + Adm ${formatRupiah(t.adminFee)}`, formatRupiah(t.totalAmount)));
    } else {
      lines.push(twoCol('   Subtotal', formatRupiah(t.totalAmount)));
    }
  });

  lines.push(subDivider);
  if (totalAdminFee > 0) {
    lines.push(twoCol('Total Biaya Admin', formatRupiah(totalAdminFee)));
  }
  lines.push(twoCol('TOTAL BAYAR', formatRupiah(totalAmount)));
  lines.push(twoCol('Metode', paymentMethod.toUpperCase()));

  if (paymentMethod === 'tunai') {
    lines.push(twoCol('Tunai', formatRupiah(cashGiven)));
    lines.push(twoCol('Kembali', formatRupiah(cashChange)));
  }

  lines.push(twoCol('Status', 'LUNAS / BERHASIL'));
  lines.push(divider);
  lines.push(center(settings.receiptFooterMessage || 'Terima kasih atas kunjungan Anda!'));
  lines.push(center('Simpan struk ini sbg bukti sah'));
  lines.push(divider);
  lines.push('\n\n');

  return lines.join('\n');
}

/**
 * Direct print using RawBT application on Android.
 * RawBT is the standard thermal printer driver app used across Indonesia.
 */
export function printWithRawBT(
  transactionOrBatch: Transaction | Transaction[],
  settings: StoreSettings
): boolean {
  const lineLength = settings.printWidth === '80mm' ? 42 : 32;
  const receiptText = Array.isArray(transactionOrBatch)
    ? generatePlainTextBatchReceipt(transactionOrBatch, settings, lineLength)
    : generatePlainTextReceipt(transactionOrBatch, settings, lineLength);

  try {
    const base64Data = btoa(unescape(encodeURIComponent(receiptText)));
    const rawbtUri = `rawbt:data:text/plain;base64,${base64Data}`;
    window.location.href = rawbtUri;
    return true;
  } catch (err) {
    console.error('Gagal membuka RawBT:', err);
    return false;
  }
}

/**
 * Print directly to a Bluetooth Thermal Printer using Web Bluetooth ESC/POS API.
 */
export async function printWithWebBluetooth(
  transactionOrBatch: Transaction | Transaction[],
  settings: StoreSettings,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
  if (!('bluetooth' in navigator)) {
    return {
      success: false,
      message: 'Browser Anda tidak mendukung Web Bluetooth. Gunakan Chrome Android atau Cetak Standar / RawBT.',
    };
  }

  try {
    onStatusUpdate?.('Mencari printer Bluetooth...');
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
        { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] },
        { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      ],
      acceptAllDevices: false,
    });

    onStatusUpdate?.(`Menghubungkan ke ${device.name || 'Printer'}...`);
    const server = await device.gatt.connect();

    // Find the printer characteristic
    let printerChar: any = null;
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          printerChar = char;
          break;
        }
      }
      if (printerChar) break;
    }

    if (!printerChar) {
      throw new Error('Tidak dapat menemukan karakteristik cetak pada printer.');
    }

    onStatusUpdate?.('Mengirim data struk ke printer...');
    const lineLength = settings.printWidth === '80mm' ? 42 : 32;
    const receiptText = Array.isArray(transactionOrBatch)
      ? generatePlainTextBatchReceipt(transactionOrBatch, settings, lineLength)
      : generatePlainTextReceipt(transactionOrBatch, settings, lineLength);

    // ESC/POS initialization & formatting
    const encoder = new TextEncoder();
    // ESC @ (init), ESC t 0 (standard code table)
    const initCmd = new Uint8Array([0x1b, 0x40]);
    // Cut / feed paper: LF LF LF LF
    const feedCmd = new Uint8Array([0x0a, 0x0a, 0x0a, 0x0a]);

    const textData = encoder.encode(receiptText);

    // Merge payloads
    const combined = new Uint8Array(initCmd.length + textData.length + feedCmd.length);
    combined.set(initCmd, 0);
    combined.set(textData, initCmd.length);
    combined.set(feedCmd, initCmd.length + textData.length);

    // Write in chunks to prevent BLE buffer overflow (512 bytes chunk)
    const chunkSize = 256;
    for (let i = 0; i < combined.length; i += chunkSize) {
      const chunk = combined.slice(i, i + chunkSize);
      if (printerChar.properties.writeWithoutResponse) {
        await printerChar.writeValueWithoutResponse(chunk);
      } else {
        await printerChar.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 40));
    }

    onStatusUpdate?.('Struk berhasil dicetak!');
    return { success: true, message: `Struk berhasil dicetak ke ${device.name || 'printer'}!` };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'Pencarian printer dibatalkan.' };
    }
    console.error('Bluetooth print error:', err);
    return {
      success: false,
      message: err.message || 'Gagal mencetak via Bluetooth. Coba Cetak Sistem atau RawBT.',
    };
  }
}
