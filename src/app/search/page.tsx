'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`, {
      credentials: 'include',
    });
    const result = await res.json();
    setLoading(false);
    if (result.success) setResults(result.data.users);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full rounded-lg border px-4 py-2"
        autoFocus
      />

      <div className="mt-4 space-y-2">
        {loading && <p className="text-slate-500">Searching...</p>}
        {results.map((u) => (
          <Link
            key={u.id}
            href={`/u/${u.username}`}
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {u.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium">{u.displayName}</p>
              <p className="text-sm text-slate-500">@{u.username}</p>
            </div>
          </Link>
        ))}
        {!loading && query && results.length === 0 && (
          <p className="text-slate-500">No users found.</p>
        )}
      </div>
    </div>
  );
}
