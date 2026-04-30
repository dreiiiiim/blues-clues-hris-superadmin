'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Subscription = {
  registration_id: string; company_name: string; subscription_plan: string;
  billing_cycle: string; subscription_status: string; payment_status: string;
  start_date: string; end_date: string; transaction_id: string;
};

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', billing_cycle: '', page: 1 });
  const [statusModal, setStatusModal] = useState<Subscription | null>(null);
  const [historyDrawer, setHistoryDrawer] = useState<Subscription | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: () => api.get('/subscriptions', { params: filters }).then(r => r.data),
  });

  const { data: history } = useQuery({
    queryKey: ['payment-history', historyDrawer?.registration_id],
    queryFn: () => api.get(`/subscriptions/${historyDrawer!.registration_id}/payment-history`).then(r => r.data),
    enabled: !!historyDrawer,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/subscriptions/${id}/status`, { subscription_status: status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); setStatusModal(null); },
  });

  const subs: Subscription[] = data?.data ?? [];
  const statuses = ['Active', 'Pending', 'Suspended', 'Expired'];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Subscriptions</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilters(f => ({ ...f, status: f.status === s ? '' : s, page: 1 }))}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filters.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}>{s}</button>
        ))}
        <select value={filters.billing_cycle}
          onChange={e => setFilters(f => ({ ...f, billing_cycle: e.target.value, page: 1 }))}
          className="ml-auto border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All billing cycles</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Company','Plan','Billing','Status','Payment','Start','End','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">Loading…</td></tr>
            ) : subs.map(s => (
              <tr key={s.registration_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.company_name}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{s.subscription_plan}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{s.billing_cycle}</td>
                <td className="px-4 py-3"><StatusBadge status={s.subscription_status} /></td>
                <td className="px-4 py-3"><StatusBadge status={s.payment_status} /></td>
                <td className="px-4 py-3 text-slate-600">{s.start_date ? new Date(s.start_date).toLocaleDateString('en-PH') : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{s.end_date ? new Date(s.end_date).toLocaleDateString('en-PH') : '—'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setStatusModal(s); setNewStatus(s.subscription_status); }}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200">
                    Change Status
                  </button>
                  <button onClick={() => setHistoryDrawer(s)}
                    className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 text-xs rounded-lg hover:bg-blue-100">
                    History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Change Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Change Status</h2>
            <p className="text-sm text-slate-500 mb-4">{statusModal.company_name}</p>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStatusModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={() => updateStatus.mutate({ id: statusModal.registration_id, status: newStatus })}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Drawer */}
      {historyDrawer && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Payment History</h2>
            <button onClick={() => setHistoryDrawer(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <p className="text-sm font-medium text-slate-700 mb-4">{historyDrawer.company_name}</p>
            {history?.records?.map((r: { subscription_plan: string; billing_cycle: string; payment_status: string; payment_date: string; transaction_id: string }, i: number) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="font-medium capitalize">{r.subscription_plan}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Billing</span><span className="capitalize">{r.billing_cycle}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Payment</span><StatusBadge status={r.payment_status} /></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{r.payment_date ? new Date(r.payment_date).toLocaleDateString('en-PH') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Transaction ID</span><span className="font-mono text-xs text-slate-600">{r.transaction_id || '—'}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
