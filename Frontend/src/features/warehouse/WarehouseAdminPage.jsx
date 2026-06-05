import { useCallback, useEffect, useState } from 'react';
import {
  Warehouse, Plus, Pencil, Trash2, Power, CheckCircle2, XCircle, PlayCircle,
  CheckCheck, BarChart3, Boxes, TrendingUp, Clock, MapPin, Thermometer, Droplets,
  PackageCheck, Layers, X,
} from 'lucide-react';
import { warehouseApi } from '../../shared/services/warehouseApi';
import { WAREHOUSE_TYPES, STATUS_LABELS } from './warehouseConstants';
import { useWarehouseSocket } from './useWarehouseSocket';
import {
  AdminPageShell, StatCard, Badge, TableShell, ConfirmModal,
} from '../admin/components/AdminPageShell';

const TABS = [
  { id: 'reports', label: 'পরিসংখ্যান', icon: BarChart3 },
  { id: 'warehouses', label: 'গুদাম', icon: Warehouse },
  { id: 'bookings', label: 'বুকিং', icon: PackageCheck },
];

const BOOKING_STATUS_META = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-200 text-slate-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
  confirmed: 'bg-blue-100 text-blue-700',
};

const BOOKING_FILTERS = [
  { id: '', label: 'সকল' },
  { id: 'pending', label: 'অপেক্ষমাণ' },
  { id: 'approved', label: 'অনুমোদিত' },
  { id: 'active', label: 'চলমান' },
  { id: 'completed', label: 'সম্পন্ন' },
  { id: 'rejected', label: 'প্রত্যাখ্যাত' },
  { id: 'cancelled', label: 'বাতিল' },
];

const EMPTY_FORM = {
  name: '', location: '', district: '', capacity_ton: '', available_capacity_ton: '',
  daily_rate: '', monthly_rate: '', warehouse_type: 'dry_storage', description: '',
  photo_url: '', temperature_control: false, humidity_control: false, is_active: true,
};

const taka = (n) => `৳${Number(n || 0).toLocaleString('bn-BD')}`;
const num = (n) => Number(n || 0).toLocaleString('bn-BD');

export default function WarehouseAdminPage() {
  const [tab, setTab] = useState('reports');
  const [analytics, setAnalytics] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState(null); // { title, message, danger, onConfirm }
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const flash = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  };

  const loadCore = useCallback(async () => {
    setLoading(true);
    try {
      const [a, w] = await Promise.all([
        warehouseApi.adminAnalytics(),
        warehouseApi.adminList({ limit: 100 }),
      ]);
      setAnalytics(a.analytics);
      setWarehouses(w.warehouses || []);
    } catch {
      flash('error', 'তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const b = await warehouseApi.adminBookings(bookingFilter || undefined);
      setBookings(b.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [bookingFilter]);

  useEffect(() => { loadCore(); }, [loadCore]);
  useEffect(() => { loadBookings(); }, [loadBookings]);
  useWarehouseSocket(() => { loadCore(); loadBookings(); });

  // ---- Warehouse CRUD ----
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (w) => {
    setEditingId(w.id);
    setForm({
      name: w.title || '', location: w.location || '', district: w.district || '',
      capacity_ton: w.capacity ?? '', available_capacity_ton: w.available_capacity ?? '',
      daily_rate: w.price_per_day ?? '', monthly_rate: w.price_per_month || '',
      warehouse_type: w.warehouse_type || 'dry_storage', description: w.description || '',
      photo_url: w.photo_url || '', temperature_control: !!w.temperature_control,
      humidity_control: !!w.humidity_control, is_active: w.is_active !== false,
    });
    setFormOpen(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        district: form.district.trim() || null,
        warehouse_type: form.warehouse_type,
        description: form.description.trim() || null,
        photo_url: form.photo_url.trim() || null,
        capacity_ton: +form.capacity_ton,
        daily_rate: +form.daily_rate,
        monthly_rate: form.monthly_rate ? +form.monthly_rate : null,
        temperature_control: form.temperature_control,
        humidity_control: form.humidity_control,
      };
      if (editingId) {
        payload.is_active = form.is_active;
        if (form.available_capacity_ton !== '') payload.available_capacity_ton = +form.available_capacity_ton;
        await warehouseApi.adminUpdate(editingId, payload);
        flash('success', 'গুদাম হালনাগাদ হয়েছে');
      } else {
        await warehouseApi.adminCreate(payload);
        flash('success', 'নতুন গুদাম তৈরি হয়েছে');
      }
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      loadCore();
      setTab('warehouses');
    } catch (err) {
      flash('error', err?.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = (w) => {
    setConfirm({
      title: w.is_active ? 'গুদাম নিষ্ক্রিয় করবেন?' : 'গুদাম সক্রিয় করবেন?',
      message: w.is_active
        ? `"${w.title}" নিষ্ক্রিয় হলে ব্যবহারকারীরা আর বুক করতে পারবে না।`
        : `"${w.title}" আবার বুকিংয়ের জন্য উপলব্ধ হবে।`,
      confirmLabel: w.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন',
      onConfirm: async () => {
        try {
          await warehouseApi.adminUpdate(w.id, { is_active: !w.is_active });
          flash('success', 'স্ট্যাটাস হালনাগাদ হয়েছে');
          loadCore();
        } catch (err) {
          flash('error', err?.message || 'ব্যর্থ হয়েছে');
        }
        setConfirm(null);
      },
    });
  };

  const removeWarehouse = (w) => {
    setConfirm({
      title: 'গুদাম মুছবেন?',
      message: `"${w.title}" স্থায়ীভাবে মুছে ফেলা হবে। সক্রিয় বুকিং থাকলে মোছা যাবে না।`,
      confirmLabel: 'মুছে ফেলুন',
      danger: true,
      onConfirm: async () => {
        try {
          await warehouseApi.adminDelete(w.id);
          flash('success', 'গুদাম মুছে ফেলা হয়েছে');
          loadCore();
        } catch (err) {
          flash('error', err?.message || 'মোছা যায়নি');
        }
        setConfirm(null);
      },
    });
  };

  // ---- Booking lifecycle ----
  const approve = async (b) => {
    try {
      await warehouseApi.adminReview(b.booking_id || b.id, 'approve');
      flash('success', 'বুকিং অনুমোদিত হয়েছে');
      loadCore(); loadBookings();
    } catch (err) {
      flash('error', err?.message || 'অনুমোদন ব্যর্থ');
    }
  };

  const confirmReject = async () => {
    try {
      await warehouseApi.adminReview(rejectTarget.booking_id || rejectTarget.id, 'reject', rejectNote);
      flash('success', 'বুকিং প্রত্যাখ্যাত হয়েছে');
      setRejectTarget(null);
      setRejectNote('');
      loadBookings();
    } catch (err) {
      flash('error', err?.message || 'প্রত্যাখ্যান ব্যর্থ');
    }
  };

  const activate = async (b) => {
    try {
      await warehouseApi.adminActivate(b.booking_id || b.id);
      flash('success', 'ভাড়া সক্রিয় হয়েছে');
      loadBookings();
    } catch (err) {
      flash('error', err?.message || 'ব্যর্থ হয়েছে');
    }
  };

  const complete = async (b) => {
    try {
      await warehouseApi.adminComplete(b.booking_id || b.id);
      flash('success', 'ভাড়া সম্পন্ন হয়েছে');
      loadCore(); loadBookings();
    } catch (err) {
      flash('error', err?.message || 'ব্যর্থ হয়েছে');
    }
  };

  return (
    <AdminPageShell
      title="গুদাম ব্যবস্থাপনা"
      subtitle="গুদাম, বুকিং অনুরোধ ও ধারণক্ষমতা — সম্পূর্ণ নিয়ন্ত্রণ"
      icon={Warehouse}
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus size={16} /> নতুন গুদাম
        </button>
      }
    >
      {notice && (
        <div
          className={`mb-4 rounded-xl border px-4 py-2.5 text-sm font-medium ${
            notice.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'reports' && <ReportsTab analytics={analytics} loading={loading} />}

      {tab === 'warehouses' && (
        <WarehousesTab
          warehouses={warehouses}
          loading={loading}
          onEdit={openEdit}
          onToggle={toggleActive}
          onDelete={removeWarehouse}
        />
      )}

      {tab === 'bookings' && (
        <BookingsTab
          bookings={bookings}
          loading={bookingsLoading}
          filter={bookingFilter}
          setFilter={setBookingFilter}
          onApprove={approve}
          onReject={(b) => { setRejectTarget(b); setRejectNote(''); }}
          onActivate={activate}
          onComplete={complete}
        />
      )}

      {formOpen && (
        <WarehouseFormModal
          form={form}
          setForm={setForm}
          editing={!!editingId}
          saving={saving}
          onSubmit={submitForm}
          onClose={() => { setFormOpen(false); setEditingId(null); }}
        />
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />

      {rejectTarget && (
        <RejectModal
          booking={rejectTarget}
          note={rejectNote}
          setNote={setRejectNote}
          onConfirm={confirmReject}
          onCancel={() => { setRejectTarget(null); setRejectNote(''); }}
        />
      )}
    </AdminPageShell>
  );
}

/* ------------------------------ Reports ------------------------------ */
function ReportsTab({ analytics, loading }) {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }
  const chart = analytics.monthly_chart || [];
  const maxBookings = Math.max(1, ...chart.map((c) => c.bookings));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="মোট গুদাম" value={num(analytics.total_warehouses)} icon={Warehouse} accent="emerald" />
        <StatCard label="সক্রিয় গুদাম" value={num(analytics.active_warehouses)} icon={Power} accent="blue" />
        <StatCard label="খালি ক্ষমতা (টন)" value={num(analytics.available_capacity)} icon={Boxes} accent="violet" />
        <StatCard label="দখল" value={`${num(analytics.occupancy_rate)}%`} icon={Layers} accent="amber" />
        <StatCard label="অপেক্ষমাণ অনুরোধ" value={num(analytics.pending_bookings)} icon={Clock} accent="amber" />
        <StatCard label="আনু. আয়" value={taka(analytics.revenue_estimate)} icon={TrendingUp} accent="emerald" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
          <BarChart3 size={16} className="text-emerald-600" /> মাসিক বুকিং
        </h3>
        {chart.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">এখনো কোনো বুকিং তথ্য নেই</p>
        ) : (
          <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: 160 }}>
            {chart.map((c) => (
              <div key={c.month} className="flex min-w-[44px] flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold text-slate-700">{num(c.bookings)}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400"
                  style={{ height: `${Math.round((c.bookings / maxBookings) * 120)}px`, minHeight: 4 }}
                  title={`${c.bookings} বুকিং · ${taka(c.revenue)}`}
                />
                <span className="whitespace-nowrap text-[10px] text-slate-400">{c.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Warehouses ------------------------------ */
function WarehousesTab({ warehouses, loading, onEdit, onToggle, onDelete }) {
  return (
    <TableShell
      headers={['গুদাম', 'অবস্থান', 'ধারণক্ষমতা', 'মূল্য/দিন', 'স্ট্যাটাস', 'অ্যাকশন']}
      loading={loading}
      empty={!loading && warehouses.length === 0}
    >
      {warehouses.map((w) => {
        const used = Math.max(0, (w.capacity || 0) - (w.available_capacity || 0));
        const usedPct = w.capacity > 0 ? Math.round((used / w.capacity) * 100) : 0;
        return (
          <tr key={w.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-3">
              <p className="font-semibold text-slate-800">{w.title}</p>
              <p className="text-[11px] text-slate-400">{w.warehouse_type_label}</p>
            </td>
            <td className="px-4 py-3 text-slate-600">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} className="text-slate-400" /> {w.location}
              </span>
            </td>
            <td className="px-4 py-3 w-48">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>খালি {num(w.available_capacity)}/{num(w.capacity)} টন</span>
                <span>{usedPct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </td>
            <td className="px-4 py-3 font-medium text-slate-700">{taka(w.price_per_day)}</td>
            <td className="px-4 py-3">
              <Badge className={w.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}>
                {w.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <IconBtn title="সম্পাদনা" onClick={() => onEdit(w)} tone="slate"><Pencil size={15} /></IconBtn>
                <IconBtn title={w.is_active ? 'নিষ্ক্রিয়' : 'সক্রিয়'} onClick={() => onToggle(w)} tone="amber"><Power size={15} /></IconBtn>
                <IconBtn title="মুছুন" onClick={() => onDelete(w)} tone="red"><Trash2 size={15} /></IconBtn>
              </div>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

/* ------------------------------ Bookings ------------------------------ */
function BookingsTab({ bookings, loading, filter, setFilter, onApprove, onReject, onActivate, onComplete }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BOOKING_FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f.id ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          কোনো বুকিং নেই
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bookings.map((b) => (
            <div key={b.booking_id || b.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800">{b.warehouse_name}</p>
                  <p className="text-xs text-slate-500">{b.renter_name} · {b.renter_phone}</p>
                </div>
                <Badge className={BOOKING_STATUS_META[b.status] || 'bg-slate-100 text-slate-500'}>
                  {STATUS_LABELS[b.status] || b.status}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <Info label="সময়কাল" value={`${b.start_date} → ${b.end_date}`} />
                <Info label="পরিমাণ" value={`${num(b.quantity_ton)} টন`} />
                <Info label="পণ্য" value={b.product_type || '—'} />
                <Info label="মোট খরচ" value={taka(b.total_cost)} />
              </div>

              {b.admin_note && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                  নোট: {b.admin_note}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {b.status === 'pending' && (
                  <>
                    <ActionBtn onClick={() => onApprove(b)} tone="emerald" icon={CheckCircle2}>অনুমোদন</ActionBtn>
                    <ActionBtn onClick={() => onReject(b)} tone="red" icon={XCircle}>প্রত্যাখ্যান</ActionBtn>
                  </>
                )}
                {b.status === 'approved' && (
                  <>
                    <ActionBtn onClick={() => onActivate(b)} tone="blue" icon={PlayCircle}>সক্রিয় করুন</ActionBtn>
                    <ActionBtn onClick={() => onComplete(b)} tone="slate" icon={CheckCheck}>সম্পন্ন</ActionBtn>
                  </>
                )}
                {b.status === 'active' && (
                  <ActionBtn onClick={() => onComplete(b)} tone="slate" icon={CheckCheck}>সম্পন্ন করুন</ActionBtn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Form modal ------------------------------ */
function WarehouseFormModal({ form, setForm, editing, saving, onSubmit, onClose }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">{editing ? 'গুদাম সম্পাদনা' : 'নতুন গুদাম'}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="নাম *"><input className={INPUT} required value={form.name} onChange={set('name')} /></FormField>
            <FormField label="স্থান *"><input className={INPUT} required value={form.location} onChange={set('location')} /></FormField>
            <FormField label="জেলা"><input className={INPUT} value={form.district} onChange={set('district')} /></FormField>
            <FormField label="ধরন">
              <select className={INPUT} value={form.warehouse_type} onChange={set('warehouse_type')}>
                {WAREHOUSE_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="ক্ষমতা (টন) *"><input type="number" min="0" className={INPUT} required value={form.capacity_ton} onChange={set('capacity_ton')} /></FormField>
            {editing && (
              <FormField label="খালি ক্ষমতা (টন)"><input type="number" min="0" className={INPUT} value={form.available_capacity_ton} onChange={set('available_capacity_ton')} /></FormField>
            )}
            <FormField label="দৈনিক ভাড়া (৳) *"><input type="number" min="0" className={INPUT} required value={form.daily_rate} onChange={set('daily_rate')} /></FormField>
            <FormField label="মাসিক ভাড়া (৳)"><input type="number" min="0" className={INPUT} value={form.monthly_rate} onChange={set('monthly_rate')} /></FormField>
            <FormField label="ছবি URL" full><input className={INPUT} value={form.photo_url} onChange={set('photo_url')} placeholder="https://..." /></FormField>
            <FormField label="বিবরণ" full><textarea rows={2} className={INPUT} value={form.description} onChange={set('description')} /></FormField>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.temperature_control} onChange={setBool('temperature_control')} />
              <Thermometer size={14} className="text-slate-400" /> তাপমাত্রা নিয়ন্ত্রণ
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.humidity_control} onChange={setBool('humidity_control')} />
              <Droplets size={14} className="text-slate-400" /> আর্দ্রতা নিয়ন্ত্রণ
            </label>
            {editing && (
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.is_active} onChange={setBool('is_active')} />
                <Power size={14} className="text-slate-400" /> সক্রিয়
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">বাতিল</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? 'সংরক্ষণ...' : editing ? 'হালনাগাদ করুন' : 'তৈরি করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectModal({ booking, note, setNote, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">বুকিং প্রত্যাখ্যান</h3>
        <p className="mt-1 text-sm text-slate-500">{booking.warehouse_name} — {booking.renter_name}</p>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="প্রত্যাখ্যানের কারণ (ঐচ্ছিক)..."
          className={`mt-4 ${INPUT}`}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">বাতিল</button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">প্রত্যাখ্যান করুন</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Small bits ------------------------------ */
const INPUT = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100';

function FormField({ label, children, full }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-700">{value}</p>
    </div>
  );
}

const ICON_TONES = {
  slate: 'text-slate-500 hover:bg-slate-100',
  amber: 'text-amber-600 hover:bg-amber-50',
  red: 'text-red-600 hover:bg-red-50',
};
function IconBtn({ children, onClick, title, tone = 'slate' }) {
  return (
    <button type="button" title={title} onClick={onClick} className={`rounded-lg p-2 transition ${ICON_TONES[tone]}`}>
      {children}
    </button>
  );
}

const ACTION_TONES = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  red: 'bg-red-100 hover:bg-red-200 text-red-700',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  slate: 'bg-slate-700 hover:bg-slate-800 text-white',
};
function ActionBtn({ children, onClick, tone = 'emerald', icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${ACTION_TONES[tone]}`}
    >
      {Icon && <Icon size={14} />} {children}
    </button>
  );
}
