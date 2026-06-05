import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { toast } from "react-toastify";
import { Gavel, ArrowLeft, Clock } from "lucide-react";
import api from "../../services/api";
import { AuthContext } from "../../Provider/AuthContext";
import PageContainer from "../../shared/ui/PageContainer";
import Card from "../../shared/design-system/Card";
import Button from "../../shared/design-system/Button";
import { Input, Label } from "../../shared/design-system/Form";
import {
  defaultDatetimeLocal,
  formatLocalPreview,
  parseAuctionEndTime,
} from "../../shared/lib/auctionDatetime";

const toDatetimeLocal = (iso) => {
  if (!iso) return defaultDatetimeLocal();
  const d = parseAuctionEndTime(iso);
  if (!d) return defaultDatetimeLocal();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EditAuction() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    unit: "কেজি",
    quantity: "",
    starting_price: "",
    min_increment: 50,
    end_time: defaultDatetimeLocal(),
    image_url: "",
  });

  useEffect(() => {
    if (user?.role_id !== 1) {
      navigate("/app/auctions");
      return;
    }
    api
      .getAuction(id)
      .then((res) => {
        if (!res.success) throw new Error(res.message);
        const a = res.auction;
        if (a.seller_id !== user.user_id) throw new Error("অনুমতি নেই");
        setForm({
          title: a.product_name || "",
          unit: a.unit || "কেজি",
          quantity: a.quantity || "",
          starting_price: String(a.starting_price),
          min_increment: a.min_increment || 50,
          end_time: toDatetimeLocal(a.end_time),
          image_url: a.images?.[0]?.url || "",
        });
      })
      .catch((err) => {
        toast.error(err.message || "নিলাম লোড ব্যর্থ");
        navigate("/app/my-auctions");
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endUtc = new Date(form.end_time);
    if (Number.isNaN(endUtc.getTime()) || endUtc.getTime() <= Date.now()) {
      return toast.error("নিলাম শেষ হওয়ার সময় ভবিষ্যতে হতে হবে");
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        unit: form.unit,
        quantity: form.quantity,
        end_time: endUtc.toISOString(),
        starting_price: parseFloat(form.starting_price),
        min_increment: parseFloat(form.min_increment),
        images: form.image_url.trim() ? [form.image_url.trim()] : undefined,
      };

      const res = await api.updateAuction(id, payload);
      if (!res.success) throw new Error(res.message);
      toast.success("নিলাম আপডেট হয়েছে");
      navigate(`/app/auctions/${id}`);
    } catch (err) {
      toast.error(err.message || "আপডেট ব্যর্থ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-2xl">
        <div className="animate-pulse h-96 rounded-2xl bg-slate-100" />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="max-w-2xl">
      <Link
        to={`/app/auctions/${id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft size={15} /> বিস্তারিত
      </Link>

      <Card className="!p-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">
          নিলাম সম্পাদনা
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="পণ্যের নাম"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <Input
            label="পরিমাণ"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            required
          />
          <Input
            label="একক"
            name="unit"
            value={form.unit}
            onChange={handleChange}
          />
          <Input
            label="শুরুর মূল্য (৳)"
            name="starting_price"
            type="number"
            value={form.starting_price}
            onChange={handleChange}
            required
          />
          <Input
            label="ছবির URL"
            name="image_url"
            type="url"
            value={form.image_url}
            onChange={handleChange}
          />
          <div>
            <Label htmlFor="end_time" required>
              <span className="inline-flex items-center gap-2">
                <Clock size={14} className="text-emerald-600" />
                নিলাম শেষ হওয়ার সময়
              </span>
            </Label>
            <input
              id="end_time"
              name="end_time"
              type="datetime-local"
              value={form.end_time}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200/80 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {formatLocalPreview(form.end_time) && (
              <p className="mt-2 text-xs text-slate-500">
                {formatLocalPreview(form.end_time)}
              </p>
            )}
          </div>
          <Button
            type="submit"
            loading={saving}
            className="w-full"
            icon={Gavel}
          >
            সংরক্ষণ করুন
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
