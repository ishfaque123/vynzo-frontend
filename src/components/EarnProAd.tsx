import React from 'react';

// House ad: EarnPro (earnpro.site) — image creative hosted on the media bucket.
const EARNPRO_URL = 'https://earnpro.site';
const AD_IMAGE = 'https://pub-72f9ea3dc70249cdb12b7e61642d0bb7.r2.dev/earnpro-ad.webp';

export default function EarnProAd() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <a href={EARNPRO_URL} target="_blank" rel="noopener noreferrer sponsored" className="block">
        <div className="flex items-center gap-2.5 px-3 pt-3 pb-2.5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shrink-0">
            <span className="text-white font-extrabold text-lg leading-none">E</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-[15px] leading-tight">EarnPro.site</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">Sponsored · earnpro.site</p>
          </div>
          <span className="text-gray-400 text-lg leading-none px-1" aria-hidden="true">•••</span>
        </div>
        <img
          src={AD_IMAGE}
          alt="EarnPro — Earn Money From Mobile"
          className="w-full h-auto block"
          loading="lazy"
        />
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 leading-tight">EarnPro — Online Earning</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">earnpro.site</p>
          </div>
          <span className="bg-orange-600 text-white text-[13px] font-bold px-4 py-2 rounded-lg shrink-0 ml-3">
            Join Now
          </span>
        </div>
      </a>
    </div>
  );
}
