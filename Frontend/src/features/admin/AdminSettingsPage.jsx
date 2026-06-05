import { useContext } from 'react';
import { AuthContext } from '../../core/auth/AuthContext';
import { AdminPageShell } from './components/AdminPageShell';

export default function AdminSettingsPage() {
  const { user } = useContext(AuthContext);

  return (
    <AdminPageShell title="অ্যাডমিন সেটিংস" subtitle="প্ল্যাটফর্ম কনফিগারেশন">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">অ্যাডমিন অ্যাকাউন্ট</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">নাম</dt>
            <dd className="font-medium">{user?.full_name || '—'}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">ইমেইল</dt>
            <dd className="font-medium">{user?.email || '—'}</dd>
          </div>
          <div className="flex justify-between pb-2">
            <dt className="text-slate-500">ভূমিকা</dt>
            <dd className="font-medium">অ্যাডমিন</dd>
          </div>
        </dl>

        <div className="mt-8 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">অ্যাডমিন সীমাবদ্ধতা</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>অ্যাডমিন নিলামে বিড করতে পারবেন না</li>
            <li>কৃষক নিলাম তৈরি করতে পারবেন না</li>
            <li>মার্কেটপ্লেসে সাধারণ ক্রেতা/বিক্রেতা হিসেবে কাজ করা সীমিত</li>
          </ul>
        </div>
      </div>
    </AdminPageShell>
  );
}
