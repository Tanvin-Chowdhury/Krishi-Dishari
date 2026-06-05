import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'react-toastify';
import { ArrowLeft, ShoppingCart, User } from 'lucide-react';
import { AuthContext } from '../../core/auth/AuthContext';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import { resolveMediaUrl } from '../../shared/lib/mediaUrl';
import { canBuyMarketplace } from './MarketplaceRouteGuards';
import PageContainer from '../../shared/ui/PageContainer';
import Button from '../../shared/design-system/Button';
import Card from '../../shared/design-system/Card';
import Badge from '../../shared/ui/Badge';
import { ProductCard } from './MarketplaceShared';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi
      .getProduct(id)
      .then((res) => {
        setProduct(res.product);
        setRelated(res.related || []);
      })
      .catch(() => toast.error('পণ্য লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!canBuyMarketplace(user)) return toast.info('কেনাকাটার জন্য লগইন প্রয়োজন');
    try {
      await marketplaceApi.addToCart(product.product_id, qty);
      toast.success('কার্টে যোগ হয়েছে');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </PageContainer>
    );
  }

  if (!product) return null;

  const images = (product.images?.length ? product.images : [product.photo_url].filter(Boolean)).map(
    (url) => resolveMediaUrl(url) || url
  );
  const isOwn = user?.user_id === product.seller_id;

  return (
    <PageContainer maxWidth="max-w-5xl">
      <Link
        to="/app/market"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft size={16} /> মার্কেটপ্লেস
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-emerald-50">
            {images[0] ? (
              <img src={images[0]} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-emerald-200">🌾</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <Badge variant="emerald">{product.category}</Badge>
          <h1 className="mt-3 text-2xl font-black text-slate-900">{product.title}</h1>
          <p className="mt-4 text-3xl font-bold text-emerald-600">
            ৳{Number(product.price).toLocaleString('bn-BD')}
            <span className="text-sm font-normal text-slate-400"> / {product.unit}</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            স্টক: {product.quantity} {product.unit}
          </p>

          <Card className="mt-6 !p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">বিক্রেতা</p>
                <p className="font-semibold text-slate-800">{product.seller_name}</p>
              </div>
            </div>
          </Card>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-slate-600">{product.description}</p>
          )}

          {!isOwn && canBuyMarketplace(user) && product.quantity > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <input
                type="number"
                min={1}
                max={product.quantity}
                value={qty}
                onChange={(e) => setQty(+e.target.value)}
                className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center"
              />
              <Button icon={ShoppingCart} onClick={addToCart} className="flex-1">
                কার্টে যোগ করুন
              </Button>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">সম্পর্কিত পণ্য</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.product_id} product={p} showAdd={false} />
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
