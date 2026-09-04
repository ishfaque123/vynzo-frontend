'use client';

import Link from 'next/link';

const menuItems = [
  { label: 'Notifications', href: '/settings-menu/notifications', icon: '🔔' },
  { label: 'Professional Dashboard', href: '/settings-menu/dashboard', icon: '📊' },
  { label: 'Account Privacy', href: '/settings-menu/privacy', icon: '🔒' },
  { label: 'Close Friends', href: '/settings-menu/close-friends', icon: '⭐' },
  { label: 'Blocked Accounts', href: '/settings-menu/blocked', icon: '🚫' },
  { label: 'Comments', href: '/settings-menu/comments', icon: '💬' },
  { label: 'Switch / Add Account', href: '/settings-menu/switch-account', icon: '🔁' },
  { label: 'Login & Security', href: '/settings-menu/security', icon: '🛡️' },
  { label: 'Devices', href: '/settings-menu/devices', icon: '📱' },
  { label: 'Theme', href: '/settings-menu/theme', icon: '🎨' },
  { label: 'Edit Profile', href: '/settings', icon: '✏️' },
];

export default function SettingsMenuPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>
      <div className="divide-y rounded-lg border">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-slate-800">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
