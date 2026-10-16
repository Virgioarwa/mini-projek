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
  const [activeCategory, setActiveCategory] = useState<TransactionCategory>('voucher');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Cart (Keranjang) state
  const [cartItems, setCartItems] = useState<Transaction[]>([]);
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<PaymentMethod>('tunai');
  const [batchCashGiven, setBatchCashGiven] = useState<number>(0);
  const [cartToast, setCartToast] = useState<string | null>(null);

  // Mobile view tab: 'form' or 'cart'
  const [mobileTab, setMobileTab] = useState<'form' | 'cart'>('form');

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

  // Create current transaction object helper
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

    setCartToast(`"${item.productName}" masuk keranjang (${newCart.length} item)`);
    setTimeout(() => setCartToast(null), 2500);

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
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (confirm('Kosongkan semua transaksi di keranjang?')) {
      setCartItems([]);
      setBatchCashGiven(0);
    }
  };

  // Save all items in cart (with batch payment)
  const handleSaveAllBatch = (shouldPrint: boolean) => {
    let finalTrxs = [...cartItems];

    // If cashier also has an un-added item filled in the form, automatically include it
    if (productName.trim() && (calculatedTotal > 0 || activeCategory === 'tarik_tunai')) {
      const activeItem = createCurrentItem();
      if (activeItem) {
        finalTrxs.push(activeItem);
      }
    }

    if (finalTrxs.length === 0) {
      alert('Keranjang masih kosong. Mohon tambahkan produk atau simpan langsung.');
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

  // Direct single item submit (bypass cart)
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
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        {/* HEADER BAR */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Kasir Transaksi & Keranjang
                </h2>
                {cartItems.length > 0 && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950 font-mono">
                    {cartItems.length} Item di Keranjang
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                Virgio Celluler • Input transaksi satuan atau kumpulkan ke keranjang untuk 1 struk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Tab Switcher: Form vs Keranjang */}
            <div className="lg:hidden flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setMobileTab('form')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mobileTab === 'form'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Input Produk
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('cart')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  mobileTab === 'cart'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Keranjang</span>
                {cartItems.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] flex items-center justify-center font-extrabold">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
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
              onClick={() => setMobileTab('cart')}
              className="lg:hidden px-2 py-0.5 rounded bg-slate-950 text-white text-[11px] font-bold"
            >
              Lihat Keranjang →
            </button>
          </div>
        )}

        {/* UNIFIED POS BODY: LEFT FORM + RIGHT LIVE CART */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: CATEGORIES + CATALOG + TRANSACTION INPUT    */}
          {/* ======================================================== */}
          <div
            className={`lg:col-span-7 flex flex-col p-4 sm:p-5 space-y-4 overflow-y-auto ${
              mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
            }`}
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{meta.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Quick Catalog Items (Collapsible / Compact) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Katalog Produk ({filteredProducts.length})</span>
                </span>
                <div className="relative w-44 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari voucher, kuota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Product cards row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-3 text-center text-xs text-slate-400">
                    Tidak ada produk di kategori ini. Anda bisa ketik manual di bawah.
                  </div>
                ) : (
                  filteredProducts.slice(0, 18).map((p) => {
                    const isSelected = selectedProductId === p.id;
                    const total = (p.sellingPrice || 0) + (p.adminFee || 0);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                          {p.name}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {formatRupiah(total || p.costPrice)}
                          </span>
                          {p.stock !== undefined && (
                            <span className="text-[10px] text-slate-400">Stk:{p.stock}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Form Input Details */}
            <form onSubmit={(e) => handleSubmitSingle(e, false)} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Produk / Layanan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Contoh: Voucher Indosat 7GB / Token 50.000 / Top Up DANA"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {activeCategory === 'token_listrik'
                      ? 'No. Meter / ID Pelanggan PLN'
                      : activeCategory === 'transfer'
                      ? 'No. Rekening & Bank Tujuan'
                      : activeCategory === 'tagihan'
                      ? 'ID Pelanggan / No Tagihan'
                      : activeCategory === 'aksesoris'
                      ? 'Barcode / Keterangan'
                      : 'No. HP Pelanggan / Nomor Tujuan'}
                  </label>
                  <input
                    type="text"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(e.target.value)}
                    placeholder={
                      activeCategory === 'token_listrik'
                        ? 'Contoh: 14234567890'
                        : activeCategory === 'transfer'
                        ? 'Contoh: BRI 12345678 a/n Budi'
                        : 'Contoh: 081234567890'
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pelanggan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Pak Budi / Umum"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Pricing & Admin Fee Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  {/* Selling Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {activeCategory === 'tarik_tunai'
                        ? 'Nominal Tarik Tunai'
                        : 'Harga Jual / Nominal'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={sellingPrice || ''}
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
                        className="w-full pl-9 pr-3 py-1.5 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition cursor-pointer border ${
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
                        Biaya Admin / Jasa
                      </label>
                      {adminFee > 0 && (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
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
                        className="w-full pl-9 pr-3 py-1.5 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    {/* Quick Presets & Increments */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {QUICK_ADMIN_PRESETS.slice(0, 6).map((fee) => (
                        <button
                          key={fee.value}
                          type="button"
                          onClick={() => handleSetAdminFee(fee.value)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer border ${
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
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
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
                      className="w-24 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300"
                    />
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Estimasi Untung: <strong className="font-mono">+{formatRupiah(calculatedProfit)}</strong>
                  </div>
                </div>
              </div>

              {/* 4. Total Yang Harus Dibayar & Metode Pembayaran (Single Transaksi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Total Bayar Box */}
                <div className="p-3.5 rounded-2xl bg-indigo-950 text-white shadow-inner flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
                      {activeCategory === 'tarik_tunai'
                        ? 'Total Uang Tunai Diserahkan'
                        : 'Total Yang Harus Dibayar'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-0.5">
                      {formatRupiah(calculatedTotal)}
                    </div>
                  </div>
                  {activeCategory === 'tarik_tunai' ? (
                    <span className="text-[10px] text-amber-300 mt-1 block">
                      *Kasir menyerahkan uang tunai Rp {sellingPrice.toLocaleString()} (kas laci berkurang)
                    </span>
                  ) : (
                    <span className="text-[10px] text-indigo-300 mt-1 block">
                      Harga {formatRupiah(sellingPrice)} {adminFee > 0 ? `+ Fee Admin ${formatRupiah(adminFee)}` : ''}
                    </span>
                  )}
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
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
                          className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Calculator Kembalian Tunai (Jika Metode Tunai & Bukan Tarik Tunai) */}
              {paymentMethod === 'tunai' && activeCategory !== 'tarik_tunai' && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Uang Diterima dari Pelanggan:
                    </span>
                    <span className="font-mono">
                      Kembalian: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatRupiah(cashChange)}</strong>
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-1.5 text-sm font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Tombol cepat uang diterima */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCashGiven(calculatedTotal)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashGiven(amt)}
                        className="px-2 py-0.5 text-[10px] font-mono rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 cursor-pointer"
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
                    placeholder="Contoh: SN 12345 / Sukses"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className={`w-full py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      cashFlow === 'pemasukan'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {cashFlow === 'pemasukan' ? (
                      <>
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pemasukan (+ Kas Masuk)</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                        <span>Pengeluaran (- Kas Keluar)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ACTION BAR: TAMBAH KE KERANJANG VS SIMPAN LANGSUNG */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* TOMBOL UTAMA: TAMBAH KE KERANJANG */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                  title="Tambah ke Keranjang untuk checkout bersamaan"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Tambah ke Keranjang</span>
                </button>

                {/* Tombol Simpan Langsung (Jika hanya 1 item dan tidak mau keranjang) */}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Simpan Langsung
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmitSingle(e, true)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Simpan & Cetak</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: LIVE KERANJANG BELANJA & QUICK SETTLEMENT  */}
          {/* ======================================================== */}
          <div
            className={`lg:col-span-5 flex flex-col p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-900/60 justify-between space-y-4 overflow-y-auto ${
              mobileTab === 'form' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="space-y-3">
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Keranjang Belanja
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950 font-mono">
                    {cartItems.length} Item
                  </span>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              {/* Items List in Cart */}
              {cartItems.length === 0 ? (
                <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Keranjang Masih Kosong
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Pilih produk dan klik <strong>"+ Tambah ke Keranjang"</strong> jika pelanggan membeli lebih dari 1 transaksi sekaligus.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 lg:max-h-64 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => {
                    const meta = CATEGORY_INFO[item.category];
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 font-mono font-bold text-[10px] flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.productName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1 py-0.2 rounded font-semibold ${meta?.badgeBg || 'bg-slate-100 text-slate-700'}`}>
                                {meta?.shortLabel || item.category}
                              </span>
                              {item.targetNumber && (
                                <span className="font-mono">{item.targetNumber}</span>
                              )}
                              {item.adminFee > 0 && (
                                <span className="text-emerald-500 font-mono">
                                  +adm {formatRupiah(item.adminFee)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                              {formatRupiah(item.totalAmount)}
                            </div>
                            <div className="text-[9px] text-emerald-500 font-mono">
                              +{formatRupiah(item.profit)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Settlement & Checkout Section */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              {/* Grand Total Bar */}
              <div className="p-3.5 rounded-2xl bg-indigo-950 text-white shadow-inner flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
                    Total Belanja ({cartItems.length} Item)
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                    {formatRupiah(cartTotal)}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-emerald-400 font-bold block">
                    Laba: +{formatRupiah(cartProfit)}
                  </span>
                  {cartAdminFee > 0 && (
                    <span className="text-[10px] text-amber-300 block">
                      Admin: {formatRupiah(cartAdminFee)}
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Metode Pembayaran Batch
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'tunai', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS', icon: QrCode },
                    { id: 'transfer_bank', label: 'Transfer', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSel = batchPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setBatchPaymentMethod(m.id as PaymentMethod)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          isSel
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tunai Change Calculator */}
              {batchPaymentMethod === 'tunai' && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      Uang Diterima:
                    </span>
                    <span className="font-mono">
                      Kembalian: <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(batchCashChange)}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={batchCashGiven || ''}
                      onChange={(e) => setBatchCashGiven(Number(e.target.value))}
                      className="w-full pl-8 pr-2.5 py-1 text-sm font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  {/* Quick cash chips */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBatchCashGiven(cartTotal)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {[20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setBatchCashGiven(amt)}
                        className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        {amt >= 1000 ? `${amt / 1000}rb` : amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkout Batch Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={() => handleSaveAllBatch(false)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-center transition cursor-pointer ${
                    cartItems.length > 0
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Simpan Batch ({cartItems.length})
                </button>
                <button
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={() => handleSaveAllBatch(true)}
                  className={`py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    cartItems.length > 0
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 active:scale-95'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk ({cartItems.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY FLOATING CART BAR (WHEN MOBILE TAB IS FORM & CART HAS ITEMS) */}
        {mobileTab === 'form' && cartItems.length > 0 && (
          <div className="lg:hidden p-3 bg-amber-400 text-slate-950 border-t border-amber-500 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-extrabold">
                {cartItems.length} Item • {formatRupiah(cartTotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              className="px-3 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
            >
              <span>Buka Keranjang / Bayar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
