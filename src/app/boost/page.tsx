'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { useInFrianzoAppChecked } from '@/lib/useInFrianzoApp';
import {
  fetchBoostConfig,
  createBoostRequest,
  fetchBoostPostPreview,
  fetchBoostReelPreview,
  boostPurposeLabel,
  boostErrorMessage,
  type BoostConfig,
} from '@/lib/api/boostApi';
import { fetchUserPosts } from '@/lib/api/postApi';
import { fetchUserReels } from '@/lib/api/reelApi';
import { uploadChatMedia } from '@/lib/api/messageApi';
import Avatar from '@/components/Avatar';
import VerifiedBadge from '@/components/VerifiedBadge';

// Boost page (web) — Boost v2, the owner-approved Facebook-style design
// (2026-11-18): ONE scrolling page. Real preview of the content at the
// top (with the goal's button on it), goal choices, a daily-budget
// slider with the duration picked separately, an Analysis card (post
// insights + Estimated daily results with range bars), then the
// payment summary, manual payment and the Boost Post Now button.
// Prices and estimate factors come ONLY from GET /api/boosts/config;
// the fallbacks below mirror the contract exactly and are used only if
// a payload field ever arrives empty. Amounts are never sent: the
// server re-derives the charged amount from dailyBudget × days.
//
// APP GATE (owner rule): this page exists ONLY inside the old Android
// app (frianzo-app WebView). Until the FrianzoNative bridge check has
// resolved it renders nothing; in a normal browser it redirects home.

const FALLBACK_PURPOSES = [
  { id: 'followers_gain', label: 'Followers Gain', description: 'Grow your profile followers.' },
  { id: 'views_gain', label: 'Views Gain', description: 'Get more views on this post or reel.' },
  { id: 'business_promotion', label: 'Business Promotion', description: 'Promote a product, service or business.' },
];
const FALLBACK_METHODS = [
  { id: 'easypaisa', label: 'EasyPaisa', accountTitle: 'SHAHI COMMUNICATION', accountNumber: '990001988', instructions: 'Send the amount to this EasyPaisa Till ID, then upload the payment screenshot below.' },
  { id: 'jazzcash', label: 'JazzCash', accountTitle: 'ISHFAQ Shop', accountNumber: '984580283', instructions: 'Send the amount to this JazzCash business number, then upload the payment screenshot below.' },
];
const FALLBACK_BUDGET = { min: 100, max: 1000, step: 50 };
const FALLBACK_DURATIONS = [1, 3, 7, 14];
const FALLBACK_BUTTON_TEXTS = ['Learn More', 'Shop Now', 'Order Now'];
const FALLBACK_FACTORS = {
  reachPerRupeeMin: 3.5,
  reachPerRupeeMax: 7,
  impressionsPerRupeeMin: 5,
  impressionsPerRupeeMax: 10,
  clicksPerReach: 0.06,
};

// Same gradient classes the feed uses for coloured-background posts
// (PostCard's POST_BACKGROUND_CLASSES).
const POST_BACKGROUND_CLASSES: Record<string, string> = {
  sunset: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600',
  ocean: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
  violet: 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500',
  mint: 'bg-gradient-to-br from-emerald-300 via-teal-400 to-cyan-500',
  peach: 'bg-gradient-to-br from-yellow-300 via-orange-400 to-rose-500',
  night: 'bg-gradient-to-br from-slate-700 via-slate-900 to-black',
  rose: 'bg-gradient-to-br from-rose-400 via-red-500 to-pink-600',
  sky: 'bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500',
};

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function kfmt(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}K` : `${Math.round(n)}`;
}

interface ChosenItem {
  contentType: 'post' | 'reel';
  contentId: string;
  text: string | null;
  imageUrl: string | null;
  backgroundStyle: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  authorVerified: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

function itemFromPost(post: any, fallbackId: string): ChosenItem {
  return {
    contentType: 'post',
    contentId: post?.id || fallbackId,
    text: post?.content ?? null,
    imageUrl: post?.imageUrl ?? post?.imageThumbUrl ?? null,
    backgroundStyle: post?.backgroundStyle ?? null,
    authorName: post?.author?.displayName ?? null,
    authorAvatar: post?.author?.profilePictureUrl ?? null,
    authorVerified: !!post?.author?.isVerified,
    likeCount: post?.likeCount ?? 0,
    commentCount: post?.commentCount ?? 0,
    shareCount: post?.shareCount ?? 0,
  };
}

function itemFromReel(reel: any, fallbackId: string): ChosenItem {
  return {
    contentType: 'reel',
    contentId: reel?.id || fallbackId,
    text: reel?.caption ?? null,
    imageUrl: reel?.thumbnailUrl ?? null,
    backgroundStyle: null,
    authorName: reel?.author?.displayName ?? null,
    authorAvatar: reel?.author?.profilePictureUrl ?? null,
    authorVerified: !!reel?.author?.isVerified,
    likeCount: reel?.likeCount ?? 0,
    commentCount: reel?.commentCount ?? 0,
    shareCount: reel?.shareCount ?? 0,
  };
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SmallPreviewCard({ item }: { item: ChosenItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      {item.imageUrl && <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-bold tracking-wide text-blue-600">{item.contentType === 'reel' ? 'REEL' : 'POST'}</span>
        <p className="mt-0.5 line-clamp-3 text-sm text-slate-900">
          {item.text && item.text.trim() ? item.text : item.contentType === 'reel' ? 'Your reel' : 'Your post'}
        </p>
      </div>
    </div>
  );
}

/** The full preview: the content as people will see it in the feed.
 *  Only a Business Promotion boost puts a button on the content (the
 *  link button, when a link is added) — Views Gain and Followers Gain
 *  boosts look completely normal (owner rule, 2026-11-18). */
function FullPreview({
  item,
  purpose,
  buttonText,
  hasLink,
}: {
  item: ChosenItem;
  purpose: string | null;
  buttonText: string;
  hasLink: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Avatar url={item.authorAvatar} name={item.authorName || 'You'} />
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-bold text-slate-900">{item.authorName || 'You'}</span>
            {item.authorVerified && (
              <span className="shrink-0">
                <VerifiedBadge />
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">Sponsored · Public</div>
        </div>
      </div>

      {item.contentType === 'reel' ? (
        <div className="relative mt-2.5 overflow-hidden rounded-lg bg-black">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-56 w-full items-center justify-center text-sm text-white">Your reel</div>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">Reel</span>
        </div>
      ) : item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="mt-2.5 max-h-80 w-full rounded-lg object-cover" />
      ) : item.backgroundStyle && item.text ? (
        <div className={`mt-2.5 flex min-h-[130px] items-center justify-center rounded-lg p-5 text-center ${POST_BACKGROUND_CLASSES[item.backgroundStyle] || 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600'}`}>
          <span className="whitespace-pre-wrap text-[22px] font-bold leading-snug text-white">{item.text}</span>
        </div>
      ) : item.text ? (
        <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-snug text-slate-900">{item.text}</p>
      ) : null}

      {item.contentType === 'reel' && item.text && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-800">{item.text}</p>
      )}

      <div className="flex items-center justify-around pb-1 pt-2.5 text-[13px] text-slate-500">
        <span>{fmt(item.likeCount)} Likes</span>
        <span>{fmt(item.commentCount)} Comments</span>
        <span>{fmt(item.shareCount)} Shares</span>
      </div>

      {purpose === 'business_promotion' && hasLink && (
        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="text-xs text-slate-500">Your link</span>
          <span className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-[13px] font-semibold text-white">{buttonText}</span>
        </div>
      )}
    </div>
  );
}

function EstimateBar({ label, min, max, scaleMax }: { label: string; min: number; max: number; scaleMax: number }) {
  const left = Math.min(100, (min / scaleMax) * 100);
  const width = Math.max(2, Math.min(100 - left, ((max - min) / scaleMax) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-slate-900">
          {kfmt(min)} – {kfmt(max)}
        </span>
      </div>
      <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="absolute bottom-0 top-0 rounded-full bg-blue-600" style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
    </div>
  );
}

function BoostPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { checked: appChecked, inApp } = useInFrianzoAppChecked();
  const { user, loading: authLoading } = useAuth();

  const paramType = params.get('type') === 'reel' ? 'reel' : 'post';
  const paramId = params.get('id');
  const presetPurpose = params.get('purpose');
  const presetBudget = params.get('budget') ? Number(params.get('budget')) : null;
  const presetDays = params.get('days') ? Number(params.get('days')) : null;

  const [config, setConfig] = useState<BoostConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<ChosenItem | null>(null);
  const [choices, setChoices] = useState<ChosenItem[] | null>(null);
  const [purpose, setPurpose] = useState<string>(presetPurpose || 'views_gain');
  const [budget, setBudget] = useState<number>(presetBudget && presetBudget >= 100 && presetBudget <= 1000 ? presetBudget : 200);
  const [days, setDays] = useState<number>(presetDays && FALLBACK_DURATIONS.includes(presetDays) ? presetDays : 3);
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonText, setButtonText] = useState('Learn More');
  const [clickCap, setClickCap] = useState('');
  const [methodId, setMethodId] = useState<string | null>(null);
  const [txnId, setTxnId] = useState('');
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [shotPreview, setShotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // App gate: a normal browser never sees this page.
  useEffect(() => {
    if (appChecked && !inApp) router.replace('/');
  }, [appChecked, inApp, router]);

  // Logged-out inside the app goes to login, like the rest of the app.
  useEffect(() => {
    if (inApp && !authLoading && !user) router.replace('/login');
  }, [inApp, authLoading, user, router]);

  async function loadConfig() {
    try {
      const r = await fetchBoostConfig();
      if (r.success && r.data) {
        setConfig(r.data);
        setConfigError(null);
        if (!methodId) setMethodId((r.data.paymentMethods?.[0] || FALLBACK_METHODS[0]).id);
      } else {
        setConfigError(r.error?.message || 'Could not load boost options');
      }
    } catch (e: any) {
      setConfigError(e?.message || 'Could not load boost options');
    }
  }

  useEffect(() => {
    if (inApp && user) void loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inApp, user]);

  // Preselected item (per-post / per-reel Boost button, or Boost
  // Again): load its full preview from the existing reads.
  useEffect(() => {
    if (!inApp || !user || !paramId) return;
    let cancelled = false;
    (async () => {
      try {
        if (paramType === 'reel') {
          const r = await fetchBoostReelPreview(paramId);
          const reel = r?.data?.reel;
          if (!cancelled && reel) setChosen(itemFromReel(reel, paramId));
        } else {
          const r = await fetchBoostPostPreview(paramId);
          const post = r?.data?.post;
          if (!cancelled && post) setChosen(itemFromPost(post, paramId));
        }
      } catch {
        // Preview is cosmetic; the flow still works without it.
        if (!cancelled) {
          setChosen({
            contentType: paramType,
            contentId: paramId,
            text: null,
            imageUrl: null,
            backgroundStyle: null,
            authorName: (user as any).displayName ?? null,
            authorAvatar: (user as any).profilePictureUrl ?? null,
            authorVerified: !!(user as any).isVerified,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inApp, user, paramId, paramType]);

  // Choose mode (profile Boost button): my own posts + reels, newest
  // first. Reposts are excluded — the backend rejects them; boost the
  // original instead.
  useEffect(() => {
    if (!inApp || !user || paramId) return;
    let cancelled = false;
    (async () => {
      const [postsRes, reelsRes] = await Promise.all([
        fetchUserPosts(user.username).catch(() => null),
        fetchUserReels(user.username).catch(() => null),
      ]);
      if (cancelled) return;
      const items: (ChosenItem & { createdAt: string })[] = [];
      for (const p of postsRes?.data?.posts || []) {
        if (p.originalPost) continue;
        items.push({ ...itemFromPost(p, p.id), createdAt: p.createdAt || '' });
      }
      for (const r of reelsRes?.data?.reels || []) {
        items.push({ ...itemFromReel(r, r.id), createdAt: r.createdAt || '' });
      }
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
      setChoices(items);
    })();
    return () => {
      cancelled = true;
    };
  }, [inApp, user, paramId]);

  async function handleShotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const r = await uploadChatMedia(file, file.name || 'boost-screenshot.jpg');
      const url = r?.data?.url;
      if (r.success && url) {
        setShotUrl(url);
        setShotPreview(URL.createObjectURL(file));
      } else {
        setFormError(r?.error?.message || "Couldn't upload screenshot");
      }
    } catch (err: any) {
      setFormError(err?.message || "Couldn't upload screenshot");
    } finally {
      setUploading(false);
    }
  }

  function copyNumber(methodIdValue: string, number: string) {
    try {
      navigator.clipboard.writeText(number).catch(() => {});
    } catch {
      // Clipboard unavailable — the number stays visible to copy by hand.
    }
    setCopiedId(methodIdValue);
    setTimeout(() => setCopiedId((c) => (c === methodIdValue ? null : c)), 2000);
  }

  const title = !chosen && !paramId ? 'Boost' : chosen?.contentType === 'reel' || (paramId && paramType === 'reel') ? 'Boost Reel' : 'Boost Post';

  function handleBack() {
    if (!paramId && chosen) {
      setChosen(null);
    } else {
      router.back();
    }
  }

  // Render nothing until the app check has resolved (no flash of Boost
  // UI in a browser); the redirect effect handles the browser case.
  if (!appChecked || !inApp) return null;
  if (authLoading || !user) return null;

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-1 border-b border-slate-100 px-1 py-1">
          <button type="button" onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 text-slate-700">
            <BackIcon />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckIcon size={48} />
          </span>
          <p className="mt-4 text-base font-semibold text-slate-900">Request sent — your boost will start once it is approved</p>
          <Link href="/boost/my" className="mt-6 flex h-12 items-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white">
            My Boosts
          </Link>
          <Link href="/" className="mt-2 px-4 py-2 text-sm font-medium text-blue-600">
            Done
          </Link>
        </div>
      </div>
    );
  }

  const cfg = config;

  // Derived v2 pricing + estimates (factors from config, fallbacks
  // mirror the contract). Total = dailyBudget × days, except the
  // first-boost trial size (Rs 100/day × 1 day) costs Rs 79.
  const budgetCfg = cfg?.budget ?? FALLBACK_BUDGET;
  const durations = cfg?.durations?.length ? cfg.durations : FALLBACK_DURATIONS;
  const factors = cfg?.estimateFactors ?? FALLBACK_FACTORS;
  const buttonTexts = cfg?.buttonTexts?.length ? cfg.buttonTexts : FALLBACK_BUTTON_TEXTS;
  const purposes = cfg?.purposes?.length ? cfg.purposes : FALLBACK_PURPOSES;
  const methods = cfg?.paymentMethods?.length ? cfg.paymentMethods : FALLBACK_METHODS;
  const selectedMethod = methods.find((m) => m.id === methodId) || methods[0];
  const trial = cfg?.firstBoostTrial;
  const trialApplies = !!trial?.available && budget === (trial.dailyBudget ?? 100) && days === (trial.days ?? 1);
  const total = trialApplies ? trial!.amountPkr : budget * days;
  const reachMin = budget * factors.reachPerRupeeMin;
  const reachMax = budget * factors.reachPerRupeeMax;
  const impMin = budget * factors.impressionsPerRupeeMin;
  const impMax = budget * factors.impressionsPerRupeeMax;
  const clickMin = reachMin * factors.clicksPerReach;
  const clickMax = reachMax * factors.clicksPerReach;
  const trimmedLink = linkUrl.trim();
  const linkValid = !trimmedLink || /^https?:\/\/.+/i.test(trimmedLink);
  const isBusiness = purpose === 'business_promotion';

  async function handleSubmit() {
    if (!chosen || !shotUrl) return;
    if (isBusiness && !linkValid) {
      setFormError('Enter a valid link starting with http:// or https://.');
      return;
    }
    // Optional click cap (Business Promotion with a link only): 1–
    // 100,000; empty means no cap and the boost runs for its days.
    let parsedCap: number | null = null;
    if (isBusiness && trimmedLink && clickCap.trim()) {
      parsedCap = Number(clickCap.trim());
      if (!Number.isInteger(parsedCap) || parsedCap < 1 || parsedCap > 100000) {
        setFormError('Enter a click limit between 1 and 100,000, or leave it empty for no limit.');
        return;
      }
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const r = await createBoostRequest({
        contentType: chosen.contentType,
        postId: chosen.contentType === 'post' ? chosen.contentId : null,
        reelId: chosen.contentType === 'reel' ? chosen.contentId : null,
        purpose,
        dailyBudget: budget,
        days,
        linkUrl: isBusiness && trimmedLink ? trimmedLink : null,
        buttonText: isBusiness && trimmedLink ? buttonText : null,
        clickCap: parsedCap,
        paymentMethod: selectedMethod.id,
        transactionId: txnId.trim() ? txnId.trim() : null,
        screenshotUrl: shotUrl,
      });
      if (r.success) setSubmitted(true);
      else setFormError(boostErrorMessage(r));
    } catch (e: any) {
      setFormError(e?.message || 'Could not send the boost request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-4">
      <div className="flex items-center gap-1 border-b border-slate-100 px-1 py-1">
        <button type="button" onClick={handleBack} aria-label="Back" className="rounded-full p-2 text-slate-700">
          <BackIcon />
        </button>
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      {cfg === null && configError === null ? (
        <div className="flex justify-center py-16" role="status" aria-label="Loading boost options">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : configError !== null ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <p className="text-sm text-red-600">{configError}</p>
          <button
            type="button"
            onClick={() => {
              setConfigError(null);
              void loadConfig();
            }}
            className="mt-3 flex h-12 items-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : cfg !== null && !cfg.eligible ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <p className="text-[15px] text-slate-700">Boost is available for users in Pakistan only.</p>
          <Link href="/" className="mt-3 px-4 py-2 text-sm font-medium text-blue-600">
            Done
          </Link>
        </div>
      ) : cfg !== null ? (
        <>
          {!chosen && paramId ? (
            <div className="flex justify-center py-16" role="status" aria-label="Loading">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
          ) : !chosen ? (
            <div className="px-4 pt-4">
              <h2 className="text-base font-semibold text-slate-900">Choose a post or reel</h2>
              {choices === null ? (
                <div className="flex justify-center py-12" role="status" aria-label="Loading your posts">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                </div>
              ) : choices.length === 0 ? (
                <p className="pt-3 text-sm text-slate-500">You have no posts or reels to boost yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5 pt-3">
                  {choices.map((item) => (
                    <button
                      key={`${item.contentType}:${item.contentId}`}
                      type="button"
                      onClick={() => setChosen(item)}
                      className="text-left"
                    >
                      <SmallPreviewCard item={item} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="px-4 pt-3">
                <p className="pb-2 text-xs font-semibold tracking-wide text-slate-500">PREVIEW — HOW PEOPLE WILL SEE IT</p>
                <FullPreview item={chosen} purpose={purpose} buttonText={buttonText} hasLink={!!trimmedLink} />

                {/* Goal */}
                <h2 className="pt-5 text-[15px] font-bold text-slate-900">Choose your goal</h2>
                <div className="flex flex-col gap-2.5 pt-2.5">
                  {purposes.map((p) => {
                    const sel = purpose === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPurpose(p.id)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border p-3.5 text-left ${
                          sel ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${sel ? 'border-blue-600' : 'border-slate-400'}`}
                        >
                          {sel && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{p.label || boostPurposeLabel(p.id)}</span>
                          {p.description && <span className="mt-0.5 block text-xs text-slate-500">{p.description}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isBusiness && (
                  <div className="pt-3">
                    <input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="Your website or WhatsApp link (optional)"
                      inputMode="url"
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 ${linkValid ? 'border-slate-300' : 'border-red-400'}`}
                    />
                    {!linkValid && <p className="pt-1 text-xs text-red-600">Enter a valid link starting with http:// or https://.</p>}
                    <p className="pb-2 pt-3 text-[13px] font-semibold text-slate-900">Button text</p>
                    <div className="flex gap-2">
                      {buttonTexts.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setButtonText(t)}
                          className={`flex-1 rounded-lg border py-2 text-[13px] font-semibold ${
                            buttonText === t ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="pt-2 text-xs text-slate-500">
                      The button will appear on your boosted {chosen.contentType === 'reel' ? 'reel' : 'post'} with your link. Without a link, no button will show.
                    </p>
                    {trimmedLink && (
                      <>
                        <p className="pb-1 pt-3 text-[13px] font-semibold text-slate-900">End after X clicks (optional)</p>
                        <input
                          value={clickCap}
                          onChange={(e) => setClickCap(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          placeholder="e.g. 30 — leave empty for no limit"
                          inputMode="numeric"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                        />
                        <p className="pt-1.5 text-xs text-slate-500">
                          The boost ends automatically once it reaches this many link clicks, even if days are left.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Budget + duration */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-bold text-slate-900">Daily budget</h2>
                    <span className="text-sm font-bold text-blue-600">Rs {fmt(budget)}</span>
                  </div>
                  <input
                    type="range"
                    min={budgetCfg.min}
                    max={budgetCfg.max}
                    step={budgetCfg.step}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="mt-2.5 w-full accent-blue-600"
                    aria-label="Daily budget"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Rs {fmt(budgetCfg.min)}</span>
                    <span>Rs {fmt(budgetCfg.max)}</span>
                  </div>
                  <h3 className="pb-2 pt-3.5 text-[13px] font-bold text-slate-900">Duration</h3>
                  <div className="flex gap-2">
                    {durations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDays(d)}
                        className={`flex-1 rounded-lg border py-2 text-[13px] font-semibold ${
                          days === d ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {d} {d === 1 ? 'day' : 'days'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analysis + estimated daily results */}
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3.5">
                  <h2 className="text-[13px] font-bold text-slate-900">Analysis</h2>
                  <p className="pt-1.5 text-xs text-slate-500">{chosen.contentType === 'reel' ? 'Reel' : 'Post'} insights so far</p>
                  <div className="flex gap-4 pt-1 text-[13px] text-slate-500">
                    <span>
                      <b className="text-slate-900">{fmt(chosen.likeCount)}</b> Likes
                    </span>
                    <span>
                      <b className="text-slate-900">{fmt(chosen.commentCount)}</b> Comments
                    </span>
                    <span>
                      <b className="text-slate-900">{fmt(chosen.shareCount)}</b> Shares
                    </span>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="pb-2 text-xs font-bold text-slate-900">Estimated daily results</p>
                    <div className="flex flex-col gap-2.5">
                      <EstimateBar label="People reached" min={reachMin} max={reachMax} scaleMax={budgetCfg.max * factors.reachPerRupeeMax} />
                      <EstimateBar label="Impressions" min={impMin} max={impMax} scaleMax={budgetCfg.max * factors.impressionsPerRupeeMax} />
                      <EstimateBar label="Link clicks" min={clickMin} max={clickMax} scaleMax={budgetCfg.max * factors.reachPerRupeeMax * factors.clicksPerReach} />
                    </div>
                    <p className="pt-2 text-[11px] text-slate-500">Estimated per day — actual results depend on how many people are online.</p>
                  </div>
                </div>

                <p className="px-0.5 pt-3 text-[13px] text-slate-500">
                  Your {chosen.contentType === 'reel' ? 'reel' : 'post'} will appear in: <b className="text-slate-900">Home feed · Reels feed · Search</b>
                </p>

                {/* Payment */}
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3.5">
                  <h2 className="text-[13px] font-bold text-slate-900">Payment summary</h2>
                  <div className="flex justify-between pt-2 text-[13px] text-slate-500">
                    <span>Daily budget</span>
                    <span>Rs {fmt(budget)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[13px] text-slate-500">
                    <span>Duration</span>
                    <span>
                      {days} {days === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 text-sm">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="flex items-center gap-2">
                      {trialApplies && <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">First boost</span>}
                      {trialApplies && <span className="text-[13px] text-slate-500 line-through">Rs {fmt(budget * days)}</span>}
                      <b className="text-slate-900">Rs {fmt(total)}</b>
                    </span>
                  </div>

                  <h3 className="pt-4 text-[13px] font-bold text-slate-900">Pay with</h3>
                  <div className="flex flex-col gap-2.5 pt-2.5">
                    {methods.map((m) => {
                      const sel = selectedMethod.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setMethodId(m.id)}
                          className={`w-full cursor-pointer rounded-xl border p-4 ${sel ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">{m.label || m.id}</span>
                            {sel && (
                              <span className="shrink-0 text-blue-600">
                                <CheckIcon size={22} />
                              </span>
                            )}
                          </div>
                          <span className="mt-2 block text-xs text-slate-500">{m.id === 'easypaisa' ? 'Till ID' : 'Account number'}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="min-w-0 flex-1 truncate text-xl font-bold text-blue-600">{m.accountNumber || ''}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyNumber(m.id, m.accountNumber || '');
                              }}
                              className="shrink-0 rounded-full border border-slate-300 px-3.5 py-1.5 text-[13px] font-medium text-slate-700 active:bg-slate-100"
                            >
                              {copiedId === m.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <span className="mt-1 block truncate text-sm font-semibold text-slate-900">{m.accountTitle || ''}</span>
                          {m.instructions && <span className="mt-1 block text-xs text-slate-500">{m.instructions}</span>}
                        </div>
                      );
                    })}
                  </div>

                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleShotChange} />
                  {shotPreview ? (
                    <>
                      <img src={shotPreview} alt="Payment screenshot" className="mt-4 h-[180px] w-full rounded-xl object-cover" />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="px-1 py-2 text-sm font-medium text-blue-600 disabled:opacity-50"
                      >
                        {uploading ? 'Uploading…' : 'Change screenshot'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading…' : 'Upload payment screenshot'}
                    </button>
                  )}

                  <label className="mt-3 block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Transaction ID</span>
                    <input
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                    />
                  </label>
                  {formError && <p className="pt-2.5 text-[13px] text-red-600">{formError}</p>}
                </div>
              </div>

              <div className="sticky bottom-0 mt-4 border-t border-slate-100 bg-white p-4">
                <button
                  type="button"
                  disabled={!shotUrl || uploading || submitting || (isBusiness && !linkValid)}
                  onClick={() => void handleSubmit()}
                  className="flex h-[52px] w-full items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white disabled:bg-slate-300"
                >
                  {submitting ? 'Sending…' : 'Boost Post Now'}
                </button>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function BoostRoute() {
  return (
    <Suspense fallback={null}>
      <BoostPage />
    </Suspense>
  );
}
