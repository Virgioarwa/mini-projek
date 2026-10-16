import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  EyeOff,
  Eye,
  Layers,
  Sparkles,
  Tag,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  X,
  PackagePlus,
} from 'lucide-react';
import { Product, TransactionCategory } from '../types';
import { CATEGORY_INFO, formatRupiah } from '../utils/formatters';
import { DEFAULT_PRODUCTS } from '../data/defaultProducts';

interface CatalogManagerProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  products,
  onSaveProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'low_stock' | 'inactive'>('all');

  // Count items with low stock (< 5)
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.isActive && p.stock !== undefined && p.stock < 5).length;
  }, [products]);

  // Quick Restock handler (+N units)
  const handleQuickRestock = (p: Product, amount: number) => {
    const currentStock = p.stock || 0;
    const newStock = currentStock + amount;
    const updated = products.map((item) =>
      item.id === p.id
        ? {
            ...item,
            stock: newStock,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    onSaveProducts(updated);
  };

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('voucher');
  const [provider, setProvider] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [adminFee, setAdminFee] = useState<number>(0);
  const [stock, setStock] = useState<string>('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = (presetCategory?: TransactionCategory) => {
    setEditingProduct(null);
    setName('');
    setCategory(presetCategory || 'voucher');
    setProvider('');
    setCostPrice(0);
    setSellingPrice(0);
    setAdminFee(presetCategory ? CATEGORY_INFO[presetCategory]?.defaultAdmin || 0 : 0);
    setStock('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setProvider(p.provider || '');
    setCostPrice(p.costPrice || 0);
    setSellingPrice(p.sellingPrice || 0);
    setAdminFee(p.adminFee || 0);
    setStock(p.stock !== undefined ? String(p.stock) : '');
    setCode(p.code || '');
    setDescription(p.description || '');
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama produk tidak boleh kosong.');
      return;
    }

    const now = new Date().toISOString();
    const stockVal = stock.trim() !== '' ? Number(stock) : undefined;

    if (editingProduct) {
      // Update
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: name.trim(),
              category,
              provider: provider.trim() || undefined,
              costPrice: Number(costPrice) || 0,
              sellingPrice: Number(sellingPrice) || 0,
              adminFee: Number(adminFee) || 0,
              stock: stockVal,
              code: code.trim() || undefined,
              description: description.trim() || undefined,
              isActive,
              updatedAt: now,
            }
          : p
      );
      onSaveProducts(updated);
    } else {
      // Add new
      const newProduct: Product = {
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        category,
        provider: provider.trim() || undefined,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        adminFee: Number(adminFee) || 0,
        stock: stockVal,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      onSaveProducts([newProduct, ...products]);
    }

    setIsModalOpen(false);
  };

  // Toggle active/inactive
  const handleToggleStatus = (p: Product) => {
    const updated = products.map((item) =>
      item.id === p.id ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() } : item
    );
    onSaveProducts(updated);
  };

  // Delete product
  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Hapus produk "${p.name}" secara permanen dari katalog?`)) {
      const updated = products.filter((item) => item.id !== p.id);
      onSaveProducts(updated);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (
      confirm(
        'Kembalikan seluruh produk ke template bawaan awal? Produk kustom Anda akan terhapus.'
      )
    ) {
      onSaveProducts(DEFAULT_PRODUCTS);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'inactive' && p.isActive) return false;
      if (statusFilter === 'low_stock' && (!p.isActive || p.stock === undefined || p.stock >= 5)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = (p.code || '').toLowerCase().includes(q);
        const matchProvider = (p.provider || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchProvider) return false;
      }
      return true;
    });
  }, [products, selectedCategory, statusFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Peringatan Stok Rendah Alert Banner */}
      {lowStockCount > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <span>Peringatan Stok Rendah: {lowStockCount} Barang Perlu Di-restock Segera!</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                  Stok &lt; 5
                </span>
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Stok voucher fisik atau aksesoris HP di bawah 5 unit (atau telah habis). Segera lakukan pemesanan kulakan agar penjualan tidak terhambat.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'low_stock'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{statusFilter === 'low_stock' ? 'Tampilkan Semua Barang' : 'Filter Barang Menipis (<5)'}</span>
          </button>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Katalog Produk & Master Transaksi
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Tambah produk/voucher baru yang baru rilis, ubah harga modal/jual, atau nonaktifkan barang yang sudah tidak diproduksi/tidak keluar lagi.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset ke daftar produk bawaan konter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ Tambah Produk / Voucher Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama barang, voucher, kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Kategori ({products.length})</option>
            {(Object.keys(CATEGORY_INFO) as TransactionCategory[]).map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {CATEGORY_INFO[cat].label} ({count})
                </option>
              );
            })}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif (Siap Jual)</option>
            {lowStockCount > 0 && (
              <option value="low_stock">⚠️ Stok Rendah &lt; 5 ({lowStockCount})</option>
            )}
            <option value="inactive">Nonaktif / Tidak Produksi</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => {
          const catMeta = CATEGORY_INFO[p.category] || CATEGORY_INFO.lainnya;
          const totalHarga = (p.sellingPrice || 0) + (p.adminFee || 0);
          const margin = (p.sellingPrice || 0) - (p.costPrice || 0) + (p.adminFee || 0);
          const isLowStock = p.isActive && p.stock !== undefined && p.stock < 5;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                !p.isActive
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-700/60 opacity-60'
                  : isLowStock
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-400 dark:border-rose-600 shadow-md ring-2 ring-rose-400/40'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:shadow-md'
              }`}
            >
              <div>
                {/* Badge Category & Status */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catMeta.badgeBg}`}
                  >
                    {catMeta.shortLabel}
                  </span>

                  {p.isActive ? (
                    isLowStock ? (
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                        <span>Perlu Restock</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Aktif
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                      Diskontinu
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug">
                  {p.name}
                </h4>

                {/* Provider / Code / Stock */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {p.provider && <span>{p.provider}</span>}
                  {p.code && <span className="font-mono text-slate-400">[{p.code}]</span>}
                  {p.stock !== undefined && (
                    p.stock === 0 ? (
                      <span className="font-bold text-[10px] text-white bg-rose-600 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Stok Habis (0)</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="font-bold text-[10px] text-rose-700 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Sisa {p.stock} (Stok Rendah)</span>
                      </span>
                    ) : (
                      <span className="font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                        Stok: {p.stock}
                      </span>
                    )
                  )}
                </div>

                {p.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Harga Jual:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    {formatRupiah(totalHarga)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Modal: {formatRupiah(p.costPrice)}</span>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    Untung: +{formatRupiah(margin)}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(p)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                      p.isActive
                        ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title={
                      p.isActive
                        ? 'Tandai Tidak Produksi Lagi (Diskontinu)'
                        : 'Aktifkan Kembali Produk Ini'
                    }
                  >
                    {p.isActive ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Nonaktifkan</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {p.stock !== undefined && p.isActive && (
                      <button
                        type="button"
                        onClick={() => handleQuickRestock(p, 10)}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 transition cursor-pointer"
                        title="Tambah +10 stok secara instan"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+10 Stok</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">
            Produk tidak ditemukan
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Silakan ubah filter atau klik tombol Tambah Produk Baru di atas.
          </p>
        </div>
      )}

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingProduct ? 'Edit Data Produk / Voucher' : 'Tambah Produk / Voucher Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Produk / Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Voucher Telkomsel 14GB 30 Hari"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Transaksi
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {(Object.keys(CATEGORY_INFO) as TransactionCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_INFO[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operator / Provider
                  </label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Telkomsel, Tri, PLN, dll"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Modal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-indigo-600 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    value={adminFee || ''}
                    onChange={(e) => setAdminFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono text-emerald-600 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[0, 2000, 2500, 3000, 5000, 7000, 10000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setAdminFee(fee)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer border ${
                          adminFee === fee
                            ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {fee === 0 ? '0' : fee >= 1000 ? `${fee / 1000}rb` : fee}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Produk / SKU (Opsional)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: V-TSEL-14GB"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stok Fisik (Kosongkan jika digital)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="Kosong = Tak Terbatas"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan kuota, masa aktif, garansi, dll."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="isActiveCheck"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Produk Aktif (Tampilkan di menu Kasir)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
