'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import {
  Plus, Package, CheckCircle2, Layers, DollarSign,
  Search, SlidersHorizontal, Eye, Pencil, Trash2,
  AlertTriangle, X, LayoutGrid, List,
} from 'lucide-react';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import { resolveMediaUrl } from '../../shared/lib/mediaUrl';
import PageContainer from '../../shared/ui/PageContainer';

/* ─── helpers ───────────────────────────────────────────── */
const STATUS_META = {
  'in-stock':    { label: 'স্টকে আছে',  color: 'bg-emerald-100 text-emerald-700' },
  'low-stock':   { label: 'কম স্টক',    color: 'bg-amber-100  text-amber-700'   },
  'out-of-stock':{ label: 'স্টক শেষ',   color: 'bg-red-100    text-red-700'     },
  inactive:      { label: 'নিষ্ক্রিয়', color: 'bg-gray-100   text-gray-500'    },
};

const fmt = (n) => Number(n ?? 0).toLocaleString('bn-BD');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── skeleton loader ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-100 rounded-lg flex-1" />
          <div className="h-8 bg-gray-100 rounded-lg w-8" />
          <div className="h-8 bg-gray-100 rounded-lg w-8" />
        </div>
      </div>
    </div>
  );
}

/* ─── stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

/* ─── delete confirmation modal ─────────────────────────── */
function DeleteModal({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mx-auto">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-center text-lg font-bold text-gray-800">পণ্য মুছে ফেলবেন?</h3>
        <p className="mt-2 text-center text-sm text-gray-500">
          <span className="font-semibold text-gray-700">&ldquo;{product?.title}&rdquo;</span> স্থায়ীভাবে মুছে যাবে।
          এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition"
          >
            {loading ? 'মুছছে…' : 'হ্যাঁ, মুছুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── product card ──────────────────────────────────────── */
function ProductCard({ product: p, onDelete }) {
  const navigate = useNavigate();
  const imgSrc = resolveMediaUrl(p.photo_url);
  const status = STATUS_META[p.status] ?? STATUS_META['in-stock'];

  return (
    <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Thumbnail */}
      <div
        onClick={() => navigate(`/app/market/products/${p.product_id}`)}
        className="relative h-44 cursor-pointer overflow-hidden bg-gradient-to-br from-emerald-50 to-gray-100 flex-shrink-0"
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={p.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        {/* Fallback */}
        <div
          className="absolute inset-0 items-center justify-center"
          style={{ display: imgSrc ? 'none' : 'flex' }}
        >
          <Package className="h-16 w-16 text-emerald-200" />
        </div>
        {/* Status pill overlay */}
        <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category badge */}
        <span className="self-start rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
          {p.category}
        </span>

        {/* Name */}
        <h3 className="font-bold text-gray-800 line-clamp-2 leading-snug">{p.title}</h3>

        {/* Price */}
        <p className="text-lg font-extrabold text-emerald-600">
          ৳{fmt(p.price)}
          <span className="ml-1 text-xs font-normal text-gray-400">/ {p.unit}</span>
        </p>

        {/* Stock row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>স্টক: <strong className="text-gray-700">{fmt(p.quantity)} {p.unit}</strong></span>
          <span>{fmtDate(p.created_at)}</span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-3 border-t border-gray-50">
          <Link
            to={`/app/market/products/${p.product_id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition"
          >
            <Eye className="h-3.5 w-3.5" /> দেখুন
          </Link>
          <Link
            to={`/app/market/products/${p.product_id}/edit`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
          >
            <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
          </Link>
          <button
            onClick={() => onDelete(p)}
            className="flex items-center justify-center rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500 hover:bg-red-100 transition"
            title="মুছুন"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── product list row (list view) ─────────────────────── */
function ProductRow({ product: p, onDelete }) {
  const navigate = useNavigate();
  const imgSrc = resolveMediaUrl(p.photo_url);
  const status = STATUS_META[p.status] ?? STATUS_META['in-stock'];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-150">
      {/* Thumbnail */}
      <div
        onClick={() => navigate(`/app/market/products/${p.product_id}`)}
        className="h-14 w-14 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 to-gray-100 flex items-center justify-center"
      >
        {imgSrc ? (
          <img src={imgSrc} alt={p.title} className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <Package className="h-6 w-6 text-emerald-200" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 truncate">{p.title}</p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{p.category}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.color}`}>{status.label}</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          স্টক: {fmt(p.quantity)} {p.unit} &nbsp;·&nbsp; {fmtDate(p.created_at)}
        </p>
      </div>

      {/* Price */}
      <p className="hidden sm:block font-bold text-emerald-600 flex-shrink-0">৳{fmt(p.price)}<span className="text-xs font-normal text-gray-400">/{p.unit}</span></p>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link to={`/app/market/products/${p.product_id}`}
          className="rounded-lg p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="দেখুন">
          <Eye className="h-4 w-4" />
        </Link>
        <Link to={`/app/market/products/${p.product_id}/edit`}
          className="rounded-lg p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="সম্পাদনা">
          <Pencil className="h-4 w-4" />
        </Link>
        <button onClick={() => onDelete(p)}
          className="rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="মুছুন">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── empty state ────────────────────────────────────────── */
function EmptyState({ filtered }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <Package className="h-10 w-10 text-emerald-300" />
      </div>
      {filtered ? (
        <>
          <p className="text-lg font-bold text-gray-700">কোনো পণ্য পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-gray-400">অনুসন্ধান বা ফিল্টার পরিবর্তন করে দেখুন</p>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-gray-700">এখনো কোনো পণ্য যোগ করা হয়নি</p>
          <p className="mt-1 text-sm text-gray-400">আপনার প্রথম কৃষি পণ্য তালিকাভুক্ত করুন</p>
          <Link
            to="/app/market/sell"
            className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition"
          >
            <Plus className="h-4 w-4" /> প্রথম পণ্য যোগ করুন
          </Link>
        </>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function SellerProductList() {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState('grid');   // 'grid' | 'list'
  const [search, setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [sortBy, setSortBy]         = useState('newest');
  const [toDelete, setToDelete]     = useState(null);   // product pending deletion
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    marketplaceApi
      .getMyProducts({ limit: 100 })
      .then((res) => setProducts(res.products || []))
      .catch(() => toast.error('পণ্য লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, []);

  /* derived stats */
  const stats = useMemo(() => {
    const active = products.filter((p) => p.is_active);
    const totalStock = products.reduce((s, p) => s + (p.quantity ?? 0), 0);
    const totalValue = products.reduce((s, p) => s + (p.price ?? 0) * (p.quantity ?? 0), 0);
    return { total: products.length, active: active.length, totalStock, totalValue };
  }, [products]);

  /* unique categories from data */
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products]);

  /* filtered + sorted */
  const visible = useMemo(() => {
    let arr = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((p) => p.title?.toLowerCase().includes(q));
    }
    if (categoryFilter) arr = arr.filter((p) => p.category === categoryFilter);
    if (statusFilter === 'active')   arr = arr.filter((p) => p.is_active);
    if (statusFilter === 'inactive') arr = arr.filter((p) => !p.is_active);
    if (statusFilter === 'low-stock') arr = arr.filter((p) => p.status === 'low-stock');
    if (statusFilter === 'out-of-stock') arr = arr.filter((p) => p.status === 'out-of-stock');

    if (sortBy === 'newest')   arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'oldest')   arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === 'price-hi') arr.sort((a, b) => b.price - a.price);
    if (sortBy === 'price-lo') arr.sort((a, b) => a.price - b.price);
    if (sortBy === 'stock-hi') arr.sort((a, b) => b.quantity - a.quantity);
    if (sortBy === 'stock-lo') arr.sort((a, b) => a.quantity - b.quantity);
    return arr;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const isFiltered = !!(search.trim() || categoryFilter || statusFilter);

  /* delete handlers */
  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await marketplaceApi.deleteProduct(toDelete.product_id);
      setProducts((prev) => prev.filter((p) => p.product_id !== toDelete.product_id));
      toast.success(`"${toDelete.title}" মুছে ফেলা হয়েছে`);
      setToDelete(null);
    } catch {
      toast.error('মুছতে সমস্যা হয়েছে');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer maxWidth="max-w-7xl">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">আমার পণ্য</h1>
          <p className="mt-0.5 text-sm text-gray-500">আপনার তালিকাভুক্ত কৃষি পণ্য পরিচালনা করুন</p>
        </div>
        <Link
          to="/app/market/sell"
          className="flex items-center gap-2 self-start rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 hover:shadow-md transition sm:self-auto"
        >
          <Plus className="h-4 w-4" /> নতুন পণ্য যোগ করুন
        </Link>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
        <StatCard icon={Package}      label="মোট পণ্য"          value={fmt(stats.total)}      color="text-blue-600"    bg="bg-blue-50"    />
        <StatCard icon={CheckCircle2} label="সক্রিয় পণ্য"       value={fmt(stats.active)}     color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Layers}       label="মোট স্টক"          value={fmt(stats.totalStock)} color="text-violet-600"  bg="bg-violet-50"  />
        <StatCard icon={DollarSign}   label="আনুমানিক মোট মূল্য" value={`৳${fmt(Math.round(stats.totalValue))}`} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="পণ্যের নাম খুঁজুন…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          {/* Category */}
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">সব ক্যাটেগরি</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">সব স্ট্যাটাস</option>
            <option value="active">সক্রিয়</option>
            <option value="inactive">নিষ্ক্রিয়</option>
            <option value="low-stock">কম স্টক</option>
            <option value="out-of-stock">স্টক শেষ</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="newest">নতুন আগে</option>
            <option value="oldest">পুরনো আগে</option>
            <option value="price-hi">দাম: বেশি→কম</option>
            <option value="price-lo">দাম: কম→বেশি</option>
            <option value="stock-hi">স্টক: বেশি→কম</option>
            <option value="stock-lo">স্টক: কম→বেশি</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2.5 transition ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="গ্রিড ভিউ"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2.5 transition ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="লিস্ট ভিউ"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Result count ── */}
      {!loading && products.length > 0 && (
        <p className="mb-4 text-sm text-gray-500">
          {visible.length} টি পণ্য দেখানো হচ্ছে{products.length !== visible.length ? ` (মোট ${products.length} টি থেকে)` : ''}
        </p>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.product_id} product={p} onDelete={setToDelete} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((p) => (
            <ProductRow key={p.product_id} product={p} onDelete={setToDelete} />
          ))}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {toDelete && (
        <DeleteModal
          product={toDelete}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setToDelete(null)}
        />
      )}
    </PageContainer>
  );
}
