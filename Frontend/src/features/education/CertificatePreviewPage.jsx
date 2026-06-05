import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { educationApi } from '../../shared/services/educationApi';
import { toast } from 'react-toastify';

export default function CertificatePreviewPage() {
  const { id } = useParams();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [certCode, setCertCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [htmlRes, metaRes] = await Promise.all([
        educationApi.previewCertificateHtml(id),
        educationApi.getCertificate(id),
      ]);
      setHtml(htmlRes);
      setCertCode(metaRes.certificate?.certificate_code || metaRes.certificate_code || '');
    } catch (e) {
      toast.error(e.message);
      setHtml('');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const download = async () => {
    try {
      const blob = await educationApi.downloadCertificatePdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certCode || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 size={32} className="animate-spin text-emerald-600" aria-hidden />
        <p>সনদপত্র লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-600">সনদপত্র প্রিভিউ লোড করা যায়নি</p>
        <Link to="/app/education/certificates" className="mt-4 inline-block text-emerald-700">
          ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Link
          to="/app/education/certificates"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"
        >
          <ArrowLeft size={16} aria-hidden />
          আমার সনদ
        </Link>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Download size={16} aria-hidden />
          PDF ডাউনলোড
        </button>
      </div>

      <iframe
        title="Certificate preview"
        srcDoc={html}
        className="block h-[calc(100vh-57px)] w-full border-0 bg-slate-100"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
