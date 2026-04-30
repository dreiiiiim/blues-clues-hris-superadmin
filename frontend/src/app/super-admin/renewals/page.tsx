'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Renewal = {
  registration_id: string; company_id: string; company_name: string;
  subscription_plan: string; end_date: string; days_remaining: number;
  renewal_status: 'Upcoming' | 'Due Soon' | 'Expired'; email: string;
};

export default function RenewalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [renewModal, setRenewModal] = useState<Renewal | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const { data: renewals = [], isLoading } = useQuery({
    queryKey: ['renewals', filter],
    queryFn: () => api.get('/renewals', { params: filter ? { status: filter } : {} }).then(r => r.data),
  });

  const remind = useMutation({
    mutationFn: (id: string) => api.post(`/renewals/${id}/remind`),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to send reminder');
    },
  });

  const markRenewed = useMutation({
    mutationFn: ({ id, bc }: { id: string; bc: 'monthly' | 'annual' }) =>
      api.patch(`/renewals/${id}/mark-renewed`, { billing_cycle: bc }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['renewals'] }); setRenewModal(null); },
  });

  const suspend = useMutation({
    mutationFn: (id: string) => api.patch(`/renewals/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['renewals'] }),
  });

  const filters = [
    { label: 'All', value: '' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Due Soon', value: 'due_soon' },
    { label: 'Expired', value: 'expired' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Renewals</h1>

      {/* Filter tabs */}
      <div className="flex gap-3 mb-4">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === f.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Company','Plan','End Date','Days Left','Renewal Status','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading…</td></tr>
            ) : (renewals as Renewal[]).length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">No renewals found</td></tr>
            ) : (renewals as Renewal[]).map(r => (
              <tr key={r.registration_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.company_name}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{r.subscription_plan}</td>
                <td className="px-4 py-3 text-slate-600">{r.end_date ? new Date(r.end_date).toLocaleDateString('en-PH') : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${r.days_remaining < 0 ? 'text-red-600' : r.days_remaining <= 30 ? 'text-orange-500' : 'text-slate-700'}`}>
                    {r.days_remaining < 0 ? 'Expired' : `${r.days_remaining}d`}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.renewal_status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (confirm(`Send renewal reminder to ${r.email}?`)) remind.mutate(r.registration_id); }}
                      disabled={remind.isPending}
                      className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 text-xs rounded-lg hover:bg-blue-100 disabled:opacity-50">
                      Remind
                    </button>
                    <button
                      onClick={() => { setRenewModal(r); setBillingCycle('monthly'); }}
                      className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs rounded-lg hover:bg-green-100">
                      Renew
                    </button>
                    <button
                      onClick={() => { if (confirm(`Suspend ${r.company_name}? This will block user logins.`)) suspend.mutate(r.registration_id); }}
                      className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 text-xs rounded-lg hover:bg-red-100">
                      Suspend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mark Renewed Modal */}
      {renewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Mark as Renewed</h2>
            <p className="text-sm text-slate-500 mb-4">{renewModal.company_name}</p>
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">Billing Cycle</label>
              <div className="flex gap-3">
                {(['monthly', 'annual'] as const).map(bc => (
                  <label key={bc} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={bc} checked={billingCycle === bc}
                      onChange={() => setBillingCycle(bc)} className="text-blue-600" />
                    <span className="text-sm capitalize">{bc}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Sets payment_date to today — next renewal date calculated from now.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRenewModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => markRenewed.mutate({ id: renewModal.registration_id, bc: billingCycle })}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
