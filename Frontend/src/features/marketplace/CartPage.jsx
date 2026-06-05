import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { Trash2, ShoppingBag, Minus, Plus, Loader2 } from 'lucide-react';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import { resolveMediaUrl } from '../../shared/lib/mediaUrl';
import PageContainer from '../../shared/ui/PageContainer';
import PageHeader from '../../shared/components/PageHeader';
import Button from '../../shared/design-system/Button';
import Card from '../../shared/design-system/Card';

const bn = (n) => Number(n || 0).toLocaleString('bn-BD');

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 });
  const [loading, setLoading] = useState(true);
  // productId → current displayed qty (optimistic)
  const [localQtys, setLocalQtys] = useState({});
  // productId set — items currently awaiting PATCH response
  const [updating, setUpdating] = useState(new Set());
  // inflight PATCH abort controllers keyed by productId
  const inflightRef = useRef({});

  const load = useCallback(() => {
    marketplaceApi
      .getCart()
      .then((res) => {
        setCart(res.cart);
        // sync local qtys with server truth
        const init = {};
        (res.cart.items ?? []).forEach((i) => {
          init[i.product.product_id] = i.quantity;
        });
        setLocalQtys(init);
      })
      .catch(() => toast.error('কার্ট লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Optimistically update qty, call PATCH, rollback on error. */
  const changeQty = useCallback(async (productId, newQty, currentQty, stock) => {
    // Clamp to valid range
    const clamped = Math.max(1, Math.min(newQty, stock));
    if (clamped === currentQty) return;

    // Prevent double-click by marking updating
    if (updating.has(productId)) return;

    // Cancel any previous in-flight request for this item
    inflightRef.current[productId]?.abort?.();

    // Optimistic UI
    setLocalQtys((prev) => ({ ...prev, [productId]: clamped }));
    setUpdating((prev) => new Set(prev).add(productId));

    try {
      const res = await marketplaceApi.updateCartItem(productId, clamped);
      // Sync full cart from server (subtotals, item_count etc.)
      setCart(res.cart);
      const next = {};
      (res.cart.items ?? []).forEach((i) => { next[i.product.product_id] = i.quantity; });
      setLocalQtys(next);
    } catch (err) {
      // Rollback optimistic qty
      setLocalQtys((prev) => ({ ...prev, [productId]: currentQty }));
      toast.error(err.message || 'আপডেট ব্যর্থ হয়েছে');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }, [updating]);

  const remove = useCallback(async (productId) => {
    if (!window.confirm('এই পণ্যটি কার্ট থেকে সরাবেন?')) return;
    try {
      const res = await marketplaceApi.removeCartItem(productId);
      setCart(res.cart);
      const next = {};
      (res.cart.items ?? []).forEach((i) => { next[i.product.product_id] = i.quantity; });
      setLocalQtys(next);
      toast.success('কার্ট থেকে সরানো হয়েছে');
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  // Derived: compute subtotal from localQtys × prices for instant UI feedback
  const displayItems = (cart.items ?? []).map((item) => {
    const pid = item.product.product_id;
    const qty = localQtys[pid] ?? item.quantity;
    return { ...item, quantity: qty, line_total: item.product.price * qty };
  });
  const displaySubtotal = displayItems.reduce((s, i) => s + i.line_total, 0);
  const displayItemCount = displayItems.reduce((s, i) => s + i.quantity, 0);

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="max-w-3xl">
      <PageHeader
        title="শপিং কার্ট"
        subtitle={`${displayItemCount} টি আইটেম`}
      />

      {displayItems.length === 0 ? (
        <Card className="py-14 text-center">
          <ShoppingBag size={44} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 mb-4">আপনার কার্ট খালি</p>
          <Link
            to="/app/market"
            className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            কেনাকাটা শুরু করুন
          </Link>
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {displayItems.map((item) => {
              const pid = item.product.product_id;
              const qty = item.quantity;
              const stock = item.product.stock_qty ?? item.product.stock ?? Infinity;
              const busy = updating.has(pid);
              const atMax = qty >= stock;
              const atMin = qty <= 1;
              const imgSrc =
                resolveMediaUrl(item.product.photo_url || item.product.images?.[0]) ||
                item.product.photo_url;

              return (
                <li key={item.cart_id}>
                  <Card className="!p-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      {/* Product image */}
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={item.product.title}
                          className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                          <ShoppingBag size={20} className="text-slate-300" />
                        </div>
                      )}

                      {/* Product info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 leading-snug">
                          {item.product.title}
                        </p>
                        <p className="mt-0.5 text-sm text-emerald-600 font-medium">
                          ৳{bn(item.product.price)} / {item.product.unit}
                        </p>
                        {atMax && (
                          <p className="mt-0.5 text-xs text-amber-600 font-medium">
                            স্টকে পর্যাপ্ত পণ্য নেই — সর্বোচ্চ {bn(stock)} {item.product.unit}
                          </p>
                        )}
                      </div>

                      {/* Qty stepper */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="কমান"
                          disabled={atMin || busy}
                          onClick={() => changeQty(pid, qty - 1, qty, stock)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={14} />
                        </button>

                        <div className="relative flex h-8 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white">
                          {busy ? (
                            <Loader2 size={14} className="animate-spin text-emerald-500" />
                          ) : (
                            <span className="text-sm font-bold text-slate-800">{qty}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label="বাড়ান"
                          disabled={atMax || busy}
                          onClick={() => changeQty(pid, qty + 1, qty, stock)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Line total */}
                      <p className="w-24 text-right font-bold text-slate-800">
                        ৳{bn(item.line_total)}
                      </p>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => remove(pid)}
                        aria-label="সরান"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Summary card */}
          <Card className="mt-5 !p-5">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>মোট আইটেম</span>
                <span className="font-semibold text-slate-800">{bn(displayItemCount)}</span>
              </div>
              <div className="flex justify-between">
                <span>পণ্যের সংখ্যা</span>
                <span className="font-semibold text-slate-800">{displayItems.length} ধরন</span>
              </div>
            </div>
            <div className="my-3 border-t border-slate-100" />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>সর্বমোট</span>
              <span className="text-emerald-600">৳{bn(displaySubtotal)}</span>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => navigate('/app/market/checkout')}
            >
              চেকআউট করুন →
            </Button>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
