import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { Plus, Search, ShoppingCart, Package, Truck, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../../core/auth/AuthContext';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import { canBuyMarketplace, canSellMarketplace } from './MarketplaceRouteGuards';
import PageContainer from '../../shared/ui/PageContainer';
import PageHeader from '../../shared/components/PageHeader';
import Card from '../../shared/design-system/Card';
import Button from '../../shared/design-system/Button';
import { SkeletonGrid } from '../../shared/design-system/Skeleton';
import { EMPTY } from '../../shared/ui/emptyStatePresets';
import { ProductCard, MARKETPLACE_PRODUCT_GRID } from './MarketplaceShared';

export default function MarketplaceHome() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const canBuy = canBuyMarketplace(user);
  const canSell = canSellMarketplace(user);

  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    marketplaceApi
      .getCategories()
      .then((res) => setCategories(res.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingPopular(true);
    marketplaceApi
      .getPopular(6)
      .then((res) => setPopular(res.products || []))
      .catch(() => setPopular([]))
      .finally(() => setLoadingPopular(false));
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const prodRes = await marketplaceApi.getProducts({
        page,
        limit: 12,
        search: search || undefined,
        category: category || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
      });
      setProducts(prodRes.products || []);
      setTotal(prodRes.total || 0);
    } catch {
      toast.error('মার্কেটপ্লেস লোড করতে সমস্যা');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleAddToCart = async (product, quantity = 1) => {
    if (!canBuy) return toast.info('কেনাকাটার জন্য লগইন করুন (কৃষক/ক্রেতা/বিশেষজ্ঞ/শ্রমিক)');
    try {
      await marketplaceApi.addToCart(product.product_id || product.id, quantity);
      toast.success(`কার্টে যোগ হয়েছে (${quantity} ${product.unit || 'টি'})`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOrderNow = async (product, quantity = 1) => {
    if (!canBuy) return toast.info('কেনাকাটার জন্য লগইন করুন (কৃষক/ক্রেতা/বিশেষজ্ঞ/শ্রমিক)');
    try {
      await marketplaceApi.addToCart(product.product_id || product.id, quantity);
      navigate('/app/market/checkout');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <PageContainer maxWidth="max-w-7xl">
      <PageHeader
        title="মার্কেটপ্লেস"
        subtitle="ফসল, তাজা পণ্য ও কৃষি সরঞ্জাম — ছোট/মাঝারি পরিমাণে সরাসরি কেনাকাটা"
        action={
          canBuy || canSell ? (
            <div className="flex gap-2">
              {canBuy && (
                <Link to="/app/market/cart">
                  <Button variant="secondary" icon={ShoppingCart}>
                    কার্ট
                  </Button>
                </Link>
              )}
              {canSell && (
                <Link to="/app/market/sell">
                  <Button icon={Plus}>পণ্য যোগ করুন</Button>
                </Link>
              )}
            </div>
          ) : null
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Package, label: 'সক্রিয় তালিকা', val: total },
          { icon: Truck, label: 'বিভাগ', val: categories.filter((c) => c.count > 0).length },
          { icon: ShieldCheck, label: 'যাচাইকৃত', val: '১০০%' },
        ].map(({ icon: Icon, label, val }) => (
          <Card key={label} className="flex items-center gap-3 !p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900">{val}</p>
            </div>
          </Card>
        ))}
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        >
          <option value="">সব বিভাগ</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="ন্যূন. মূল্য"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <input
          type="number"
          placeholder="সর্বোচ্চ"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <Button type="submit">খুঁজুন</Button>
      </form>

      {!loadingPopular && popular.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">জনপ্রিয় পণ্য</h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              🔥 সবচেয়ে বিক্রিত
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              Most Ordered
            </span>
          </div>
          <div className={MARKETPLACE_PRODUCT_GRID}>
            {popular.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                popular
                onAddToCart={handleAddToCart}
                onOrderNow={handleOrderNow}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-base font-bold text-slate-900">সকল পণ্য</h3>
        {loadingProducts ? (
          <SkeletonGrid count={8} />
        ) : products.length === 0 ? (
          EMPTY.marketplace()
        ) : (
          <>
            <div className={MARKETPLACE_PRODUCT_GRID}>
              {products.map((p) => (
                <ProductCard key={p.product_id} product={p} onAddToCart={handleAddToCart} onOrderNow={handleOrderNow} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  আগে
                </Button>
                <span className="flex items-center px-4 text-sm text-slate-600">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  পরে
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </PageContainer>
  );
}
