'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { BellIcon } from '@/components/icons/UiIcons';
import { fetchUnreadCount } from '@/lib/api/notificationApi';
import UsageTracker from '@/components/UsageTracker';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={active ? 'text-slate-900' : 'text-slate-400'}>
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={active ? 'text-slate-900' : 'text-slate-400'}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function ReelsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={active ? 'text-slate-900' : 'text-slate-400'}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={active ? 'text-slate-900' : 'text-slate-400'}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={active ? 'text-slate-900' : 'text-slate-400'}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    function loadCount() {
      fetchUnreadCount().then((res) => {
        if (res.success) setUnreadCount(res.data.count);
      });
    }
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (pathname === '/notifications') setUnreadCount(0);
  }, [pathname]);

  const isChatThread = /^\/messages\/[^/]+$/.test(pathname) && pathname !== '/messages/new';
  const hideChrome = pathname === '/login' || pathname === '/profile-setup' || pathname === '/compose' || pathname.startsWith('/s/') || isChatThread;

  if (hideChrome || !isAuthenticated) {
    return <>{isAuthenticated && <UsageTracker />}{children}</>;
  }

  const profileHref = user?.username ? `/u/${user.username}` : '/settings';
  const isInSettingsMenu = pathname.startsWith('/settings-menu');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <UsageTracker />
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Friendzo" className="h-7 w-7 object-contain" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Friendzo</span>
        </Link>

        <div className="flex items-center gap-1">
          {!isInSettingsMenu && (
            <>
              <Link href="/search" aria-label="Search" className="p-2">
                <SearchIcon active={pathname === '/search'} />
              </Link>
              <Link href="/messages" aria-label="Messages" className="p-2">
                <ChatIcon active={pathname === '/messages'} />
              </Link>
              <Link href="/notifications" aria-label="Notifications" className="relative p-2">
                <BellIcon size={24} className={pathname === '/notifications' ? 'text-slate-900' : 'text-slate-400'} />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {isInSettingsMenu ? (
            <button onClick={() => router.back()} aria-label="Close" className="p-2 text-slate-900">
              <CloseIcon />
            </button>
          ) : (
            <Link href="/settings-menu" aria-label="Settings" className="p-2 text-slate-900">
              <MenuIcon />
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 pb-16">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-around py-2">
          <Link href="/" className="p-2"><HomeIcon active={pathname === '/'} /></Link>
          <Link href="/reels" className="p-2"><ReelsIcon active={pathname === '/reels'} /></Link>
          <Link href="/messages" className="p-2"><ChatIcon active={pathname === '/messages'} /></Link>
          <Link href={profileHref} className="p-2"><ProfileIcon active={pathname === profileHref} /></Link>
        </div>
      </nav>
    </div>
  );
}
