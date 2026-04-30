'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const qc = useQueryClient();

  // Profile
  const { data: profile } = useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: () => api.get('/settings/profile').then(r => r.data),
  });
  const [name, setName] = useState('');
  const updateProfile = useMutation({
    mutationFn: (name: string) => api.patch('/settings/profile', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'profile'] }),
  });

  // Notifications
  const { data: notifs } = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: () => api.get('/settings/notifications').then(r => r.data),
  });
  const updateNotifs = useMutation({
    mutationFn: (body: Record<string, boolean>) => api.patch('/settings/notifications', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'notifications'] }),
  });

  const notifFields = [
    { key: 'notify_new_signup',  label: 'New company signup' },
    { key: 'notify_payment',     label: 'Payment received' },
    { key: 'notify_renewal_due', label: 'Renewal due' },
    { key: 'notify_expiry',      label: 'Subscription expired' },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      {/* Profile section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Display Name</label>
            <input
              type="text"
              defaultValue={profile?.name ?? ''}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
            <input type="email" value={profile?.email ?? ''} disabled
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500" />
          </div>
          <button
            onClick={() => updateProfile.mutate(name || profile?.name)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Save changes
          </button>
        </div>
      </section>

      {/* Notifications section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Notifications</h2>
        <div className="space-y-3">
          {notifFields.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">{label}</span>
              <input
                type="checkbox"
                checked={notifs?.[key] ?? true}
                onChange={e => updateNotifs.mutate({ ...notifs, [key]: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
