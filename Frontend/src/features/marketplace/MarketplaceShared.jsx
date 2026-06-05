import { useState } from 'react';

import { Link } from 'react-router';

import { Package, Star, Minus, Plus } from 'lucide-react';

import Card from '../../shared/design-system/Card';

import Badge from '../../shared/ui/Badge';

import { resolveMediaUrl } from '../../shared/lib/mediaUrl';

import { displayCategory } from './marketplaceConstants';



export const MARKETPLACE_PRODUCT_GRID =

  'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';



function popularityMeta(product) {
  const parts = [];
  if (product.total_sold > 0) {
    parts.push(`${Number(product.total_sold).toLocaleString('bn-BD')} বিক্রি`);
  } else if (product.total_sales > 0) {
    parts.push(`${product.total_sales} বিক্রি`);
  }
  if (product.order_count > 0) {
    parts.push(`${product.order_count} অর্ডার`);
  }
  return parts.join(' · ');
}

function popularityBadgeLabel(product) {
  if (product.popularity_label === 'সবচেয়ে বিক্রিত') return '🔥 সবচেয়ে বিক্রিত';
  if (product.popularity_label === 'Most Ordered') return 'Most Ordered';
  return null;
}



export function ProductCard({ product, onAddToCart, onOrderNow, showAdd = true, popular = false }) {

  const rawImg = product.photo_url || product.images?.[0];

  const img = rawImg ? (resolveMediaUrl(rawImg) || rawImg) : null;

  const meta = popularityMeta(product);

  const stock = parseFloat(product.stock_qty ?? product.stock ?? product.quantity ?? 0) || Infinity;

  const [qty, setQty] = useState(1);

  const dec = (e) => { e.preventDefault(); e.stopPropagation(); setQty((q) => Math.max(1, q - 1)); };
  const inc = (e) => { e.preventDefault(); e.stopPropagation(); setQty((q) => Math.min(stock, q + 1)); };



  return (

    <Card hover className="overflow-hidden !p-0">

      <Link to={`/app/market/products/${product.product_id || product.id}`}>

        <div className="relative aspect-[16/9] bg-gradient-to-br from-emerald-50 to-teal-50">

          {img ? (

            <img src={img} alt={product.title} className="h-full w-full object-cover" />

          ) : (

            <div className="flex h-full items-center justify-center text-emerald-200">

              <Package size={28} />

            </div>

          )}

          <span className="absolute left-1.5 top-1.5">

            <Badge variant="emerald" className="!px-2 !py-0.5 !text-[10px]">

              {displayCategory(product.category)}

            </Badge>

          </span>

          {popular && popularityBadgeLabel(product) && (
            <span
              className={`absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                product.popularity_label === 'Most Ordered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {popularityBadgeLabel(product)}
            </span>
          )}

        </div>

      </Link>

      <div className="p-3">

        <Link

          to={`/app/market/products/${product.product_id || product.id}`}

          className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 hover:text-emerald-700"

        >

          {product.title || product.product_name}

        </Link>

        <p className="mt-1 text-base font-bold text-emerald-600">

          ৳{Number(product.price).toLocaleString('bn-BD')}

          <span className="ml-1 text-[11px] font-normal text-slate-400">/{product.unit}</span>

        </p>

        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">

          <span className="truncate">{product.seller_name || 'বিক্রেতা'}</span>

          {product.rating > 0 && (

            <span className="flex shrink-0 items-center gap-0.5">

              <Star size={11} className="fill-amber-400 text-amber-400" />

              {product.rating}

            </span>

          )}

        </div>


        {showAdd && onAddToCart && (
          <div className="mt-2 space-y-1.5">
            {/* Quantity stepper */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-500">পরিমাণ</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={dec}
                  disabled={qty <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={12} />
                </button>
                <span className="flex h-7 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-800">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={inc}
                  disabled={qty >= stock}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {qty >= stock && stock !== Infinity && (
              <p className="text-[10px] text-amber-600 font-medium">স্টকে পর্যাপ্ত পণ্য নেই</p>
            )}

            {onOrderNow ? (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => { onAddToCart(product, qty); setQty(1); }}
                  className="flex h-9 items-center justify-center rounded-lg border border-emerald-600 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.99]"
                >
                  কার্টে যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={() => { onOrderNow(product, qty); setQty(1); }}
                  className="flex h-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  অর্ডার করুন
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { onAddToCart(product, qty); setQty(1); }}
                className="flex h-9 w-full items-center justify-center rounded-lg bg-emerald-600 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99]"
              >
                কার্টে যোগ করুন
              </button>
            )}
          </div>
        )}

      </div>

    </Card>

  );

}



export function CategoryCard({ name, count, emoji = '🌾' }) {

  const label = displayCategory(name);

  return (

    <Link to={`/app/market/category/${encodeURIComponent(name)}`}>

      <Card hover className="!p-4 text-center transition hover:border-emerald-200">

        <span className="text-3xl">{emoji}</span>

        <p className="mt-2 text-sm font-semibold text-slate-800">{label}</p>

        <p className="text-xs text-slate-400">{count} পণ্য</p>

      </Card>

    </Link>

  );

}



const CATEGORY_EMOJI = {

  'শস্য ও ধান': '🌾',

  'সবজি': '🥬',

  'ফল': '🍎',

  'ডাল ও তেলবীজ': '🫘',

  'মসলা ও শাক': '🌿',

  'মধু ও কৃষি উৎপাদ': '🍯',

  'দুগ্ধ, ডিম ও দুগ্ধজাত': '🥛',

  'মাছ, মাংস ও হাঁস-মুরগি': '🐟',

  'বীজ': '🌱',

  'সার': '🧪',

  'কীটনাশক': '🛡️',

  'ফসল সুরক্ষা পণ্য': '🍃',

  'জৈব কৃষি পণ্য': '🌿',

  'পশু খাদ্য': '🐄',

  'কৃষি যন্ত্রপাতি': '⚙️',

  'সেচ সরঞ্জাম': '💧',

  'ফসল সংগ্রহ যন্ত্র': '🚜',

  'কৃষি সরঞ্জাম': '🔧',

  'গ্রিনহাউস সরবরাহ': '🏠',

  'সংরক্ষণ সামগ্রী': '📦',

  'কৃষি আনুষাঙ্গিক': '🧰',

  Seeds: '🌱',

  Fertilizers: '🧪',

  Pesticides: '🛡️',

  'Farming Equipment': '🔧',

  'Irrigation Tools': '💧',

  'Harvesting Equipment': '🌾',

  'Agricultural Machinery': '⚙️',

  'Animal Feed': '🐄',

  'Crop Protection Products': '🍃',

  'Organic Farming Products': '🌿',

  'Greenhouse Supplies': '🏠',

  'Storage Materials': '📦',

  'Farming Accessories': '🧰',

  'Harvested Crops': '🥬',

};



export const categoryEmoji = (name) => {

  const key = displayCategory(name);

  return CATEGORY_EMOJI[key] || CATEGORY_EMOJI[name] || '🌾';

};



export function OrderStatusBadge({ status }) {

  const colors = {

    pending: 'bg-amber-100 text-amber-800',

    confirmed: 'bg-blue-100 text-blue-800',

    processing: 'bg-indigo-100 text-indigo-800',

    shipped: 'bg-purple-100 text-purple-800',

    delivered: 'bg-emerald-100 text-emerald-800',

    cancelled: 'bg-red-100 text-red-700',

  };

  const labels = {

    pending: 'অপেক্ষমান',

    confirmed: 'নিশ্চিত',

    processing: 'প্রক্রিয়াধীন',

    shipped: 'প্রেরিত',

    delivered: 'ডেলিভার্ড',

    cancelled: 'বাতিল',

  };

  return (

    <span

      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-600'}`}

    >

      {labels[status] || status}

    </span>

  );

}

