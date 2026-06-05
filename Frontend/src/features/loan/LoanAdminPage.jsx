import { useState } from 'react';
import { LayoutDashboard, Users, FileText, BarChart3 } from 'lucide-react';
import { cn } from '../../shared/lib/cn';
import { AdminPageShell } from '../admin/components/AdminPageShell';
import LoanAdminOverview from './admin/LoanAdminOverview';
import LoanAdminBorrowers from './admin/LoanAdminBorrowers';
import LoanAdminApplications from './admin/LoanAdminApplications';
import LoanAdminReports from './admin/LoanAdminReports';

const TABS = [
  { key: 'overview', label: 'ওভারভিউ', icon: LayoutDashboard },
  { key: 'borrowers', label: 'ঋণ গ্রহীতা', icon: Users },
  { key: 'applications', label: 'আবেদন', icon: FileText },
  { key: 'reports', label: 'রিপোর্ট', icon: BarChart3 },
];

export default function LoanAdminPage() {
  const [tab, setTab] = useState('overview');

  return (
    <AdminPageShell title="মাইক্রো লোন ব্যবস্থাপনা" subtitle="ঋণ বিতরণ, কিস্তি আদায় ও রিপোর্ট">
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition',
              tab === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <LoanAdminOverview />}
      {tab === 'borrowers' && <LoanAdminBorrowers />}
      {tab === 'applications' && <LoanAdminApplications />}
      {tab === 'reports' && <LoanAdminReports />}
    </AdminPageShell>
  );
}
