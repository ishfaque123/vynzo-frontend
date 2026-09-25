'use client';

import { useState } from 'react';
import { clearAllAdminMessages } from '@/lib/api/adminApi';

export default function Page() {
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function clearMessages() {
    if (!window.confirm('Clear ALL Messenger messages? This will permanently remove conversations, messages, reactions and hidden-message records. Users, posts, reels and other data will NOT be deleted.')) return;
    setClearing(true);
    setResult(null);
    setError('');
    try {
      const response = await clearAllAdminMessages();
      if (response.success) setResult(response.data);
      else setError(response.error?.message || 'Unable to clear Messenger data.');
    } catch {
      setError('Unable to clear Messenger data.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Messenger Management</h2>
        <p className="mt-1 text-sm text-slate-500">Manage Messenger data without touching users, posts, reels or other platform data.</p>
      </div>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {result && <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">Messenger data cleared successfully.<div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-5"><span>Messages: {result.counts?.messages ?? 0}</span><span>Conversations: {result.counts?.conversations ?? 0}</span><span>Participants: {result.counts?.conversationParticipants ?? 0}</span><span>Reactions: {result.counts?.messageReactions ?? 0}</span><span>Hidden: {result.counts?.hiddenMessages ?? 0}</span></div></div>}
      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Clear All Messenger Data</h3>
        <p className="mt-2 text-sm text-slate-500">This removes all Messenger conversations, messages, participants, reactions and hidden-message records. It does not delete user accounts, posts, reels, stories or other unrelated data.</p>
        <button type="button" onClick={clearMessages} disabled={clearing} className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{clearing ? 'Clearing...' : 'Clear All Messages'}</button>
      </section>
    </div>
  );
}
