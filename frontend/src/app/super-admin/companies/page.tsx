'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Company = {
  registration_id: string; company_id: string; company_name: string;
  email: string; industry: string; subscription_plan: string;
  subscription_status: string; payment_date: string; billing_cycle: string;
};

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', plan: '', industry: '', page: 1 });
  const [selected, setSelected] = useState<Company | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', filters],
    queryFn: () => api.get('/companies', { params: filters }).then(r => r.data),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => api.patch(`/companies/${id}/status`, { subscription_status: 'Suspended' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });

  const provision = useMutation({
    mutationFn: (id: string) => api.post(`/companies/${id}/provision`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });

  const companies: Company[] = data?.data ?? [];

  function computeEndDate(paymentDate: string, billingCycle: string) {
    if (!paymentDate) return '—';
    const d = new Date(paymentDate);
    if (billingCycle === 'annual') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {['Active','Pending','Suspended','Expired'].map(s => (
          <button key={s} onClick={() => setFilters(f => ({ ...f, status: f.status === s ? '' : s, page: 1 }))}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filters.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}>{s}</button>
        ))}
        <input placeholder="Search industry…" value={filters.industry}
          onChange={e => setFilters(f => ({ ...f, industry: e.target.value, page: 1 }))}
          className="ml-auto border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Company','Industry','Plan','Status','Renewal Date','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading…</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">No companies found</td></tr>
            ) : companies.map(c => (
              <tr key={c.registration_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <button onClick={() => { setSelected(c); setShowDetail(true); }}
                    className="hover:text-blue-600 text-left">{c.company_name}</button>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.industry}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{c.subscription_plan}</td>
                <td className="px-4 py-3"><StatusBadge status={c.subscription_status} /></td>
                <td className="px-4 py-3 text-slate-600">{computeEndDate(c.payment_date, c.billing_cycle)}</td>
                <td className="px-4 py-3 flex gap-2">
                  {!c.company_id && (
                    <button onClick={() => provision.mutate(c.registration_id)}
                      className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                      Provision
                    </button>
                  )}
                  {c.subscription_status !== 'Suspended' && (
                    <button onClick={() => { if (confirm(`Suspend ${c.company_name}?`)) suspend.mutate(c.registration_id); }}
                      className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 text-xs rounded-lg hover:bg-red-100">
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
        <span>Total: {data?.total ?? 0}</span>
        <div className="flex gap-2">
          <button disabled={filters.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40">Previous</button>
          <button disabled={companies.length < 20}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>

      {/* Detail modal */}
      {showDetail && selected && (
        <CompanyDetailModal company={selected} onClose={() => setShowDetail(false)} />
      )}
    </div>
  );
}

function CompanyDetailModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['company-detail', company.company_id],
    queryFn: () => api.get(`/companies/${company.company_id}`).then(r => r.data),
    enabled: !!company.company_id,
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{company.company_name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        {isLoading ? <p className="text-slate-400">Loading…</p> : (
          <div className="space-y-4 text-sm">
            <div><span className="font-medium text-slate-500">Registration ID:</span> <span className="text-slate-800">{company.registration_id}</span></div>
            <div><span className="font-medium text-slate-500">Plan:</span> <span className="text-slate-800 capitalize">{company.subscription_plan}</span></div>
            <div><span className="font-medium text-slate-500">Status:</span> <StatusBadge status={company.subscription_status} /></div>
            <div><span className="font-medium text-slate-500">Industry:</span> <span className="text-slate-800">{company.industry}</span></div>
            <div><span className="font-medium text-slate-500">Admin email:</span> <span className="text-slate-800">{company.email}</span></div>
            {data?.config && (
              <>
                <hr className="border-slate-100" />
                <div><span className="font-medium text-slate-500">Timezone:</span> <span className="text-slate-800">{data.config.timezone}</span></div>
                <div><span className="font-medium text-slate-500">Currency:</span> <span className="text-slate-800">{data.config.currency}</span></div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
