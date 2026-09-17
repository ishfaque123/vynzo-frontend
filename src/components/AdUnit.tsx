'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8689135580842158';

export default function AdUnit() {
  const pushed = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);

  function pushAd() {
    if (pushed.current) return;
    pushed.current = true;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      pushed.current = false;
    }
  }

  useEffect(() => {
    if (scriptReady) pushAd();
  }, [scriptReady]);

  return (
    <>
      <Script
        id="frianzo-adsense"
        async
        src={ADSENSE_SRC}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div style={{ width: '100%', maxHeight: 280, overflow: 'hidden' }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', maxHeight: 280 }}
          data-ad-client="ca-pub-8689135580842158"
          data-ad-slot="8018318674"
          data-ad-format="rectangle"
          data-full-width-responsive="true"
        />
      </div>
    </>
  );
}
