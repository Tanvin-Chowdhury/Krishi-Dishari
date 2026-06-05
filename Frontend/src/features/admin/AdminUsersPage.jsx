import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../shared/services/adminApi';
import {
  AdminPageShell,
  Badge,
  ConfirmModal,
  TableShell,
} from './components/AdminPageShell';
import { ROLES, bnDate } from './adminUtils';
import { cn } from '../../shared/lib/cn';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        search: search || undefined,
        role_id: roleFilter || undefined,
        is_active: statusFilter === '' ? undefined : statusFilter === 'active',
        limit: 50,
      });
      setUsers(res.users ?? res.data?.users ?? []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleStatus = async (user) => {
    try {
      await adminApi.updateUserStatus(user.user_id, !user.is_active);
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
      load();
    } catch (e) {
      toast.error(e.message);
    }
    setConfirm(null);
  };

  const changeRole = async (userId, role_id) => {
    try {
      await adminApi.updateUserRole(userId, +role_id);
      toast.success('ভূমিকা আপডেট হয়েছে');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AdminPageShell title="ব্যবহারকারী ব্যবস্থাপনা" subtitle="সকল ব্যবহারকারী দেখুন ও পরিচালনা করুন">
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="নাম, ইমেইল বা ফোন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">সব ভূমিকা</option>
          {Object.entries(ROLES).map(([id, r]) => (
            <option key={id} value={id}>{r.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">সব স্ট্যাটাস</option>
          <option value="active">সক্রিয়</option>
          <option value="inactive">নিষ্ক্রিয়</option>
        </select>
      </div>

      <TableShell
        loading={loading}
        empty={!loading && users.length === 0}
        headers={['ব্যবহারকারী', 'ভূমিকা', 'স্ট্যাটাস', 'যোগদান', 'কর্ম']}
      >
        {users.map((u) => {
          const role = ROLES[u.role_id] || ROLES[1];
          return (
            <tr key={u.user_id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{u.full_name}</p>
                <p className="text-xs text-slate-500">{u.email || u.phone}</p>
              </td>
              <td className="px-4 py-3">
                <select
                  value={u.role_id}
                  onChange={(e) => changeRole(u.user_id, e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                >
                  {Object.entries(ROLES).map(([id, r]) => (
                    <option key={id} value={id}>{r.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <Badge className={u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                  {u.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{bnDate(u.created_at)}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setConfirm(u)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-semibold',
                    u.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  )}
                >
                  {u.is_active ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
                </button>
              </td>
            </tr>
          );
        })}
      </TableShell>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.is_active ? 'অ্যাকাউন্ট নিষ্ক্রিয়?' : 'অ্যাকাউন্ট সক্রিয়?'}
        message={`${confirm?.full_name} — এই ব্যবহারকারীর স্ট্যাটাস পরিবর্তন করতে চান?`}
        danger={confirm?.is_active}
        confirmLabel="হ্যাঁ, পরিবর্তন করুন"
        onConfirm={() => toggleStatus(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </AdminPageShell>
  );
}
