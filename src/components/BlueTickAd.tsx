'use client';

// House sponsored card (Blue Tick offer) shown in the home feed.
// Click-to-message, Facebook style: tapping the card opens (or creates)
// the buyer's chat with Dr Fazeela Shar directly, with the first message
// already written in the composer — no people-picker in between.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/lib/api/messageApi';
import VerifiedBadge from '@/components/VerifiedBadge';

const FAZEELA_ID = '6e1891cf-4bff-4e86-9bb8-ba2cfa8a10d9';
const FAZEELA_AVATAR =
  'https://pub-72f9ea3dc70249cdb12b7e61642d0bb7.r2.dev/avatars/be6839f0-24a5-4c1a-b217-5c0d1c28402f.jpeg';
const MESSAGE_TEXT = 'Hello! I Need Blue Tick. Please send me the details.';

export default function BlueTickAd() {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  async function openChat() {
    if (opening) return;
    setOpening(true);
    try {
      const result = await createConversation(FAZEELA_ID);
      if (result?.success && result.data?.id) {
        try {
          sessionStorage.setItem(
            'frianzo_prefill_message',
            JSON.stringify({ conversationId: result.data.id, text: MESSAGE_TEXT })
          );
        } catch { /* ignore */ }
        router.push(`/messages/${result.data.id}`);
        return;
      }
    } catch { /* fall through to the profile, whose Message button works the same way */ }
    router.push('/u/Fazeela');
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
        <img
          src={FAZEELA_AVATAR}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[14.5px] font-bold leading-tight text-slate-900 dark:text-slate-100">
            <span className="truncate">Dr Fazeela Shar</span>
            <VerifiedBadge size="lg" />
          </div>
          <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
            Sponsored · Blue Tick Offer
          </div>
        </div>
        <div className="px-1 text-base tracking-widest text-slate-400">•••</div>
      </div>

      <p className="px-3 pb-2.5 text-[13.5px] leading-snug text-slate-800 dark:text-slate-200">
        Apne profile ko <span className="font-semibold">Blue Tick</span> se official banao —{' '}
        <span className="font-semibold">12 months sirf Rs 400</span>. Sath mein feed boost aur
        search mein pehle number par ana bhi shamil hai.
      </p>

      <button
        type="button"
        onClick={openChat}
        disabled={opening}
        className="block w-full bg-gradient-to-br from-sky-950 via-blue-800 to-sky-500 px-4 py-5 text-left text-white disabled:opacity-70"
      >
        <span className="inline-block rounded-full border border-white/40 bg-white/15 px-2.5 py-1 text-[10.5px] font-bold tracking-wider">
          LAUNCH OFFER · 31 OCTOBER TAK
        </span>
        <span className="mt-2.5 block text-[23px] font-extrabold leading-tight">
          Blue Tick
          <br />
          12 Months · Rs 400
        </span>
        <span className="mt-1.5 block text-[13px] text-white/90">
          Us ke baad regular daam: Rs 400 / 30 days
        </span>
      </button>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            Frianzo Blue Tick
          </div>
          <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
            Details ke liye message karein
          </div>
        </div>
        <button
          type="button"
          onClick={openChat}
          disabled={opening}
          className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-70"
        >
          {opening ? 'Opening...' : 'Send Message'}
        </button>
      </div>
    </div>
  );
}
