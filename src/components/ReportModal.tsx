'use client';

import { useState } from 'react';

// Shared report dialog (user-ordered 2026-11-26): one reason picker + details
// for every report type (post, comment, reel comment, user). Used by
// PostMenu, CommentItem and ReelCommentsModal. Modelled on ReelReportModal.
// The server enforces the same rules (details mandatory for 'Other', one
// report per user per calendar month), so the dialog blocks the 'Other'
// without-details case up front and surfaces the server message on failure.

export const REPORT_REASONS = [
  ['spam', 'Spam'],
  ['harassment', 'Harassment'],
  ['hate_speech', 'Hate speech'],
  ['violence', 'Violence'],
  ['nudity', 'Nudity'],
  ['misinformation', 'Misinformation'],
  ['other', 'Other'],
] as const;

export const REPORT_DETAILS_REQUIRED_MESSAGE = "Please describe the issue when you choose 'Other'.";

export default function ReportModal({ title, onClose, onSubmit }: {
  title: string;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Details are mandatory when the reason is 'Other' — the Report button
  // stays disabled and the reason is shown until details are written.
  const detailsRequired = reason === 'other' && !details.trim();

  async function submit() {
    if (submitting || detailsRequired) return;
    setSubmitting(true);
    try {
      await onSubmit(reason, details.trim() || undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
    <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">×</button></div>
      <div className="space-y-2">{REPORT_REASONS.map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-100"><input type="radio" name="report-reason" value={value} checked={reason === value} onChange={() => setReason(value)} /> <span className="text-sm">{label}</span></label>)}</div>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder={reason === 'other' ? 'Please describe the issue (required)' : 'Additional details (optional)'} className="mt-3 h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400" />
      {detailsRequired && <p className="mt-2 text-xs font-medium text-red-600">{REPORT_DETAILS_REQUIRED_MESSAGE}</p>}
      <div className="mt-4 flex gap-2"><button type="button" onClick={onClose} disabled={submitting} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium">Cancel</button><button type="button" onClick={() => void submit()} disabled={submitting || detailsRequired} className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Reporting...' : 'Report'}</button></div>
    </div>
  </div>;
}
