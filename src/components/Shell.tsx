'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { BellIcon } from '@/components/icons/UiIcons';
import { fetchUnreadCount } from '@/lib/api/notificationApi';
import { logoutRequest } from '@/lib/api/authApi';
import UsageTracker from '@/components/UsageTracker';
import PushRegistrar from '@/components/PushRegistrar';

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

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18.36 6.64a9 9 0 11-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

const drawerLinks = [
  { label: 'Settings', href: '/settings-menu', Icon: SettingsIcon },
  { label: 'Your Activity', href: '/settings-menu/activity', Icon: ActivityIcon },
  { label: 'Professional Dashboard', href: '/settings-menu/dashboard', Icon: DashboardIcon },
  { label: 'Close Friends', href: '/settings-menu/close-friends', Icon: FriendsIcon },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const router = useRouter();
  const { user, isAuthenticated, offline } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      setHeaderHidden(currentY > lastScrollY.current && currentY > 60);
      lastScrollY.current = currentY;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || offline) return;
    function loadCount() {
      fetchUnreadCount().then((res) => {
        if (res.success) setUnreadCount(res.data.count);
      });
    }
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, offline]);

  useEffect(() => {
    if (currentPath === '/notifications') setUnreadCount(0);
  }, [currentPath]);

  // Close the side drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentPath]);

  // Lock body scroll and allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  async function handleDrawerLogout() {
    const result = await logoutRequest();
    if (result?.success) {
      // Persist the cleared session in the Android WebView immediately,
      // then go to login with a client-side transition (no full reload).
      (window as any).FrianzoNative?.flushCookies?.();
      setDrawerOpen(false);
      router.push('/login');
    }
  }

  const isChatThread = /^\/messages\/[^/]+$/.test(pathname) && pathname !== '/messages/new';
  const hideChrome = currentPath.startsWith('/admin') || currentPath === '/login' || currentPath === '/profile-setup' || currentPath === '/compose' || currentPath === '/reels/new' || currentPath.startsWith('/s/') || isChatThread;
  const isReels = currentPath === '/reels';
  const isMessagesList = currentPath === '/messages' || currentPath === '/messages/new';
  const hideHeader = hideChrome || isReels || isMessagesList;

  if (!isAuthenticated) {
    return <>{isAuthenticated && <UsageTracker />}{children}</>;
  }

  const profileHref = user?.username ? `/u/${user.username}` : '/settings';
  const isInSettingsMenu = currentPath.startsWith('/settings-menu');

  return (
    <div className={`flex flex-col bg-slate-50 ${isReels ? 'fixed inset-0 overflow-hidden' : 'min-h-screen'}`}>
      <UsageTracker />
      <PushRegistrar />
      {!hideHeader && <header className={`sticky top-0 z-10 flex shrink-0 bg-white px-4 py-3 transition-transform duration-300 ${headerHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="mx-auto flex w-full max-w-xl md:max-w-5xl items-center justify-between">
        <div className="flex items-center gap-1">
          {isInSettingsMenu ? (
            <button onClick={() => router.back()} aria-label="Close" className="p-2 text-slate-900">
              <CloseIcon />
            </button>
          ) : (
            <button onClick={() => setDrawerOpen(true)} aria-label="Menu" className="p-2 text-slate-900">
              <MenuIcon />
            </button>
          )}
          <Link href="/" className="text-xl font-bold tracking-tight text-blue-600">Frianzo</Link>
        </div>

        <div className="flex items-center gap-1">
          {!isInSettingsMenu && (
            <>
              <Link href="/search" aria-label="Search" className="p-2">
                <SearchIcon active={currentPath === '/search'} />
              </Link>
              <Link href="/messages" aria-label="Messages" className="p-2">
                <ChatIcon active={currentPath === '/messages'} />
              </Link>
            </>
          )}
        </div>
        </div>
      </header>}

      {!hideChrome && <nav className="shrink-0 border-t border-b bg-white">
        <div className="mx-auto flex max-w-xl md:max-w-5xl items-center justify-around py-2">
          <Link href="/" className="p-2"><HomeIcon active={currentPath === '/'} /></Link>
          <Link href="/reels" className="p-2"><ReelsIcon active={currentPath === '/reels'} /></Link>
          <Link href="/notifications" aria-label="Notifications" className="relative p-2">
            <BellIcon size={24} className={currentPath === '/notifications' ? 'text-slate-900' : 'text-slate-400'} />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href={profileHref} className="p-2"><ProfileIcon active={currentPath === profileHref} /></Link>
        </div>
      </nav>}

      <main className={isReels ? 'relative min-h-0 flex-1' : 'flex-1'}>{children}</main>

      {/* Professional side-drawer menu (replaces the old full-page hamburger menu) */}
      <div className={`fixed inset-0 z-40 ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          role="dialog"
          aria-label="Main menu"
          className={`absolute left-0 top-0 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-xl font-bold tracking-tight text-blue-600">Frianzo</span>
            <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="p-2 text-slate-600 hover:text-slate-900">
              <CloseIcon />
            </button>
          </div>

          <Link href={profileHref} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 border-b px-4 py-4 hover:bg-slate-50">
            <span className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
              {user?.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profilePictureUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-slate-900">{user?.displayName || user?.username || 'Your profile'}</span>
              {user?.username ? <span className="block truncate text-sm text-slate-500">@{user.username}</span> : null}
              <span className="mt-0.5 block text-xs font-medium text-blue-600">View Profile</span>
            </span>
          </Link>

          <nav className="flex-1 divide-y overflow-y-auto">
            {drawerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <span className="text-slate-600"><item.Icon /></span>
                <span className="text-slate-800">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t p-3">
            <button
              onClick={handleDrawerLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-red-600 hover:bg-red-50"
            >
              <PowerIcon />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
