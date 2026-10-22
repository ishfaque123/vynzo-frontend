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

      <p
        dir="rtl"
        className="px-3 pb-3 text-right text-[14px] leading-relaxed text-slate-800 dark:text-slate-200"
      >
        اپنے پروفائل کو <span className="font-bold">بلیو ٹک</span> کے ساتھ آفیشل بنائیں — صرف{' '}
        <span className="font-bold">400 روپے میں پورے 12 ماہ</span>، فیڈ بوسٹ اور سرچ میں ترجیحی
        درجے کے ساتھ۔
      </p>

      <button
        type="button"
        onClick={openChat}
        disabled={opening}
        className="block w-full disabled:opacity-70"
        aria-label="Blue Tick offer — tap to message"
      >
        <img
          src="https://pub-72f9ea3dc70249cdb12b7e61642d0bb7.r2.dev/blue-tick-ad.webp"
          alt="Frianzo Blue Tick — 12 months for Rs 400"
          className="block h-auto w-full"
          loading="lazy"
        />
      </button>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            Frianzo Blue Tick
          </div>
          <div className="text-[11.5px] text-slate-500 dark:text-slate-400">
            Tap Send Message to order
          </div>
        </div>
        <button
          type="button"
          onClick={openChat}
          disabled={opening}
          className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-70"
        >
          {opening ? 'Opening...' : 'Send Message'}
        </button>
      </div>
    </div>
  );
}
