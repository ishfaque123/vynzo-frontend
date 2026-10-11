'use client';

/** SVG icons for achievements (no emoji). */

export function AchievementIcon({ icon, size = 28 }: { icon: string; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (icon === 'fire') {
    return (
      <svg {...props}>
        <path d="M12 2c1 4-4 6-4 11a4 4 0 0 0 8 0c0-2-1-3.5-2-4.5-.5 1.5-1.5 2-2.5 2C11 8 12 4 12 2z" />
        <path d="M12 22a6 6 0 0 1-6-6c0-1 .2-2 .6-2.8" />
      </svg>
    );
  }
  if (icon === 'star') {
    return (
      <svg {...props}>
        <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
      </svg>
    );
  }
  if (icon === 'heart') {
    return (
      <svg {...props}>
        <path d="M12 21C7 16.5 2 12.8 2 8.5 2 5.5 4.5 3 7.5 3c1.8 0 3.4 1 4.5 2.6C13.1 4 14.7 3 16.5 3 19.5 3 22 5.5 22 8.5c0 4.3-5 8-10 12.5z" />
      </svg>
    );
  }
  if (icon === 'verified') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="8.5 12.2 11 14.7 15.5 9.8" />
      </svg>
    );
  }
  if (icon === 'followers') {
    return (
      <svg {...props}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14.7c2.6.3 4.7 2 5.5 4.8" />
      </svg>
    );
  }
  if (icon === 'reel') {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M10 9.5l5 2.5-5 2.5v-5z" />
      </svg>
    );
  }
  if (icon === 'post') {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  // story (default)
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  if (!streak || streak < 2) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c1 4-4 6-4 11a4 4 0 0 0 8 0c0-2-1-3.5-2-4.5-.5 1.5-1.5 2-2.5 2C11 8 12 4 12 2z" />
      </svg>
      {streak}
    </span>
  );
}
