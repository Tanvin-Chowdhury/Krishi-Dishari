import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { educationApi } from '../../shared/services/educationApi';

export default function CertificateVerify() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    educationApi
      .verifyCertificate(code)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
        <Award className="mx-auto text-emerald-600" size={40} aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-slate-900">সনদপত্র যাচাই</h1>

        {loading && <p className="mt-6 text-slate-500">যাচাই হচ্ছে...</p>}

        {!loading && error && (
          <>
            <XCircle className="mx-auto mt-6 text-red-500" size={48} aria-hidden />
            <p className="mt-4 text-red-600">{error}</p>
          </>
        )}

        {!loading && data?.valid && (
          <>
            <CheckCircle className="mx-auto mt-6 text-emerald-500" size={48} aria-hidden />
            <p className="mt-4 font-semibold text-emerald-800">বৈধ সনদপত্র</p>
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-sm space-y-2">
              <p>
                <span className="text-slate-500">নাম:</span>{' '}
                <strong>{data.certificate.user_name}</strong>
              </p>
              <p>
                <span className="text-slate-500">কোর্স:</span>{' '}
                <strong>{data.certificate.course_title}</strong>
              </p>
              <p>
                <span className="text-slate-500">ইন্সট্রাক্টর:</span>{' '}
                {data.certificate.instructor_name}
              </p>
              <p>
                <span className="text-slate-500">তারিখ:</span>{' '}
                {new Date(data.certificate.issued_at).toLocaleDateString('bn-BD')}
              </p>
              <p className="font-mono text-xs text-slate-600">
                {data.certificate.certificate_code}
              </p>
            </div>
          </>
        )}

        <Link
          to="/"
          className="mt-8 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          কৃষি-দিশারী হোম
        </Link>
      </div>
    </div>
  );
}
