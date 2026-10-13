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
  todaySequence: number;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveTransaction,
  todaySequence,
}) => {
  const [activeCategory, setActiveCategory] = useState<TransactionCategory>('voucher');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states
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

  // Calculations
  const calculatedTotal = useMemo(() => {
    if (activeCategory === 'tarik_tunai') {
      // Untuk tarik tunai: pelanggan menarik nominal tunai Rp X
      return sellingPrice;
    }
    return (Number(sellingPrice) || 0) + (Number(adminFee) || 0);
  }, [activeCategory, sellingPrice, adminFee]);

  const calculatedProfit = useMemo(() => {
    if (activeCategory === 'tarik_tunai') {
      // Keuntungan dari tarik tunai adalah fee admin
      return Number(adminFee) || 0;
    }
    // Keuntungan dari jual barang/jasa: (Harga jual - Modal) + Fee Admin
    const margin = (Number(sellingPrice) || 0) - (Number(costPrice) || 0);
    return margin + (Number(adminFee) || 0);
  }, [activeCategory, sellingPrice, costPrice, adminFee]);

  const cashChange = useMemo(() => {
    if (cashGiven < calculatedTotal) return 0;
    return cashGiven - calculatedTotal;
  }, [cashGiven, calculatedTotal]);

  const handleSubmit = (e: React.FormEvent, shouldPrint: boolean) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Input Transaksi Baru</h2>
              <p className="text-xs text-slate-400">Virgio Celluler • Kasir Cepat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Pills */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(Object.keys(CATEGORY_INFO) as TransactionCategory[]).map((cat) => {
            const meta = CATEGORY_INFO[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 scale-102'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{meta.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quick Catalog Selector */}
          <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-5 lg:pb-0 lg:pr-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pilih Dari Katalog ({filteredProducts.length})
              </span>
              <span className="text-[11px] text-indigo-500 font-medium">Klik untuk isi otomatis</span>
            </div>

            {/* Search filter in catalog */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari voucher, kuota, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Product items list */}
            <div className="space-y-2 overflow-y-auto max-h-72 lg:max-h-[380px] pr-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
                  <p className="text-xs">Tidak ada produk dalam kategori ini.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Silakan isi form manual di sebelah kanan atau tambah barang di menu Katalog.
                  </p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  const total = (p.sellingPrice || 0) + (p.adminFee || 0);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                            {p.name}
                          </div>
                          {p.code && (
                            <span className="text-[10px] font-mono text-slate-400">[{p.code}] </span>
                          )}
                          {p.provider && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {p.provider}
                            </span>
                          )}
                          {p.stock !== undefined && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              Stok: {p.stock}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono block">
                            {formatRupiah(total || p.costPrice)}
                          </span>
                          {p.adminFee > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                              +Fee {formatRupiah(p.adminFee)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Transaction Details Form */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              {/* Product name & Target Number */}
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
                    placeholder="Contoh: Voucher Tsel 3.5GB / Token 50.000 / Top Up DANA"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                      ? 'Barcode / Keterangan (Opsional)'
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
                        ? 'Contoh: BRI 123456789 a/n Budi'
                        : 'Contoh: 081234567890'
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Pricing & Admin fee breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {activeCategory === 'tarik_tunai'
                        ? 'Nominal Tarik Tunai'
                        : 'Harga Jual / Nominal'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={sellingPrice || ''}
                        onChange={(e) => setSellingPrice(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Biaya Admin / Jasa
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={adminFee || ''}
                        onChange={(e) => setAdminFee(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Harga Modal / Kulak
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={costPrice || ''}
                        onChange={(e) => setCostPrice(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Arus Kas & Keuntungan Preview */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">Arus Kasir:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCashFlow(cashFlow === 'pemasukan' ? 'pengeluaran' : 'pemasukan')
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition ${
                        cashFlow === 'pemasukan'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                      }`}
                    >
                      {cashFlow === 'pemasukan' ? (
                        <>
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Pemasukan (+ Kas Masuk)</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Pengeluaran (- Kas Keluar / Tarik Tunai)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-purple-600 dark:text-purple-400 font-medium">
                    Estimasi Untung: <strong className="font-mono">{formatRupiah(calculatedProfit)}</strong>
                  </div>
                </div>
              </div>

              {/* Total Bayar & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="p-4 rounded-xl bg-indigo-900 text-white shadow-inner">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-300 block">
                    {activeCategory === 'tarik_tunai'
                      ? 'Total Uang Tunai Diserahkan'
                      : 'Total Yang Harus Dibayar'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1">
                    {formatRupiah(calculatedTotal)}
                  </div>
                  {activeCategory === 'tarik_tunai' && (
                    <span className="text-[11px] text-amber-300 block mt-1">
                      *Kasir memberikan uang tunai Rp {sellingPrice.toLocaleString()} (laci berkurang)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
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
                          className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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

              {/* Calculator Kembalian (Cash Given & Change) */}
              {paymentMethod === 'tunai' && activeCategory !== 'tarik_tunai' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Uang Diterima dari Pelanggan:
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      Kembalian: <span className="text-emerald-600 dark:text-emerald-400">{formatRupiah(cashChange)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={cashGiven || ''}
                        onChange={(e) => setCashGiven(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 text-sm font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Fast money shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setCashGiven(calculatedTotal)}
                      className="px-2 py-1 text-[11px] font-medium rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashGiven(amt)}
                        className="px-2 py-1 text-[11px] font-medium rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: SN 1234567890 / Sukses / Pelanggan langganan"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                >
                  Simpan Saja
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Simpan & Cetak Struk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
