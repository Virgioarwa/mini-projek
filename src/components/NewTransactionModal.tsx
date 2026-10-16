import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Printer,
  Check,
  Search,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  Info,
  ShoppingCart,
  Trash2,
  Layers,
  ChevronRight,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Package,
  Zap,
} from 'lucide-react';
import {
  Product,
  Transaction,
  TransactionCategory,
  CashFlowType,
  PaymentMethod,
} from '../types';
import {
  CATEGORY_INFO,
  formatRupiah,
  generateReceiptNumber,
} from '../utils/formatters';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveTransaction: (trx: Transaction, shouldPrint: boolean) => void;
  onSaveBatchTransactions?: (trxs: Transaction[], shouldPrint: boolean) => void;
  todaySequence: number;
  initialSellingPrice?: number;
}

const QUICK_ADMIN_PRESETS = [
  { value: 0, label: '0' },
  { value: 2000, label: '2rb' },
  { value: 2500, label: '2.5rb' },
  { value: 3000, label: '3rb' },
  { value: 4000, label: '4rb' },
  { value: 5000, label: '5rb' },
  { value: 7000, label: '7rb' },
  { value: 10000, label: '10rb' },
  { value: 15000, label: '15rb' },
  { value: 20000, label: '20rb' },
];

const QUICK_ADMIN_INCREMENTS = [
  { value: 2000, label: '+2rb' },
  { value: 3000, label: '+3rb' },
  { value: 5000, label: '+5rb' },
  { value: 10000, label: '+10rb' },
];

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveTransaction,
  onSaveBatchTransactions,
  todaySequence,
  initialSellingPrice,
}) => {
  // Mode switcher: 'single' for instant single item transaction, 'cart' for multi-item cart batch
  const [transactionMode, setTransactionMode] = useState<'single' | 'cart'>('single');
  const [activeCategory, setActiveCategory] = useState<TransactionCategory>('voucher');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Cart (Keranjang) state
  const [cartItems, setCartItems] = useState<Transaction[]>([]);
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<PaymentMethod>('tunai');
  const [batchCashGiven, setBatchCashGiven] = useState<number>(0);
  const [cartToast, setCartToast] = useState<string | null>(null);

  // Form states for single transaction
  const [productName, setProductName] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [adminFee, setAdminFee] = useState<number>(0);
  const [cashFlow, setCashFlow] = useState<CashFlowType>('pemasukan');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Reset or preset when category changes
  useEffect(() => {
    setSelectedProductId('');
    setSearchQuery('');

    if (activeCategory === 'tarik_tunai') {
      setCashFlow('pengeluaran');
      setProductName('Tarik Tunai Tunai / E-Wallet');
      setCostPrice(0);
      setSellingPrice(100000);
      setAdminFee(5000);
      setCashGiven(0);
    } else if (activeCategory === 'transfer') {
      setCashFlow('pemasukan');
      setProductName('Transfer Antar Bank');
      setCostPrice(0);
      setSellingPrice(100000);
      setAdminFee(5000);
      setCashGiven(105000);
    } else if (activeCategory === 'token_listrik') {
      setCashFlow('pemasukan');
      setProductName('Token Listrik PLN 20.000');
      setCostPrice(20500);
      setSellingPrice(20000);
      setAdminFee(2500);
      setCashGiven(25000);
    } else if (activeCategory === 'tagihan') {
      setCashFlow('pemasukan');
      setProductName('Bayar Tagihan Listrik / BPJS / PDAM');
      setCostPrice(0);
      setSellingPrice(50000);
      setAdminFee(3000);
      setCashGiven(55000);
    } else if (activeCategory === 'ewallet') {
      setCashFlow('pemasukan');
      setProductName('Top Up DANA Saldo');
      setCostPrice(0);
      setSellingPrice(50000);
      setAdminFee(3000);
      setCashGiven(55000);
    } else {
      setCashFlow('pemasukan');
      setAdminFee(0);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (isOpen && initialSellingPrice !== undefined && initialSellingPrice > 0) {
      setSellingPrice(initialSellingPrice);
      setCashGiven(initialSellingPrice);
    }
  }, [isOpen, initialSellingPrice]);

  // Filter products by active category & query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = p.category === activeCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.provider && p.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch && p.isActive;
    });
  }, [products, activeCategory, searchQuery]);

  // Handle select product from catalog
  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setProductName(product.name);
    setCostPrice(product.costPrice || 0);
    setSellingPrice(product.sellingPrice || 0);
    setAdminFee(product.adminFee || 0);

    const total = (product.sellingPrice || 0) + (product.adminFee || 0);
    setCashGiven(total);
  };

  const handleSetAdminFee = (newFee: number) => {
    const val = Math.max(0, newFee);
    const prevFee = Number(adminFee) || 0;
    const sellPrice = Number(sellingPrice) || 0;
    const prevTotal = sellPrice + prevFee;

    setAdminFee(val);

    if (activeCategory !== 'tarik_tunai') {
      if (cashGiven === prevTotal || cashGiven === 0) {
        setCashGiven(sellPrice + val);
      }
    }
  };

  const handleAddAdminFee = (increment: number) => {
    const current = Number(adminFee) || 0;
    handleSetAdminFee(current + increment);
  };

  // Calculations for current form item
  const calculatedTotal = useMemo(() => {
    if (activeCategory === 'tarik_tunai') {
      return Number(sellingPrice) || 0;
    }
    return (Number(sellingPrice) || 0) + (Number(adminFee) || 0);
  }, [activeCategory, sellingPrice, adminFee]);

  const calculatedProfit = useMemo(() => {
    if (activeCategory === 'tarik_tunai') {
      return Number(adminFee) || 0;
    }
    const margin = (Number(sellingPrice) || 0) - (Number(costPrice) || 0);
    return margin + (Number(adminFee) || 0);
  }, [activeCategory, sellingPrice, costPrice, adminFee]);

  const cashChange = useMemo(() => {
    if (cashGiven < calculatedTotal) return 0;
    return cashGiven - calculatedTotal;
  }, [cashGiven, calculatedTotal]);

  // Cart Calculations
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.totalAmount, 0),
    [cartItems]
  );
  const cartProfit = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.profit, 0),
    [cartItems]
  );
  const cartAdminFee = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.adminFee || 0), 0),
    [cartItems]
  );
  const batchCashChange = useMemo(() => {
    if (batchCashGiven < cartTotal) return 0;
    return batchCashGiven - cartTotal;
  }, [batchCashGiven, cartTotal]);

  // Helper to construct current Transaction object
  const createCurrentItem = (): Transaction | null => {
    if (!productName.trim()) return null;
    if (calculatedTotal <= 0 && activeCategory !== 'tarik_tunai') return null;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const seq = todaySequence + cartItems.length;
    const receiptNum = generateReceiptNumber(seq);

    return {
      id: 'trx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      receiptNumber: receiptNum,
      timestamp: now.toISOString(),
      date: dateStr,
      category: activeCategory,
      productName: productName.trim(),
      productId: selectedProductId || undefined,
      customerName: customerName.trim() || 'Umum',
      targetNumber: targetNumber.trim() || undefined,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      adminFee: Number(adminFee) || 0,
      totalAmount: calculatedTotal,
      cashFlow: cashFlow,
      cashAmountOut: activeCategory === 'tarik_tunai' ? Number(sellingPrice) : undefined,
      cashGiven: Number(cashGiven) || calculatedTotal,
      cashChange: cashChange,
      profit: calculatedProfit,
      paymentMethod: paymentMethod,
      notes: notes.trim() || undefined,
      batchId: 'batch_' + Date.now(),
    };
  };

  // Add current form item to cart
  const handleAddToCart = () => {
    if (!productName.trim()) {
      alert('Mohon pilih produk dari katalog atau ketik nama produk.');
      return;
    }
    if (calculatedTotal <= 0 && activeCategory !== 'tarik_tunai') {
      alert('Total nominal transaksi harus lebih dari 0.');
      return;
    }

    const item = createCurrentItem();
    if (!item) return;

    const newCart = [...cartItems, item];
    setCartItems(newCart);
    const newTotal = newCart.reduce((sum, t) => sum + t.totalAmount, 0);
    setBatchCashGiven(newTotal);

    setCartToast(`"${item.productName}" masuk ke keranjang! Total keranjang: ${newCart.length} item.`);
    setTimeout(() => setCartToast(null), 3000);

    // Switch to cart mode so cashier sees the added item
    setTransactionMode('cart');

    // Reset item fields, retain customerName so cashier doesn't re-type it
    setSelectedProductId('');
    setTargetNumber('');
    setNotes('');
    if (
      activeCategory === 'voucher' ||
      activeCategory === 'pulsa' ||
      activeCategory === 'kuota_tembak' ||
      activeCategory === 'aksesoris'
    ) {
      setProductName('');
      setCostPrice(0);
      setSellingPrice(0);
      setAdminFee(0);
      setCashGiven(0);
    }
  };

  const handleRemoveCartItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    const newTotal = updated.reduce((sum, t) => sum + t.totalAmount, 0);
    setBatchCashGiven(newTotal);
    if (updated.length === 0) {
      setTransactionMode('single');
    }
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (confirm('Kosongkan semua transaksi di keranjang?')) {
      setCartItems([]);
      setBatchCashGiven(0);
      setTransactionMode('single');
    }
  };

  // Save all items in cart (with batch payment)
  const handleSaveAllBatch = (shouldPrint: boolean) => {
    let finalTrxs = [...cartItems];

    // If cashier also has an un-added item typed in the form, automatically include it
    if (productName.trim() && (calculatedTotal > 0 || activeCategory === 'tarik_tunai')) {
      const activeItem = createCurrentItem();
      if (activeItem) {
        finalTrxs.push(activeItem);
      }
    }

    if (finalTrxs.length === 0) {
      alert('Keranjang masih kosong. Mohon tambahkan produk terlebih dahulu.');
      return;
    }

    const total = finalTrxs.reduce((sum, t) => sum + t.totalAmount, 0);
    const batchList = finalTrxs.map((item, idx) => ({
      ...item,
      paymentMethod: batchPaymentMethod,
      cashGiven: idx === 0 ? Math.max(batchCashGiven, total) : item.totalAmount,
      cashChange: idx === 0 ? Math.max(0, batchCashGiven - total) : 0,
    }));

    if (onSaveBatchTransactions) {
      onSaveBatchTransactions(batchList, shouldPrint);
    } else {
      batchList.forEach((t) => onSaveTransaction(t, false));
      if (shouldPrint && batchList[0]) {
        onSaveTransaction(batchList[0], true);
      }
    }

    setCartItems([]);
    onClose();
  };

  // Direct single item submit
  const handleSubmitSingle = (e: React.FormEvent, shouldPrint: boolean) => {
    e.preventDefault();

    if (!productName.trim()) {
      alert('Mohon isi nama produk atau layanan transaksi.');
      return;
    }

    if (calculatedTotal <= 0 && activeCategory !== 'tarik_tunai') {
      alert('Total nominal transaksi harus lebih dari 0.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const receiptNum = generateReceiptNumber(todaySequence);

    const newTrx: Transaction = {
      id: 'trx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      receiptNumber: receiptNum,
      timestamp: now.toISOString(),
      date: dateStr,
      category: activeCategory,
      productName: productName.trim(),
      productId: selectedProductId || undefined,
      customerName: customerName.trim() || 'Umum',
      targetNumber: targetNumber.trim() || undefined,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      adminFee: Number(adminFee) || 0,
      totalAmount: calculatedTotal,
      cashFlow: cashFlow,
      cashAmountOut: activeCategory === 'tarik_tunai' ? Number(sellingPrice) : undefined,
      cashGiven: Number(cashGiven) || calculatedTotal,
      cashChange: cashChange,
      profit: calculatedProfit,
      paymentMethod: paymentMethod,
      notes: notes.trim() || undefined,
    };

    onSaveTransaction(newTrx, shouldPrint);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div
        className={`relative w-full ${
          transactionMode === 'cart' ? 'max-w-6xl' : 'max-w-4xl'
        } bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] transition-all`}
      >
        {/* HEADER BAR & MODE SWITCHER */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              {transactionMode === 'single' ? (
                <Zap className="w-5 h-5 text-amber-400" />
              ) : (
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>
                  {transactionMode === 'single'
                    ? 'Input Transaksi Satuan'
                    : 'Keranjang Transaksi (Multi-Item)'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Antrian #{todaySequence}
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {transactionMode === 'single'
                  ? 'Mode cepat 1 transaksi langsung simpan & cetak struk'
                  : 'Kumpulkan beberapa transaksi dalam 1 struk pembayaran gabungan'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* MODE SWITCHER PILLS */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setTransactionMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  transactionMode === 'single'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Transaksi Tunggal (1 Transaksi Cepat)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Single Transaksi</span>
              </button>

              <button
                type="button"
                onClick={() => setTransactionMode('cart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  transactionMode === 'cart'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Keranjang Belanja (Kumpulkan banyak item)"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Keranjang</span>
                {cartItems.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 font-mono text-[10px] flex items-center justify-center font-extrabold ml-0.5">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CART TOAST NOTIFICATION */}
        {cartToast && (
          <div className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{cartToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setTransactionMode('cart')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Lihat Keranjang →
            </button>
          </div>
        )}

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto">
          {transactionMode === 'single' ? (
            /* ======================================================== */
            /* SINGLE TRANSACTION VIEW (CLEAN, FOCUSED & PROMINENT)     */
            /* ======================================================== */
            <form
              onSubmit={(e) => handleSubmitSingle(e, false)}
              className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto"
            >
              {/* 1. Category Pills Selector */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pilih Kategori Transaksi
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(Object.keys(CATEGORY_INFO) as TransactionCategory[]).map((cat) => {
                    const meta = CATEGORY_INFO[cat];
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{meta?.shortLabel || cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quick Catalog Picker */}
              {filteredProducts.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Katalog Cepat ({filteredProducts.length} produk tersedia)</span>
                    </span>
                    <div className="relative w-44">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari voucher/kuota..."
                        className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                    {filteredProducts.map((p) => {
                      const isSel = selectedProductId === p.id;
                      const total = (p.sellingPrice || 0) + (p.adminFee || 0);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className={`p-2 rounded-xl text-left border transition text-xs cursor-pointer flex flex-col justify-between ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400'
                          }`}
                        >
                          <div className="font-bold truncate text-slate-900 dark:text-white">
                            {p.name}
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {formatRupiah(total || p.costPrice)}
                            </span>
                            {p.stock !== undefined && (
                              <span
                                className={`text-[9px] font-semibold px-1 rounded ${
                                  p.stock <= 3
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                Sisa {p.stock}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Transaction Details Form */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Produk / Layanan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        setSelectedProductId('');
                      }}
                      placeholder="Contoh: Pulsa Telkomsel 20rb / Token Listrik"
                      className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Tujuan (HP / No. Meter PLN / ID Rekening)
                    </label>
                    <input
                      type="text"
                      value={targetNumber}
                      onChange={(e) => setTargetNumber(e.target.value)}
                      placeholder="Contoh: 081234567890 / 1420998811"
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Selling Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {activeCategory === 'tarik_tunai'
                        ? 'Nominal Uang Yang Ditarik Pelanggan (Rp)'
                        : 'Harga Produk / Nominal Pulsa (Rp)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={sellingPrice === 0 ? '' : sellingPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSellingPrice(val);
                          if (
                            cashGiven === (Number(sellingPrice) || 0) + (Number(adminFee) || 0) ||
                            cashGiven === 0
                          ) {
                            setCashGiven(val + (Number(adminFee) || 0));
                          }
                        }}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {/* Fast presets for nominal */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {[10000, 20000, 25000, 50000, 100000, 200000].map((nom) => (
                        <button
                          key={nom}
                          type="button"
                          onClick={() => {
                            setSellingPrice(nom);
                            if (
                              cashGiven === (Number(sellingPrice) || 0) + (Number(adminFee) || 0) ||
                              cashGiven === 0
                            ) {
                              setCashGiven(nom + (Number(adminFee) || 0));
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition cursor-pointer border ${
                            sellingPrice === nom
                              ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          {nom >= 1000 ? `${nom / 1000}rb` : nom}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin Fee Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Biaya Admin / Jasa Konter
                      </label>
                      {adminFee > 0 && (
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          +{formatRupiah(adminFee)}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={adminFee === 0 ? '' : adminFee}
                        onChange={(e) => handleSetAdminFee(Number(e.target.value))}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    {/* Quick Presets & Increments */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {QUICK_ADMIN_PRESETS.slice(0, 6).map((fee) => (
                        <button
                          key={fee.value}
                          type="button"
                          onClick={() => handleSetAdminFee(fee.value)}
                          className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition cursor-pointer border ${
                            adminFee === fee.value
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                          }`}
                        >
                          {fee.label}
                        </button>
                      ))}
                      {QUICK_ADMIN_INCREMENTS.slice(0, 3).map((inc) => (
                        <button
                          key={inc.value}
                          type="button"
                          onClick={() => handleAddAdminFee(inc.value)}
                          className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                        >
                          {inc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sub-info: Cost price & Profit */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Harga Modal:</span>
                    <input
                      type="number"
                      min="0"
                      value={costPrice || ''}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      placeholder="Rp 0"
                      className="w-28 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300"
                    />
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Estimasi Untung: <strong className="font-mono text-sm">+{formatRupiah(calculatedProfit)}</strong>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 4. TOTAL YANG HARUS DIBAYAR (PROMINENT & SANGAT JELAS)   */}
              {/* ======================================================== */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {activeCategory === 'tarik_tunai'
                        ? 'Total Uang Tunai Diserahkan Kasir'
                        : 'Total Yang Harus Dibayar Pelanggan'}
                    </span>
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    {formatRupiah(calculatedTotal)}
                  </div>
                  <div className="text-xs text-indigo-200/80 flex flex-wrap items-center gap-2 pt-0.5">
                    <span>
                      Harga: <strong className="font-mono text-white">{formatRupiah(sellingPrice)}</strong>
                    </span>
                    {adminFee > 0 && (
                      <span>
                        + Fee Admin: <strong className="font-mono text-emerald-300">+{formatRupiah(adminFee)}</strong>
                      </span>
                    )}
                    <span>
                      • Estimasi Untung: <strong className="font-mono text-emerald-400">+{formatRupiah(calculatedProfit)}</strong>
                    </span>
                  </div>
                </div>

                {/* Metode Pembayaran Pill */}
                <div className="shrink-0 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
                    Metode Pembayaran
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'tunai', label: 'Tunai', icon: Banknote },
                      { id: 'qris', label: 'QRIS', icon: QrCode },
                      { id: 'transfer_bank', label: 'Transfer', icon: CreditCard },
                    ].map((method) => {
                      const Icon = method.icon;
                      const isSel = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                            isSel
                              ? 'border-indigo-400 bg-indigo-600 text-white shadow-md'
                              : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Calculator Kembalian Tunai (Jika Metode Tunai & Bukan Tarik Tunai) */}
              {paymentMethod === 'tunai' && activeCategory !== 'tarik_tunai' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Uang Diterima dari Pelanggan:
                    </span>
                    <span className="font-mono">
                      Kembalian:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 text-base">
                        {formatRupiah(cashChange)}
                      </strong>
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Tombol cepat uang diterima */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setCashGiven(calculatedTotal)}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 cursor-pointer"
                    >
                      Uang Pas ({formatRupiah(calculatedTotal)})
                    </button>
                    {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashGiven(amt)}
                        className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        {amt >= 1000 ? `${amt / 1000}rb` : amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan Transaksi & Arus Kas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Transaksi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: SN 12345 / Sukses / Nama Pelanggan"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Arus Kas Laci
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCashFlow(cashFlow === 'pemasukan' ? 'pengeluaran' : 'pemasukan')
                    }
                    className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      cashFlow === 'pemasukan'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {cashFlow === 'pemasukan' ? (
                      <>
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        <span>Pemasukan (+ Kas Masuk)</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
                        <span>Pengeluaran (- Kas Keluar)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS (SINGLE TRANSAKSI) */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  title="Kumpulkan beberapa transaksi dalam 1 keranjang struk"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Masukkan ke Keranjang</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Simpan ({formatRupiah(calculatedTotal)})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmitSingle(e, true)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Simpan & Cetak ({formatRupiah(calculatedTotal)})</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ======================================================== */
            /* CART / MULTI-ITEM SPLIT VIEW                             */
            /* ======================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
              {/* LEFT: PRODUCT CATALOG & INPUT FOR CART */}
              <div className="lg:col-span-7 p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tambah Barang ke Keranjang
                  </div>
                  <button
                    type="button"
                    onClick={() => setTransactionMode('single')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Kembali ke Single Transaksi</span>
                  </button>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(Object.keys(CATEGORY_INFO) as TransactionCategory[]).map((cat) => {
                    const meta = CATEGORY_INFO[cat];
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{meta?.shortLabel || cat}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Catalog */}
                {filteredProducts.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Katalog ({filteredProducts.length})</span>
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari..."
                        className="w-36 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                      {filteredProducts.map((p) => {
                        const isSel = selectedProductId === p.id;
                        const total = (p.sellingPrice || 0) + (p.adminFee || 0);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProduct(p)}
                            className={`p-1.5 rounded-lg text-left border text-xs cursor-pointer ${
                              isSel
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 font-bold'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <div className="truncate text-[11px]">{p.name}</div>
                            <div className="font-mono font-bold text-[10px] text-indigo-600">
                              {formatRupiah(total || p.costPrice)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Form Inputs for Item */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Produk
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => {
                          setProductName(e.target.value);
                          setSelectedProductId('');
                        }}
                        placeholder="Contoh: Pulsa 10k"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nomor HP / ID
                      </label>
                      <input
                        type="text"
                        value={targetNumber}
                        onChange={(e) => setTargetNumber(e.target.value)}
                        placeholder="0812..."
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={sellingPrice === 0 ? '' : sellingPrice}
                        onChange={(e) => setSellingPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Biaya Admin (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={adminFee === 0 ? '' : adminFee}
                        onChange={(e) => handleSetAdminFee(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Produk Ini ke Keranjang ({formatRupiah(calculatedTotal)})</span>
                  </button>
                </div>
              </div>

              {/* RIGHT: LIVE CART ITEMS & BATCH CHECKOUT */}
              <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Daftar Belanja
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950 font-mono">
                        {cartItems.length} Item
                      </span>
                    </div>

                    {cartItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kosongkan</span>
                      </button>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Keranjang Kosong
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Pilih produk di sebelah kiri dan klik "+ Tambah Produk Ini ke Keranjang".
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {cartItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {idx + 1}. {item.productName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              {item.targetNumber && <span className="font-mono">{item.targetNumber}</span>}
                              {item.adminFee > 0 && (
                                <span className="text-emerald-500 font-mono">
                                  +adm {formatRupiah(item.adminFee)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                {formatRupiah(item.totalAmount)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batch Payment & Checkout */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-3.5 rounded-2xl bg-indigo-950 text-white shadow-inner flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
                        Total Belanja ({cartItems.length} Item)
                      </span>
                      <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                        {formatRupiah(cartTotal)}
                      </div>
                    </div>
                    <div className="text-right text-xs text-emerald-400 font-bold font-mono">
                      Untung: +{formatRupiah(cartProfit)}
                    </div>
                  </div>

                  {/* Batch Payment Method */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'tunai', label: 'Tunai' },
                      { id: 'qris', label: 'QRIS' },
                      { id: 'transfer_bank', label: 'Transfer' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setBatchPaymentMethod(m.id as PaymentMethod)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                          batchPaymentMethod === m.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {batchPaymentMethod === 'tunai' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Uang Diterima:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          Kembalian: <strong>{formatRupiah(batchCashChange)}</strong>
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={batchCashGiven || ''}
                        onChange={(e) => setBatchCashGiven(Number(e.target.value))}
                        placeholder="Rp 0"
                        className="w-full px-3 py-1.5 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={cartItems.length === 0}
                      onClick={() => handleSaveAllBatch(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40"
                    >
                      Simpan Batch ({cartItems.length})
                    </button>
                    <button
                      type="button"
                      disabled={cartItems.length === 0}
                      onClick={() => handleSaveAllBatch(true)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer disabled:opacity-40"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Struk Batch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
