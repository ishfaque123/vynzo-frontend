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
  type BoostPlan,
} from '@/lib/api/boostApi';
import { fetchUserPosts } from '@/lib/api/postApi';
import { fetchUserReels } from '@/lib/api/reelApi';
import { uploadChatMedia } from '@/lib/api/messageApi';

// Boost page (web) — mirrors the native BoostScreen flow step for step:
// (choose item, only when opened without one) -> preview -> Purpose ->
// Budget -> Payment -> success. Prices, estimates, purposes and payment
// details come ONLY from GET /api/boosts/config; the fallbacks below
// mirror the contract exactly and are used only if a payload list ever
// arrives empty, so the flow never dead-ends. Amounts are never sent:
// the server re-derives the charged amount from the chosen plan.
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

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

interface ChosenItem {
  contentType: 'post' | 'reel';
  contentId: string;
  text: string | null;
  imageUrl: string | null;
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

function StepIndicator({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  const labels = ['Purpose', 'Budget', 'Payment'];
  return (
    <div className="flex items-center px-4 py-3">
      {labels.map((label, i) => (
        <div key={label} className={`flex items-center ${i < labels.length - 1 ? 'flex-1' : ''}`}>
          <button
            type="button"
            disabled={i >= step}
            onClick={() => i < step && onStep(i)}
            className="flex items-center gap-1.5"
          >
            <span
              className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {i < step ? <CheckIcon size={13} /> : i + 1}
            </span>
            <span className={`text-[13px] ${i === step ? 'font-semibold text-slate-900' : i < step ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
          </button>
          {i < labels.length - 1 && <span className={`mx-2 h-0.5 flex-1 rounded ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function PreviewCard({ item }: { item: ChosenItem }) {
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

function BoostPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { checked: appChecked, inApp } = useInFrianzoAppChecked();
  const { user, loading: authLoading } = useAuth();

  const paramType = params.get('type') === 'reel' ? 'reel' : 'post';
  const paramId = params.get('id');
  const presetPurpose = params.get('purpose');
  const presetDays = params.get('days') ? Number(params.get('days')) : null;
  const startAtPayment = params.get('step') === 'payment' && !!paramId;

  const [config, setConfig] = useState<BoostConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<ChosenItem | null>(null);
  const [choices, setChoices] = useState<ChosenItem[] | null>(null);
  const [step, setStep] = useState(startAtPayment ? 2 : 0);
  const [purpose, setPurpose] = useState<string | null>(presetPurpose);
  const [planDays, setPlanDays] = useState<number | null>(presetDays);
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

  // Preselected item (per-post / per-reel Boost button, or Dobara
  // Boost): load its preview from the existing reads.
  useEffect(() => {
    if (!inApp || !user || !paramId) return;
    let cancelled = false;
    (async () => {
      try {
        if (paramType === 'reel') {
          const r = await fetchBoostReelPreview(paramId);
          const reel = r?.data?.reel;
          if (!cancelled && reel) {
            setChosen({ contentType: 'reel', contentId: paramId, text: reel.caption ?? null, imageUrl: reel.thumbnailUrl ?? null });
          }
        } else {
          const r = await fetchBoostPostPreview(paramId);
          const post = r?.data?.post;
          if (!cancelled && post) {
            setChosen({ contentType: 'post', contentId: paramId, text: post.content ?? null, imageUrl: post.imageUrl ?? post.imageThumbUrl ?? null });
          }
        }
      } catch {
        // Preview is cosmetic; the flow still works without it.
        if (!cancelled) setChosen({ contentType: paramType, contentId: paramId, text: null, imageUrl: null });
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
        items.push({ contentType: 'post', contentId: p.id, text: p.content ?? null, imageUrl: p.imageUrl ?? p.imageThumbUrl ?? null, createdAt: p.createdAt || '' });
      }
      for (const r of reelsRes?.data?.reels || []) {
        items.push({ contentType: 'reel', contentId: r.id, text: r.caption ?? null, imageUrl: r.thumbnailUrl ?? null, createdAt: r.createdAt || '' });
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
    if (step > 0) {
      setStep(step - 1);
    } else if (!paramId && chosen) {
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
                      onClick={() => {
                        setChosen(item);
                        setStep(0);
                      }}
                      className="text-left"
                    >
                      <PreviewCard item={item} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <StepIndicator step={step} onStep={setStep} />
              <div className="px-4">
                <PreviewCard item={chosen} />
                <div className="pt-5">
                  {step === 0 && (
                    <>
                      <h2 className="text-base font-semibold text-slate-900">Why are you boosting?</h2>
                      <div className="flex flex-col gap-2.5 pt-3">
                        {(cfg.purposes?.length ? cfg.purposes : FALLBACK_PURPOSES).map((p) => {
                          const sel = purpose === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPurpose(p.id)}
                              className={`flex w-full items-center gap-2 rounded-xl border p-4 text-left ${
                                sel ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-base font-semibold text-slate-900">{p.label || boostPurposeLabel(p.id)}</span>
                                {p.description && <span className="mt-0.5 block text-[13px] text-slate-500">{p.description}</span>}
                              </span>
                              {sel && (
                                <span className="shrink-0 text-blue-600">
                                  <CheckIcon size={22} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <h2 className="text-base font-semibold text-slate-900">Choose your budget</h2>
                      <div className="flex flex-col gap-2.5 pt-3">
                        {(cfg.plans || []).map((plan: BoostPlan) => {
                          const sel = planDays === plan.days;
                          const trialPrice = cfg.firstBoostTrial?.available && cfg.firstBoostTrial.planDays === plan.days ? cfg.firstBoostTrial.amountPkr : null;
                          return (
                            <button
                              key={plan.days}
                              type="button"
                              onClick={() => setPlanDays(plan.days)}
                              className={`flex w-full items-center gap-2 rounded-xl border p-4 text-left ${
                                sel ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-[22px] font-bold leading-none text-blue-600">Rs {fmt(trialPrice ?? plan.amountPkr)}</span>
                                  {trialPrice !== null && (
                                    <>
                                      <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">First boost</span>
                                      <span className="text-[13px] text-slate-500 line-through">Rs {fmt(plan.amountPkr)}</span>
                                    </>
                                  )}
                                </span>
                                <span className="mt-1 block text-[13px] text-slate-500">{plan.days === 1 ? '1 day' : `${plan.days} days`}</span>
                                <span className="mt-1.5 block text-xs text-slate-500">
                                  Andazan views: {fmt(plan.estViewsMin)} - {fmt(plan.estViewsMax)}
                                </span>
                                <span className="block text-xs text-slate-500">
                                  Andazan clicks: {fmt(plan.estClicksMin)} - {fmt(plan.estClicksMax)}
                                </span>
                              </span>
                              {sel && (
                                <span className="shrink-0 text-blue-600">
                                  <CheckIcon size={22} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      {(() => {
                        const methods = cfg.paymentMethods?.length ? cfg.paymentMethods : FALLBACK_METHODS;
                        const selectedMethod = methods.find((m) => m.id === methodId) || methods[0];
                        const selectedPlan = (cfg.plans || []).find((p) => p.days === planDays) || null;
                        const price = selectedPlan
                          ? cfg.firstBoostTrial?.available && cfg.firstBoostTrial.planDays === selectedPlan.days
                            ? cfg.firstBoostTrial.amountPkr
                            : selectedPlan.amountPkr
                          : null;
                        return (
                          <>
                            <p className="truncate text-[13px] font-semibold text-blue-600">
                              {boostPurposeLabel(purpose)}
                              {selectedPlan ? ` · ${selectedPlan.days === 1 ? '1 day' : `${selectedPlan.days} days`}` : ''}
                              {price !== null ? ` · Rs ${fmt(price)}` : ''}
                            </p>
                            <h2 className="pt-3 text-base font-semibold text-slate-900">Pay with</h2>
                            <div className="flex flex-col gap-2.5 pt-3">
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
                              <span className="mb-1 block text-sm font-medium text-slate-700">Transaction ID (optional)</span>
                              <input
                                value={txnId}
                                onChange={(e) => setTxnId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                              />
                            </label>
                            {formError && <p className="pt-2.5 text-[13px] text-red-600">{formError}</p>}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 mt-4 border-t border-slate-100 bg-white p-4">
                {step < 2 ? (
                  <button
                    type="button"
                    disabled={step === 0 ? !purpose : !planDays}
                    onClick={() => setStep(step + 1)}
                    className="flex h-[52px] w-full items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white disabled:bg-slate-300"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!shotUrl || uploading || submitting}
                    onClick={async () => {
                      if (!purpose || !planDays || !shotUrl || !chosen) return;
                      const methods = cfg.paymentMethods?.length ? cfg.paymentMethods : FALLBACK_METHODS;
                      const selectedMethod = methods.find((m) => m.id === methodId) || methods[0];
                      setSubmitting(true);
                      setFormError(null);
                      try {
                        const r = await createBoostRequest({
                          contentType: chosen.contentType,
                          postId: chosen.contentType === 'post' ? chosen.contentId : null,
                          reelId: chosen.contentType === 'reel' ? chosen.contentId : null,
                          purpose,
                          planDays,
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
                    }}
                    className="flex h-[52px] w-full items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white disabled:bg-slate-300"
                  >
                    {submitting ? 'Sending…' : 'Submit Boost Request'}
                  </button>
                )}
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
