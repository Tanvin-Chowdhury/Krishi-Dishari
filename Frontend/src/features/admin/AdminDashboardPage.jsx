import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Users,
  Gavel,
  ShoppingBag,
  Warehouse,
  HardHat,
  CreditCard,
  Shield,
  BarChart3,
  Activity,
  Newspaper,
} from 'lucide-react';
import { AuthContext } from '../../Provider/AuthContext';
import { adminApi } from '../../shared/services/adminApi';
import DashboardPageShell from '../../shared/dashboard/DashboardPageShell';
import DashboardHero from '../../shared/dashboard/DashboardHero';
import { DashboardGrid } from '../../shared/dashboard/DashboardShell';
import StatsGrid from '../../shared/dashboard/StatsGrid';
import NextStepsStrip from '../../shared/dashboard/NextStepsStrip';
import ActivityTimeline from '../../shared/dashboard/ActivityTimeline';
import InsightCard from '../../shared/dashboard/InsightCard';
import MiniBarChart from '../../shared/dashboard/MiniBarChart';
import { ROLE_THEMES } from '../../shared/dashboard/roleThemes';
import { getAdminNextSteps } from '../../shared/dashboard/roleNextSteps';
import { DashboardStatsSkeleton } from '../../shared/design-system/Skeleton';
import { EMPTY } from '../../shared/ui/emptyStatePresets';
import {
  LiveAuctionPreview,
  LiveMarketplacePreview,
} from '../../shared/dashboard/live/LiveDashboardSections';
import { bn } from './adminUtils';

export default function AdminDashboardPage() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = ROLE_THEMES.admin;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboardStats();
      setStats(res.stats ?? res.data?.stats);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const u = stats?.users || {};
  const a = stats?.auctions || {};
  const p = stats?.products || {};

  const statItems = useMemo(
    () =>
      stats
        ? [
            {
              key: 'users',
              label: 'মোট ব্যবহারকারী',
              value: bn(u.total),
              icon: Users,
              accent: 'emerald',
              status: 'good',
              trend: `${bn(u.farmers)} কৃষক · ${bn(u.wholesalers)} পাইকার`,
            },
            {
              key: 'auctions',
              label: 'সক্রিয় নিলাম',
              value: bn(a.active),
              icon: Gavel,
              accent: 'blue',
              status: (a.active ?? 0) > 0 ? 'good' : 'neutral',
              trend: `মোট ${bn(a.total)} নিলাম`,
              href: '/app/admin/auctions',
            },
            {
              key: 'orders',
              label: 'মার্কেট অর্ডার',
              value: bn(stats.orders?.total),
              icon: ShoppingBag,
              accent: 'emerald',
              status: 'neutral',
              trend: `${bn(p.active)} সক্রিয় পণ্য`,
              href: '/app/admin/marketplace',
            },
            {
              key: 'loans',
              label: 'ঋণ (অপেক্ষমাণ)',
              value: bn(stats.loans?.pending),
              icon: CreditCard,
              accent: 'purple',
              status: (stats.loans?.pending ?? 0) > 0 ? 'warn' : 'good',
              trend: 'অনুমোদন প্রয়োজন',
              href: '/app/admin/loans',
            },
            {
              key: 'warehouse',
              label: 'গুদাম বুকিং',
              value: bn(stats.warehouse_bookings?.active),
              icon: Warehouse,
              accent: 'teal',
              status: 'neutral',
              href: '/app/admin/warehouses',
            },
            {
              key: 'reports',
              label: 'মডারেশন',
              value: bn(stats.moderation?.pending),
              icon: Shield,
              accent: 'amber',
              status: (stats.moderation?.pending ?? 0) > 0 ? 'alert' : 'good',
              trend: 'অপেক্ষমাণ রিপোর্ট',
              href: '/app/admin/reports',
            },
            {
              key: 'news-review',
              label: 'নিবন্ধ পর্যালোচনা',
              value: bn(stats.news?.pending_review),
              icon: Newspaper,
              accent: 'purple',
              status: (stats.news?.pending_review ?? 0) > 0 ? 'warn' : 'good',
              trend: 'বিশেষজ্ঞের জমা দেওয়া নিবন্ধ',
              href: '/app/admin/news?status=pending_review',
            },
          ]
        : [],
    [stats, u, a, p]
  );

  const nextSteps = useMemo(() => getAdminNextSteps(stats), [stats]);

  const roleChart = (u.by_role || []).map((r) => ({ label: r.role_name, value: r.count }));
  const auctionChart = [
    { label: 'সক্রিয়', value: a.active ?? 0 },
    { label: 'সম্পন্ন', value: a.completed ?? 0 },
    { label: 'বাতিল', value: a.cancelled ?? 0 },
  ];

  return (
    <DashboardPageShell>
      <DashboardHero
        user={user}
        theme={theme}
        subtitle="প্ল্যাটফর্ম স্বাস্থ্য, মডারেশন ও ব্যবসায়িক KPI।"
        primaryCta={{ label: 'বিস্তারিত অ্যানালিটিক্স', to: '/app/admin/stats' }}
      />

      {loading ? (
        <DashboardStatsSkeleton count={7} />
      ) : stats ? (
        <>
          <StatsGrid items={statItems} columns={3} className="lg:grid-cols-3 xl:grid-cols-6" />

          <NextStepsStrip steps={nextSteps} title="অ্যাডমিন অগ্রাধিকার" />

          <DashboardGrid
            main={
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <InsightCard title="ব্যবহারকারী বিতরণ" description="ভূমিকা অনুযায়ী">
                    <MiniBarChart items={roleChart} color="bg-emerald-500" />
                  </InsightCard>
                  <InsightCard title="নিলাম সারাংশ" description="স্ট্যাটাস অনুযায়ী">
                    <MiniBarChart items={auctionChart} color="bg-blue-500" />
                  </InsightCard>
                </div>

                <InsightCard
                  title="প্ল্যাটফর্ম কার্যকলাপ"
                  description="লাইভ নিলাম ও মার্কেটপ্লেস থেকে সর্বশেষ"
                >
                  <LiveAuctionPreview variant="tailwind" />
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <LiveMarketplacePreview variant="tailwind" limit={4} />
                  </div>
                </InsightCard>

                <ActivityTimeline accent="emerald" />
              </>
            }
            sidebar={
              <InsightCard title="সিস্টেম স্বাস্থ্য" description="ভূমিকা ভিত্তিক সারাংশ">
                <ul className="space-y-2">
                  {[
                    { label: 'কৃষক', value: bn(u.farmers), cls: 'bg-emerald-50 text-emerald-800' },
                    { label: 'পাইকার', value: bn(u.wholesalers), cls: 'bg-blue-50 text-blue-800' },
                    { label: 'পরামর্শদাতা', value: bn(u.consultants), cls: 'bg-purple-50 text-purple-800' },
                    { label: 'শ্রমিক', value: bn(u.labors), cls: 'bg-amber-50 text-amber-800' },
                    { label: 'শ্রম অনুরোধ', value: bn(stats.labor_requests?.active), cls: 'bg-orange-50 text-orange-800' },
                  ].map((row) => (
                    <li key={row.label} className={`flex justify-between rounded-xl px-4 py-3 text-sm ${row.cls}`}>
                      <span className="font-medium opacity-80">{row.label}</span>
                      <span className="font-bold tabular-nums">{row.value}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app/admin/stats"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Activity size={14} /> সম্পূর্ণ রিপোর্ট
                </Link>
              </InsightCard>
            }
            showDefaultSidebar={false}
          />
        </>
      ) : (
        EMPTY.admin({
          title: 'ডেটা লোড করা যায়নি',
          description: 'সার্ভার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
          onAction: load,
          actionLabel: 'আবার চেষ্টা',
        })
      )}
    </DashboardPageShell>
  );
}
