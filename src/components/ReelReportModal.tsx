'use client';

import { useState } from 'react';
import { reportReel } from '@/lib/api/reelApi';

const reasons = [
  ['spam', 'Spam'],
  ['harassment', 'Harassment'],
  ['hate_speech', 'Hate speech'],
  ['violence', 'Violence'],
  ['nudity', 'Nudity'],
  ['misinformation', 'Misinformation'],
  ['other', 'Other'],
] as const;

export default function ReelReportModal({ reelId, onClose }: { reelId: string; onClose: () => void }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    const result = await reportReel(reelId, reason, details.trim() || undefined);
    setSubmitting(false);
    if (!result.success) { alert(result.error?.message || 'Unable to report reel.'); return; }
    alert('Reel reported successfully.');
    onClose();
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
    <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Report reel</h2><button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">×</button></div>
      <div className="space-y-2">{reasons.map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-100"><input type="radio" name="reel-report-reason" value={value} checked={reason === value} onChange={() => setReason(value)} /> <span className="text-sm">{label}</span></label>)}</div>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder="Additional details (optional)" className="mt-3 h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400" />
      <div className="mt-4 flex gap-2"><button type="button" onClick={onClose} disabled={submitting} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium">Cancel</button><button type="button" onClick={() => void submit()} disabled={submitting} className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Reporting...' : 'Report'}</button></div>
    </div>
  </div>;
}
