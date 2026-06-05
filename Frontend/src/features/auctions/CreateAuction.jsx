import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { toast } from "react-toastify";
import {
  Gavel,
  Sparkles,
  Package,
  Coins,
  ImageIcon,
  Clock,
  Link2,
  Upload,
  X,
} from "lucide-react";
import { fileToDataUrl } from "../../shared/lib/fileToDataUrl";
import { resolveMediaUrl } from "../../shared/lib/mediaUrl";
import api from "../../services/api";
import { AuthContext } from "../../core/auth/AuthContext";
import PageContainer from "../../shared/ui/PageContainer";
import Button from "../../shared/design-system/Button";
import { Label } from "../../shared/design-system/Form";
import {
  defaultDatetimeLocal,
  datetimeLocalToSql,
  formatLocalPreview,
  formatDurationPreview,
  remainingMsUntilLocal,
  validateLocalEndTime,
  minDatetimeLocalValue,
  maxDatetimeLocalValue,
} from "../../shared/lib/auctionDatetime";

const UNITS = ["কেজি", "মণ", "টি", "লিটার", "বস্তা"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10";

const cardClass =
  "rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-slate-900/[0.04] sm:p-7";

function previewImageSrc(form) {
  if (form.image_preview) return form.image_preview;
  const url = form.image_url.trim();
  if (!url) return null;
  return resolveMediaUrl(url) || url;
}

function LivePreviewCard({ form, remaining, endPreview }) {
  const title = form.title.trim() || "পণ্যের নাম এখানে দেখাবে";
  const quantity = form.quantity ? `${form.quantity} ${form.unit}` : "—";
  const price = form.starting_price
    ? `৳${Number(form.starting_price).toLocaleString("bn-BD")}`
    : "৳—";
  const previewSrc = previewImageSrc(form);

  return (
    <aside className="lg:sticky lg:top-6 lg:col-span-1">
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-emerald-900/5">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="animate-bounce rounded-2xl bg-white/80 p-4 shadow-inner ring-1 ring-slate-200/80">
                <ImageIcon size={36} className="text-emerald-500/70" />
              </div>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200/80">
                <div className="h-full w-1/2 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-white/90 to-transparent" />
              </div>
            </div>
          )}

          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            লাইভ প্রিভিউ
          </span>
        </div>

        <div className="space-y-3 p-5">
          <h3 className="line-clamp-2 text-base font-bold text-slate-900">
            {title}
          </h3>
          {form.description.trim() ? (
            <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
              {form.description.trim()}
            </p>
          ) : (
            <p className="text-xs italic text-slate-400">
              পণ্যের বিবরণ এখানে দেখাবে
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">পরিমাণ</span>
            <span className="font-semibold text-slate-800">{quantity}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">শুরুর মূল্য</span>
            <span className="text-lg font-black text-emerald-600">{price}</span>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800/70">
              নিলাম শেষ
            </p>
            {endPreview && (
              <p className="mt-0.5 text-xs font-medium text-slate-700">
                {endPreview}
              </p>
            )}
            <p className="mt-1 text-lg font-black tabular-nums text-amber-700">
              {formatDurationPreview(remaining)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function CreateAuction() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    quantity: "",
    unit: "কেজি",
    starting_price: "",
    image_url: "",
    image_preview: "",
    image_data: "",
    end_time: defaultDatetimeLocal(),
  });

  const minLocal = minDatetimeLocalValue();
  const maxLocal = maxDatetimeLocalValue();

  if (user && user.role_id !== 1) {
    return <Navigate to="/app/auctions" replace />;
  }

  useEffect(() => {
    const tick = () => setRemaining(remainingMsUntilLocal(form.end_time));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [form.end_time]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ছবি ফাইল নির্বাচন করুন");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("ছবির আকার 4 MB এর কম হতে হবে");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({
        ...f,
        image_data: dataUrl,
        image_preview: dataUrl,
        image_url: "",
      }));
    } catch {
      toast.error("ছবি পড়া যায়নি");
    }
  };

  const clearUploadedImage = () => {
    setForm((f) => ({ ...f, image_data: "", image_preview: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageUrlChange = (value) => {
    setForm((f) => ({
      ...f,
      image_url: value,
      image_data: "",
      image_preview: value.trim()
        ? resolveMediaUrl(value.trim()) || value.trim()
        : "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("লগইন প্রয়োজন");

    if (!form.title.trim()) return toast.error("পণ্যের নাম দিন");
    if (!form.quantity.trim()) return toast.error("পরিমাণ দিন");
    if (!form.starting_price || parseFloat(form.starting_price) <= 0) {
      return toast.error("শুরুর মূল্য দিন");
    }
    if (!form.end_time) return toast.error("নিলাম শেষ হওয়ার সময় দিন");

    const timeCheck = validateLocalEndTime(form.end_time);
    if (!timeCheck.ok) return toast.error(timeCheck.message);

    const endTimeSql = datetimeLocalToSql(form.end_time);
    if (!endTimeSql) return toast.error("সময় বৈধ নয়");

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        quantity: form.quantity.trim(),
        unit: form.unit,
        starting_price: parseFloat(form.starting_price),
        end_time: endTimeSql,
        image_url: form.image_data
          ? undefined
          : form.image_url.trim() || undefined,
        image_data: form.image_data || undefined,
      };

      const res = await api.createAuction(payload);
      if (!res.success) throw new Error(res.message);

      toast.success(res.message || "নিলাম প্রকাশ হয়েছে!");
      navigate(`/app/auctions/${res.auction.auction_id}`);
    } catch (err) {
      toast.error(err.message || "নিলাম তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const endPreview = formatLocalPreview(form.end_time);

  return (
    <PageContainer maxWidth="max-w-6xl">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-emerald-900/5">
        {/* Hero banner */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-10 text-white sm:px-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggIGQ9Ik0zNiAzNGg2djZoLTZ6TTAgMzRoNnY2SDB6TTAgMGg2djZIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 transition-transform duration-300 hover:scale-105">
              <Sparkles size={28} className="text-amber-200" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                নিলাম প্রকাশ
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-emerald-50/90 sm:text-base">
                প্ণ্য, মূল্য ও সময়সূচি এক জায়গায়। সর্বোচ্চ ৭ দিনের নিলাম।
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-50/60 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* ZONE A — Product details */}
            <section className={`${cardClass} lg:col-span-2`}>
              <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
                <Package size={16} />
                পণ্যের বিবরণ
              </h2>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="title" required>
                    পণ্যের নাম
                  </Label>
                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    required
                    placeholder="যেমন: উচ্চ ফলনশীল জৈব ধান — সরাসরি ক্ষেত থেকে"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <Label htmlFor="description">পণ্যের বিবরণ</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="যেমন: জৈব চাষ, ফসলের গুণমান, সংগ্রহের সময়, পরিবহনের শর্ত ইত্যাদি"
                    className={`${inputClass} mt-1.5 resize-y min-h-[100px]`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    ক্রেতারা নিলামে বিড করার আগে এই তথ্য দেখবেন
                  </p>
                </div>

                <div>
                  <Label required>পরিমাণ এবং একক</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      step="any"
                      value={form.quantity}
                      onChange={(e) => setField("quantity", e.target.value)}
                      required
                      placeholder="৫০"
                      className={inputClass}
                    />
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={(e) => setField("unit", e.target.value)}
                      className={`${inputClass} min-w-[6.5rem] cursor-pointer`}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image_url">পণ্যের ছবি</Label>
                  <div className="mt-1.5 space-y-3">
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
                    <p className="text-center text-xs text-slate-500">
                      অথবা লিঙ্ক দিন
                    </p>
                    <div className="relative">
                      <Link2
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="image_url"
                        name="image_url"
                        type="url"
                        value={form.image_url}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder="https://example.com/your-product-photo.jpg"
                        className={`${inputClass} pl-10 font-mono text-xs sm:text-sm`}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="starting_price" required>
                    মূল্য / শুরুর মূল্য
                  </Label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                      ৳
                    </span>
                    <input
                      id="starting_price"
                      name="starting_price"
                      type="number"
                      min="1"
                      step="1"
                      value={form.starting_price}
                      onChange={(e) =>
                        setField("starting_price", e.target.value)
                      }
                      required
                      placeholder="৫,০০০"
                      className={`${inputClass} pl-12`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ZONE B — Pricing & schedule */}
            <section className={`${cardClass} lg:col-span-2`}>
              <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
                <Coins size={16} />
                সময়সূচি
              </h2>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="end_time" required>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} className="text-emerald-600" />
                      নিলাম শেষ হওয়ার সময়
                    </span>
                  </Label>
                  <input
                    id="end_time"
                    name="end_time"
                    type="datetime-local"
                    value={form.end_time}
                    min={minLocal}
                    max={maxLocal}
                    onChange={(e) => setField("end_time", e.target.value)}
                    required
                    className={`${inputClass} mt-1.5`}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    সর্বোচ্চ ৭ দিন পর্যন্ত নিলাম চালু রাখতে পারবেন
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  type="submit"
                  loading={loading}
                  icon={Gavel}
                  className="w-full py-3.5 text-base shadow-lg shadow-emerald-200/50 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  নিলাম প্রকাশ করুন
                </Button>
              </div>
            </section>

            {/* ZONE C — Live preview */}
            <LivePreviewCard
              form={form}
              remaining={remaining}
              endPreview={endPreview}
            />
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
