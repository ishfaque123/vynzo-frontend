// House sponsored card (DKSMM) shown in the home feed.
// Pure presentational component: no hooks, no scripts, no external requests.
const DKSMM_URL = 'https://dksmm.com';

export default function SponsoredCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-[17px] font-extrabold text-white">
          D
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold leading-tight text-slate-900 dark:text-slate-100">DKSMM.com</div>
          <div className="text-[11.5px] text-slate-500 dark:text-slate-400">Sponsored · dksmm.com</div>
        </div>
        <div className="px-1 text-base tracking-widest text-slate-400">•••</div>
      </div>

      <p className="px-3 pb-2.5 text-[13.5px] leading-snug text-slate-800 dark:text-slate-200">
        Apne accounts ko grow karo — <span className="font-semibold">Followers, Likes aur Views</span>, sab services ek hi jagah, saste daam mein.
      </p>

      <a href={DKSMM_URL} target="_blank" rel="noopener noreferrer" className="block bg-gradient-to-br from-indigo-950 via-violet-800 to-purple-600 px-4 py-5 text-white">
        <span className="inline-block rounded-full border border-white/40 bg-white/15 px-2.5 py-1 text-[10.5px] font-bold tracking-wider">
          PAKISTAN KA APNA SMM PANEL
        </span>
        <span className="mt-2.5 block text-[23px] font-extrabold leading-tight">
          Grow Your
          <br />
          Social Media
        </span>
        <span className="mt-1.5 block text-[13px] text-white/90">Followers · Likes · Views — Fast Delivery, Best Rates</span>
      </a>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">DKSMM — SMM Panel</div>
          <div className="text-[11.5px] text-slate-500 dark:text-slate-400">dksmm.com</div>
        </div>
        <a
          href={DKSMM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900"
        >
          Visit Website
        </a>
      </div>
    </div>
  );
}
