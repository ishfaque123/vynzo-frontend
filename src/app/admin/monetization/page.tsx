'use client';
import { useState } from 'react';
import { setAdminUserMonetization, addAdminUserEarnings } from '@/lib/api/adminApi';

export default function MonetizationPage() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleToggleMonetization(forced: boolean) {
    if (!userId.trim()) { setError('User ID required'); return; }
    setLoading(true); setError(''); setMessage('');
    const r = await setAdminUserMonetization(userId.trim(), forced);
    setLoading(false);
    if (r.success) {
      setMessage(`Monetization ${forced ? 'ACTIVATED' : 'DEACTIVATED'} for user ${r.data.user.username || userId}`);
    } else {
      setError(r.error?.message || 'Failed');
    }
  }

  async function handleAddEarnings() {
    if (!userId.trim()) { setError('User ID required'); return; }
    const num = parseFloat(amount);
    if (isNaN(num)) { setError('Valid amount required'); return; }
    setLoading(true); setError(''); setMessage('');
    const r = await addAdminUserEarnings(userId.trim(), num, note.trim() || undefined);
    setLoading(false);
    if (r.success) {
      setMessage(`Added $${num.toFixed(2)} to ${r.data.user.username || userId}. New balance: $${r.data.user.walletBalance.toFixed(2)}`);
      setAmount(''); setNote('');
    } else {
      setError(r.error?.message || 'Failed');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Monetization Control</h2>
        <p className="mt-1 text-sm text-slate-500">Manually activate monetization and add earnings for any user.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}

      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
          <input
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="Paste user ID here"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Find the User ID from the Users page (click a user to see their ID in the URL or details).</p>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-2">Monetization Status</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleMonetization(true)}
              disabled={loading}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              ✅ Activate
            </button>
            <button
              onClick={() => handleToggleMonetization(false)}
              disabled={loading}
              className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
            >
              Deactivate
            </button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-2">Add Earnings</h3>
          <div className="flex gap-2">
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount (e.g. 10.50)"
              type="number"
              step="0.01"
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddEarnings}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              💰 Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
