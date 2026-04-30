'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/ui/StatsCard';

type Stats = {
  total_companies: number;
  active_subscriptions: number;
  pending_approvals: number;
  monthly_revenue: number | null;
};

type PendingApproval = {
  registration_id: string; company_name: string; email: string;
  industry: string; subscription_plan: string; billing_cycle: string; registered_date: string;
};

export default function DashboardPage() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: pending = [], isLoading } = useQuery<PendingApproval[]>({
    queryKey: ['dashboard', 'pending-approvals'],
    queryFn: () => api.get('/dashboard/pending-approvals').then(r => r.data),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Companies" value={stats?.total_companies ?? '—'} />
        <StatsCard title="Active Subscriptions" value={stats?.active_subscriptions ?? '—'} />
        <StatsCard
          title="Pending Approvals"
          value={stats?.pending_approvals ?? '—'}
          className={stats?.pending_approvals && stats.pending_approvals > 0 ? 'border-yellow-300' : ''}
        />
        <StatsCard
          title="Monthly Revenue"
          value={stats?.monthly_revenue != null ? `₱${stats.monthly_revenue.toLocaleString()}` : '—'}
          subtitle="Payment integration pending"
        />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">
          Pending Approvals
          {stats?.pending_approvals ? (
            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {stats.pending_approvals}
            </span>
          ) : null}
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Company','Email','Industry','Plan','Billing','Registered'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading…</td></tr>
              ) : pending.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No pending approvals</td></tr>
              ) : pending.map(p => (
                <tr key={p.registration_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.company_name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.email}</td>
                  <td className="px-4 py-3 text-slate-600">{p.industry}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{p.subscription_plan}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{p.billing_cycle}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.registered_date ? new Date(p.registered_date).toLocaleDateString('en-PH') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          To approve/provision: go to <a href="/super-admin/companies" className="text-blue-500 hover:underline">Companies</a> and use the Provision action.
        </p>
      </div>
    </div>
  );
}
