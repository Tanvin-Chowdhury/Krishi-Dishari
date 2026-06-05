import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import PageContainer from '../../shared/ui/PageContainer';
import PageHeader from '../../shared/components/PageHeader';
import { ProductCard, categoryEmoji, MARKETPLACE_PRODUCT_GRID } from './MarketplaceShared';
import { displayCategory } from './marketplaceConstants';

export default function CategoryView() {
  const { categoryName } = useParams();
  const category = decodeURIComponent(categoryName);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    marketplaceApi
      .getProducts({ category, page, limit: 12 })
      .then((res) => {
        setProducts(res.products || []);
        setTotal(res.total || 0);
      })
      .catch(() => toast.error('লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, [category, page]);

  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <PageContainer maxWidth="max-w-7xl">
      <PageHeader
        title={displayCategory(category)}
        subtitle={`${categoryEmoji(category)} কৃষি পণ্য — ${total} টি তালিকা`}
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <div className={MARKETPLACE_PRODUCT_GRID}>
            {products.map((p) => (
              <ProductCard key={p.product_id} product={p} showAdd={false} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
              >
                আগে
              </button>
              <span className="px-4 py-2 text-sm">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
              >
                পরে
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
