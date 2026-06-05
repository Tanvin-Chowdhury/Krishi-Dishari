import { useRef, useState } from 'react';

import { useNavigate, Link } from 'react-router';

import { toast } from 'react-toastify';

import { Link2, Upload, X } from 'lucide-react';

import { marketplaceApi, DEFAULT_MARKETPLACE_CATEGORY, MARKETPLACE_CATEGORY_GROUPS, MARKETPLACE_UNITS } from '../../shared/services/marketplaceApi';

import { fileToDataUrl } from '../../shared/lib/fileToDataUrl';

import { resolveMediaUrl } from '../../shared/lib/mediaUrl';

import PageContainer from '../../shared/ui/PageContainer';

import PageHeader from '../../shared/components/PageHeader';

import Button from '../../shared/design-system/Button';

import { Label } from '../../shared/design-system/Form';



const inputClass =

  'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';



export default function AddProduct() {

  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({

    title: '',

    description: '',

    category: DEFAULT_MARKETPLACE_CATEGORY,

    price: '',

    quantity: '',

    unit: 'কেজি',

    image_url: '',

    image_preview: '',

    image_data: '',

  });



  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));



  const handleImageFile = async (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {

      toast.error('শুধু ছবি ফাইল নির্বাচন করুন');

      return;

    }

    if (file.size > 4 * 1024 * 1024) {

      toast.error('ছবির আকার 4 MB এর কম হতে হবে');

      return;

    }

    try {

      const dataUrl = await fileToDataUrl(file);

      setForm((f) => ({

        ...f,

        image_data: dataUrl,

        image_preview: dataUrl,

        image_url: '',

      }));

    } catch {

      toast.error('ছবি পড়া যায়নি');

    }

  };



  const clearUploadedImage = () => {

    setForm((f) => ({ ...f, image_data: '', image_preview: '' }));

    if (fileInputRef.current) fileInputRef.current.value = '';

  };



  const handleImageUrlChange = (value) => {

    setForm((f) => ({

      ...f,

      image_url: value,

      image_data: '',

      image_preview: value.trim()

        ? resolveMediaUrl(value.trim()) || value.trim()

        : '',

    }));

    if (fileInputRef.current) fileInputRef.current.value = '';

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const payload = {

        title: form.title,

        description: form.description,

        category: form.category,

        price: parseFloat(form.price),

        quantity: parseFloat(form.quantity),

        unit: form.unit,

      };



      if (form.image_data) {

        payload.image_data = form.image_data;

      } else if (form.image_url.trim()) {

        payload.images = [form.image_url.trim()];

      }



      const res = await marketplaceApi.createProduct(payload);

      toast.success('পণ্য যোগ হয়েছে');

      navigate(`/app/market/products/${res.product.product_id}`);

    } catch (err) {

      toast.error(err.message);

    } finally {

      setLoading(false);

    }

  };



  return (

    <PageContainer maxWidth="max-w-2xl">

      <PageHeader

        title="পণ্য যোগ করুন"

        subtitle="ফসল, তাজা পণ্য, বীজ, সার বা কৃষি সরঞ্জাম — ছোট/মাঝারি পরিমাণে বিক্রি করুন"

      />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div>

          <Label required>পণ্যের নাম</Label>

          <input

            required

            value={form.title}

            onChange={(e) => set('title', e.target.value)}

            className={inputClass}

            placeholder="যেমন: তাজা টমেটো, উচ্চ ফলনশীল ধান, দেশি মধু"

          />

        </div>

        <div>

          <Label required>বিভাগ</Label>

          <select

            required

            value={form.category}

            onChange={(e) => set('category', e.target.value)}

            className={inputClass}

          >

            {MARKETPLACE_CATEGORY_GROUPS.map((group) => (

              <optgroup key={group.label} label={group.label}>

                {group.categories.map((c) => (

                  <option key={c} value={c}>

                    {c}

                  </option>

                ))}

              </optgroup>

            ))}

          </select>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>

            <Label required>মূল্য (৳)</Label>

            <input

              required

              type="number"

              min="1"

              value={form.price}

              onChange={(e) => set('price', e.target.value)}

              className={inputClass}

            />

          </div>

          <div>

            <Label required>পরিমাণ (স্টক)</Label>

            <input

              required

              type="number"

              min="1"

              step="any"

              value={form.quantity}

              onChange={(e) => set('quantity', e.target.value)}

              className={inputClass}

              placeholder="যেমন: ৫০"

            />

          </div>

        </div>

        <div>

          <Label required>একক</Label>

          <select

            required

            value={form.unit}

            onChange={(e) => set('unit', e.target.value)}

            className={inputClass}

          >

            {MARKETPLACE_UNITS.map(({ value, label }) => (

              <option key={value} value={value}>

                {label}

              </option>

            ))}

          </select>

          <p className="mt-1 text-xs text-slate-500">

            কেজি, মণ, ডজন ইত্যাদি — আপনি যে পরিমাণে বিক্রি করছেন

          </p>

        </div>

        <div>

          <Label>পণ্যের ছবি</Label>

          <div className="mt-1 space-y-3">

            <input

              ref={fileInputRef}

              type="file"

              accept="image/*"

              className="hidden"

              onChange={handleImageFile}

            />

            {form.image_preview ? (

              <div className="relative inline-block">

                <img

                  src={form.image_preview}

                  alt="পণ্যের ছবি প্রিভিউ"

                  className="h-24 w-24 rounded-xl border border-slate-200 object-cover"

                />

                <button

                  type="button"

                  onClick={clearUploadedImage}

                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"

                  title="ছবি সরান"

                >

                  <X size={14} aria-hidden />

                </button>

              </div>

            ) : null}

            <button

              type="button"

              onClick={() => fileInputRef.current?.click()}

              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50"

            >

              <Upload size={18} aria-hidden />

              ফাইল থেকে ছবি আপলোড করুন

            </button>

            <p className="text-center text-xs text-slate-500">অথবা লিঙ্ক দিন</p>

            <div className="relative">

              <Link2

                size={16}

                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"

              />

              <input

                type="url"

                value={form.image_url}

                onChange={(e) => handleImageUrlChange(e.target.value)}

                className={`${inputClass} mt-0 pl-10 font-mono text-xs sm:text-sm`}

                placeholder="https://..."

              />

            </div>

          </div>

        </div>

        <div>

          <Label>বিবরণ</Label>

          <textarea

            rows={4}

            value={form.description}

            onChange={(e) => set('description', e.target.value)}

            className={inputClass}

          />

        </div>

        <div className="flex gap-3">

          <Button type="submit" loading={loading} className="flex-1">

            প্রকাশ করুন

          </Button>

          <Link to="/app/market/seller">

            <Button type="button" variant="secondary">

              বাতিল

            </Button>

          </Link>

        </div>

      </form>

    </PageContainer>

  );

}

