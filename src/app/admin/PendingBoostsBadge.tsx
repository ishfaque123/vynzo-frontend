'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchAdminPendingBoostCount } from '@/lib/api/adminApi';

export default function PendingBoostsBadge() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchAdminPendingBoostCount()
      .then((total) => {
        if (!cancelled) setCount(total);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (count <= 0) return null;
  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {count}
    </span>
  );
}
