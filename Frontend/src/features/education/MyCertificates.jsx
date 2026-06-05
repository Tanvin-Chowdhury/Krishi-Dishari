import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Award, ArrowLeft, Download, Eye, Shield, Share2,
  CheckCircle, GraduationCap, Star, ChevronRight,
} from 'lucide-react';

import { educationApi } from '../../shared/services/educationApi';
import { toast } from 'react-toastify';

/* ─── Skeleton ───────────────────────────────────────────── */
function CertSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="h-36 w-48 flex-shrink-0 rounded-2xl bg-gray-100" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-2/5" />
          <div className="h-10 bg-gray-100 rounded-xl w-full mt-2" />
          <div className="flex gap-2 mt-3">
            <div className="h-10 bg-gray-100 rounded-xl w-24" />
            <div className="h-10 bg-gray-100 rounded-xl w-32" />
            <div className="h-10 bg-gray-100 rounded-xl w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Certificate card ───────────────────────────────────── */
function CertCard({ cert, onDownload, onPreview }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200">
      {/* Gold accent bar */}
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 rounded-l-2xl" />

      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        {/* Thumbnail */}
        <div className="flex-shrink-0 overflow-hidden rounded-2xl shadow-md">
          {cert.thumbnail_url ? (
            <img src={cert.thumbnail_url} alt="" className="h-36 w-48 object-cover" />
          ) : (
            <div className="flex h-36 w-48 flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-400 to-yellow-500 shadow-inner">
              <span className="text-5xl">🏆</span>
              <span className="text-xs font-bold text-amber-900 opacity-70">সার্টিফিকেট</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-extrabold text-gray-900 leading-snug line-clamp-2 text-base">
              {cert.course_title}
            </h3>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 flex-shrink-0">
              <CheckCircle size={13} className="text-emerald-600" />
              <span className="text-xs font-extrabold text-emerald-700">সম্পন্ন</span>
            </div>
          </div>

          <p className="mt-1.5 text-sm text-gray-500">👨‍🏫 {cert.instructor_name}</p>

          {/* Stars */}
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="fill-amber-400 text-amber-400" />)}
            <span className="ml-1.5 text-xs text-gray-400">কোর্স সম্পন্ন</span>
          </div>

          {/* Certificate code */}
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
            <Shield size={13} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs font-mono text-gray-500 truncate">{cert.certificate_code}</span>
          </div>

          {/* Issue date */}
          {cert.issued_at && (
            <p className="mt-2 text-xs text-gray-400">
              📅 {new Date(cert.issued_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => onPreview(cert.certificate_id)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition">
              <Eye size={15} /> প্রিভিউ
            </button>
            <button type="button" onClick={() => onDownload(cert.certificate_id, cert.certificate_code)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
              <Download size={15} /> PDF ডাউনলোড
            </button>
            <button type="button"
              onClick={() => {
                navigator.clipboard?.writeText(cert.certificate_code);
                toast.success('সার্টিফিকেট কোড কপি হয়েছে');
              }}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition">
              <Share2 size={15} /> শেয়ার
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function MyCertificates() {
  const navigate = useNavigate();
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    educationApi.myCertificates()
      .then(r => setCerts(r.certificates || []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, []);

  const download = async (id, code) => {
    try {
      const blob = await educationApi.downloadCertificatePdf(id);
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = `certificate-${code}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF ডাউনলোড শুরু হয়েছে');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openPreview = (id) => {
    const path = `/app/education/certificates/${id}/preview`;
    const win  = window.open(path, '_blank', 'noopener,noreferrer');
    if (!win) navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══ */}
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-sm flex-shrink-0">
                <Award size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">আমার সার্টিফিকেট</h1>
                <p className="text-xs text-gray-500">আপনার অর্জিত সনদপত্র দেখুন ও ডাউনলোড করুন</p>
              </div>
            </div>
            <Link to="/app/education"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition self-start sm:self-auto">
              <ArrowLeft size={13} /> ই-লার্নিং
            </Link>
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: Award,       label: 'মোট সার্টিফিকেট', value: certs.length, from: 'from-amber-500',   to: 'to-yellow-500' },
              { icon: Star,        label: 'গড় রেটিং',         value: '4.9',        from: 'from-purple-500', to: 'to-pink-500'   },
              { icon: Shield,      label: 'যাচাইযোগ্য সনদ',   value: certs.length, from: 'from-emerald-500',to: 'to-teal-500'   },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.from} ${s.to} p-3.5 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/80">{s.label}</p>
                    <p className="mt-0.5 text-xl font-extrabold text-white">{s.value}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
                    <s.icon className="text-white" style={{ width: 15, height: 15 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-3xl px-4 py-4">

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <CertSkeleton key={i} />)}
          </div>
        ) : certs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 py-24 text-center px-6">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-xl font-extrabold text-gray-800">এখনো কোনো সার্টিফিকেট নেই</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xs">
              কোর্স সম্পন্ন করলে স্বয়ংক্রিয়ভাবে সার্টিফিকেট তৈরি হবে এবং এখানে দেখা যাবে।
            </p>
            <Link to="/app/education"
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 transition">
              <GraduationCap size={16} /> কোর্স ব্রাউজ করুন <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Certificate list */}
            {certs.map(c => (
              <CertCard key={c.certificate_id} cert={c}
                onDownload={download} onPreview={openPreview} />
            ))}

            {/* Browse more */}
            <Link to="/app/education"
              className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 py-5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition mt-2">
              <GraduationCap size={16} /> আরো কোর্স করুন
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
