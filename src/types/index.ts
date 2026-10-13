export type TransactionCategory =
  | 'voucher'
  | 'transfer'
  | 'tagihan'
  | 'token_listrik'
  | 'kuota_tembak'
  | 'ewallet'
  | 'aksesoris'
  | 'tarik_tunai'
  | 'pulsa'
  | 'lainnya';

export type CashFlowType = 'pemasukan' | 'pengeluaran'; // Pemasukan = cash in (penjualan/topup dibayar tunai); Pengeluaran = cash out (tarik tunai, operasional)

export type PaymentMethod = 'tunai' | 'qris' | 'transfer_bank';

export interface Product {
  id: string;
  name: string;
  category: TransactionCategory;
  provider?: string; // Telkomsel, XL, Tri, PLN, DANA, dll.
  costPrice: number; // Harga modal/kulak
  sellingPrice: number; // Harga jual dasar
  adminFee: number; // Biaya admin/jasa standar
  stock?: number; // Opsional untuk voucher fisik/aksesoris
  isActive: boolean; // Jika sudah tidak diproduksi/tidak keluar lagi
  code?: string; // Barcode / SKU / Kode Produk
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  receiptNumber: string; // Misal: VC-20261013-0001
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  category: TransactionCategory;
  productName: string;
  productId?: string;
  customerName?: string;
  targetNumber?: string; // No HP, No Rekening, ID Pelanggan / No Meter PLN
  costPrice: number; // Harga modal
  sellingPrice: number; // Harga jual
  adminFee: number; // Biaya admin
  totalAmount: number; // Total yang harus dibayar / ditarik
  cashFlow: CashFlowType; // 'pemasukan' atau 'pengeluaran'
  cashAmountOut?: number; // Khusus tarik tunai: uang cash fisik yang diserahkan ke pelanggan
  cashGiven?: number; // Uang yang diserahkan pelanggan
  cashChange?: number; // Kembalian
  profit: number; // Keuntungan bersih konter = (sellingPrice - costPrice) + adminFee (atau fee tarik tunai)
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface DailyArchive {
  date: string; // YYYY-MM-DD
  closedAt: string; // ISO string saat tutup buku (jam 23:00 atau manual)
  initialCash: number; // Saldo awal kasir
  totalIncome: number; // Total uang masuk (pemasukan)
  totalExpense: number; // Total uang keluar (tarik tunai / pengeluaran kas)
  netCash: number; // Saldo akhir kasir = initialCash + totalIncome - totalExpense
  totalProfit: number; // Total keuntungan bersih
  transactionCount: number;
  transactions: Transaction[];
  note?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  initialCashDefault: number;
  autoCloseHour: number; // 23 (jam 11 malam)
  receiptFooterMessage: string;
  soundEnabled: boolean;
  printWidth: '58mm' | '80mm';
}
