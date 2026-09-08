'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/lib/api/messageApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function NewMessagePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

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

  async function startConversation(userId: string) {
    setStarting(true);
    const result = await createConversation(userId);
    setStarting(false);
    if (result.success) router.push(`/messages/${result.data.id}`);
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
          <button
            key={u.id}
            disabled={starting}
            onClick={() => startConversation(u.id)}
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-slate-50 disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {u.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium">{u.displayName}</p>
              <p className="text-sm text-slate-500">@{u.username}</p>
            </div>
          </button>
        ))}
        {!loading && query && results.length === 0 && (
          <p className="text-slate-500">No users found.</p>
        )}
      </div>
    </div>
  );
}
