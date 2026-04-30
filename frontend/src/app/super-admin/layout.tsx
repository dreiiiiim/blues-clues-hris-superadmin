'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';

const navItems = [
  { href: '/super-admin/dashboard',      label: 'Dashboard' },
  { href: '/super-admin/companies',      label: 'Companies' },
  { href: '/super-admin/subscriptions',  label: 'Subscriptions' },
  { href: '/super-admin/renewals',       label: 'Renewals' },
  { href: '/super-admin/settings',       label: 'Settings' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <span className="text-white font-semibold text-lg">Super Admin</span>
          <p className="text-slate-400 text-xs mt-0.5">Blues Clues HRIS</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={logout}
            className="w-full text-left px-3 py-2.5 text-sm text-slate-400 hover:text-red-400 rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
