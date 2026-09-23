'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  ['Dashboard', '/admin'],
  ['Users', '/admin/users'],
  ['Verification', '/admin/verification'],
  ['Posts', '/admin/posts'],
  ['Comments', '/admin/comments'],
  ['Reports', '/admin/reports'],
  ['Moderation', '/admin/moderation'],
  ['Sessions & Devices', '/admin/sessions'],
  ['Notifications', '/admin/notifications'],
  ['Audit Logs', '/admin/audit-logs'],
  ['Settings', '/admin/settings'],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = items.find(([, href]) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  return <div className="min-h-screen bg-slate-100">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-slate-950 text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Frianzo</p><h1 className="mt-1 text-xl font-bold">Admin Panel</h1></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{items.map(([label,href])=>{const active=href==='/admin'?pathname==='/admin':pathname.startsWith(href);return <Link key={href} href={href} className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${active?'bg-white text-slate-950':'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{label}</Link>})}</nav>
      <div className="border-t border-white/10 p-4 text-xs text-slate-400">Restricted admin area</div>
    </aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-slate-400">Frianzo Admin</p><p className="text-sm font-semibold text-slate-900">{current?.[0]||'Admin Panel'}</p></div><Link href="/" className="rounded-xl border px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Back to app</Link></div>
        <nav className="mt-3 flex gap-1 overflow-x-auto lg:hidden">{items.map(([label,href])=><Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${pathname===href?'bg-slate-900 text-white':'bg-slate-100 text-slate-600'}`}>{label}</Link>)}</nav>
      </header>
      <main className="min-h-[calc(100vh-65px)] p-4 md:p-6">{children}</main>
    </div>
  </div>;
}
