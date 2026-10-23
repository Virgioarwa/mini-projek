import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Pencil,
  Check,
  Printer,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Product,
  Transaction,
  TransactionCategory,
  CashFlowType,
  PaymentMethod,
} from '../types';
import { CATEGORY_INFO, formatRupiah } from '../utils/formatters';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  products: Product[];
  onUpdateTransaction: (updatedTrx: Transaction, shouldPrint: boolean) => void;
}

const COMMON_NOMINALS = [5000, 10000, 15000, 20000, 25000, 50000, 100000, 150000, 200000];
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

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  products,
  onUpdateTransaction,
}) => {
  const [category, setCategory] = useState<TransactionCategory>('voucher');
  const [productName, setProductName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetNumber, setTargetNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [adminFee, setAdminFee] = useState<number>(0);
  const [cashFlow, setCashFlow] = useState<CashFlowType>('pemasukan');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Auto-Sync state: whether cost price was manually customized
  const [isCostCustomized, setIsCostCustomized] = useState(false);

  // Smart handler: changes selling price and auto-syncs cost price unless customized
  const handleSellingPriceChange = (val: number) => {
    const prevSelling = Number(sellingPrice) || 0;
    const prevFee = Number(adminFee) || 0;
    const prevTotal = prevSelling + prevFee;

    setSellingPrice(val);

    if (!isCostCustomized || costPrice === 0 || costPrice === prevSelling) {
      setCostPrice(val);
    }

    if (category !== 'tarik_tunai') {
      if (cashGiven === prevTotal || cashGiven === 0) {
        setCashGiven(val + prevFee);
      }
    }
  };

  const handleCostPriceChange = (val: number) => {
    setCostPrice(val);
    setIsCostCustomized(val !== sellingPrice);
  };

  const handleSyncCostToSelling = () => {
    setCostPrice(sellingPrice);
    setIsCostCustomized(false);
  };

  // Populate form whenever transaction changes or modal opens
  useEffect(() => {
    if (transaction) {
      const tCost = transaction.costPrice ?? 0;
      const tSell = transaction.sellingPrice ?? 0;
      setCategory(transaction.category || 'voucher');
      setProductName(transaction.productName || '');
      setSelectedProductId(transaction.productId || '');
      setTargetNumber(transaction.targetNumber || '');
      setCustomerName(transaction.customerName || '');
      setCostPrice(tCost);
      setSellingPrice(tSell);
      setIsCostCustomized(tCost !== tSell && tCost > 0);
      setAdminFee(transaction.adminFee ?? 0);
      setCashFlow(transaction.cashFlow || 'pemasukan');
      setPaymentMethod(transaction.paymentMethod || 'tunai');
      setCashGiven(transaction.cashGiven ?? transaction.totalAmount ?? 0);
      setNotes(transaction.notes || '');
    }
  }, [transaction, isOpen]);

  // Handle selecting a catalog item
  const handleSelectProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    if (!prodId) return;

    const found = products.find((p) => p.id === prodId);
    if (found) {
      const pCost = found.costPrice ?? 0;
      const pSell = found.sellingPrice ?? 0;
      setProductName(found.name);
      setCategory(found.category);
      setCostPrice(pCost);
      setSellingPrice(pSell);
      setIsCostCustomized(pCost !== pSell && pCost > 0);
      if (found.adminFee !== undefined) setAdminFee(found.adminFee);
      const newTotal = pSell + (found.adminFee || 0);
      setCashGiven(newTotal);
    }
  };

  // Calculations
  const calculatedTotal = useMemo(() => {
    if (category === 'tarik_tunai') {
      return sellingPrice;
    }
    return (Number(sellingPrice) || 0) + (Number(adminFee) || 0);
  }, [category, sellingPrice, adminFee]);

  const calculatedProfit = useMemo(() => {
    if (category === 'tarik_tunai') {
      return Number(adminFee) || 0;
    }
    const margin = (Number(sellingPrice) || 0) - (Number(costPrice) || 0);
    return margin + (Number(adminFee) || 0);
  }, [category, sellingPrice, costPrice, adminFee]);

  const cashChange = useMemo(() => {
    if (cashGiven < calculatedTotal) return 0;
    return cashGiven - calculatedTotal;
  }, [cashGiven, calculatedTotal]);

  // Price difference vs original transaction
  const amountDifference = useMemo(() => {
    if (!transaction) return 0;
    return calculatedTotal - transaction.totalAmount;
  }, [transaction, calculatedTotal]);

  const handleSetAdminFee = (newFee: number) => {
    const val = Math.max(0, newFee);
    const prevFee = Number(adminFee) || 0;
    const sellPrice = Number(sellingPrice) || 0;
    const prevTotal = sellPrice + prevFee;

    setAdminFee(val);

    if (category !== 'tarik_tunai') {
      if (cashGiven === prevTotal || cashGiven === 0) {
        setCashGiven(sellPrice + val);
      }
    }
  };

  const handleAddAdminFee = (increment: number) => {
    const current = Number(adminFee) || 0;
    handleSetAdminFee(current + increment);
  };

  const handleSubmit = (e: React.FormEvent, shouldPrint: boolean) => {
    e.preventDefault();

    if (!transaction) return;

    if (!productName.trim()) {
      alert('Nama produk / layanan tidak boleh kosong.');
      return;
    }

    if (calculatedTotal <= 0 && category !== 'tarik_tunai') {
      alert('Total nominal transaksi harus lebih dari 0.');
      return;
    }

    const updatedTrx: Transaction = {
      ...transaction,
      category,
      productName: productName.trim(),
      productId: selectedProductId || undefined,
      customerName: customerName.trim() || 'Umum',
      targetNumber: targetNumber.trim() || undefined,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      adminFee: Number(adminFee) || 0,
      totalAmount: calculatedTotal,
      cashFlow,
      cashAmountOut: category === 'tarik_tunai' ? Number(sellingPrice) : undefined,
      cashGiven: Number(cashGiven) || calculatedTotal,
      cashChange,
      profit: calculatedProfit,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    onUpdateTransaction(updatedTrx, shouldPrint);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  const catMeta = CATEGORY_INFO[category] || CATEGORY_INFO.lainnya;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Edit Riwayat Transaksi
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700">
                  {transaction.receiptNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Koreksi nama produk, nominal, harga modal, atau biaya admin tanpa perlu menghapus struk
              </p>
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

        {/* Change summary alert */}
        {amountDifference !== 0 && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center gap-2 border-b ${
              amountDifference < 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <span>Total nominal berubah dari </span>
              <strong className="font-mono">{formatRupiah(transaction.totalAmount)}</strong>
              <span> menjadi </span>
              <strong className="font-mono">{formatRupiah(calculatedTotal)}</strong>
              <span> ({amountDifference > 0 ? '+' : ''}{formatRupiah(amountDifference)} ke arus kasir).</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form
          id="edit-trx-form"
          onSubmit={(e) => handleSubmit(e, false)}
          className="p-5 sm:p-6 overflow-y-auto space-y-5"
        >
          {/* 1. Kategori & Arus Kas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori Transaksi
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as TransactionCategory;
                  setCategory(newCat);
                  if (newCat === 'tarik_tunai') {
                    setCashFlow('pengeluaran');
                  } else {
                    setCashFlow('pemasukan');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {(Object.keys(CATEGORY_INFO) as TransactionCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_INFO[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Arus Kas Kasir
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCashFlow('pemasukan')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    cashFlow === 'pemasukan'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Pemasukan (+ Kas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCashFlow('pengeluaran')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    cashFlow === 'pengeluaran'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                  <span>Tarik Tunai (- Kas)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional: Catalog Quick Pick */}
          {products.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Pilih dari Katalog (Opsional - mengganti nama & harga secara instan)
              </label>
              <select
                value={selectedProductId}
                onChange={handleSelectProduct}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">-- Tetap Gunakan Custom Input --</option>
                {products
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Jual: {formatRupiah(p.sellingPrice)} (Modal: {formatRupiah(p.costPrice)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 2. Nama Produk & Nomor Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Produk / Layanan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: DANA 10.000, Pulsa Tsel 10rb, Token 20rb"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Tujuan / No HP / ID Pelanggan
              </label>
              <input
                type="text"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                placeholder="08xxxxxxxxxx atau No Meter PLN"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 3. Nominal / Harga Jual & Shortcut Buttons */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Harga Jual / Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
                  {formatRupiah(sellingPrice)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={sellingPrice || ''}
                  onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2 text-base font-bold font-mono rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Fast Nominal Buttons (Fixing 100rb to 10rb easily) */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mr-1">
                  Pilihan Cepat:
                </span>
                {COMMON_NOMINALS.map((nom) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => handleSellingPriceChange(nom)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer border ${
                      sellingPrice === nom
                        ? 'bg-blue-600 text-white border-blue-700 font-bold ring-2 ring-blue-400/40 shadow-xs dark:bg-amber-500 dark:text-slate-950 dark:border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-amber-400'
                    }`}
                  >
                    {nom >= 1000 ? `${nom / 1000}rb` : nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Fee & Cost Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200/50 dark:border-amber-900/40">
              {/* Biaya Admin */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Biaya Admin / Jasa (Rp)
                  </label>
                  {adminFee > 0 && (
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
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
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Presets Admin */}
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>Pilihan Cepat Admin:</span>
                    {adminFee > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetAdminFee(0)}
                        className="text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                      >
                        Reset (0)
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_ADMIN_PRESETS.map((fee) => (
                      <button
                        key={fee.value}
                        type="button"
                        onClick={() => handleSetAdminFee(fee.value)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer border ${
                          adminFee === fee.value
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        {fee.label}
                      </button>
                    ))}
                  </div>

                  {/* Kelipatan Increment */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mr-0.5">
                      +Kelipatan:
                    </span>
                    {QUICK_ADMIN_INCREMENTS.map((inc) => (
                      <button
                        key={inc.value}
                        type="button"
                        onClick={() => handleAddAdminFee(inc.value)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition cursor-pointer bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100"
                      >
                        {inc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Harga Modal / Kulak dengan Auto-Sync */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Harga Modal / Kulak (Rp)
                  </label>
                  {!isCostCustomized || costPrice === sellingPrice ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      ⚡ Auto-Sync
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      Kustom
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={costPrice || ''}
                    onChange={(e) => handleCostPriceChange(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSyncCostToSelling}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                  >
                    ⚡ Samakan dg Nominal
                  </button>
                  <span className="text-[10px] text-slate-400">
                    Laba: <strong className="font-mono text-emerald-600 dark:text-emerald-400">+{formatRupiah(calculatedProfit)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Total & Estimasi Laba Bersih Preview */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900 text-white">
            <div>
              <span className="text-[11px] text-slate-400 block">Total Transaksi (Dibayar Pelanggan)</span>
              <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                {formatRupiah(calculatedTotal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Laba Bersih Konter</span>
              <span className="text-base sm:text-lg font-mono font-bold text-amber-300">
                +{formatRupiah(calculatedProfit)}
              </span>
            </div>
          </div>

          {/* 5. Pembayaran, Pelanggan, & Kembalian */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="tunai">Tunai (Cash)</option>
                <option value="qris">QRIS (GoPay/OVO/ShopeePay)</option>
                <option value="transfer_bank">Transfer Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Umum"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Uang Diterima / Bayar (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              {cashChange > 0 && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  Kembalian: {formatRupiah(cashChange)}
                </div>
              )}
            </div>
          </div>

          {/* 6. Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Koreksi nominal salah input, Pelanggan titip pulsa, dsb."
              className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Simpan perubahan dan langsung buka struk thermal baru"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Simpan & Cetak Struk</span>
            </button>

            <button
              type="submit"
              form="edit-trx-form"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
