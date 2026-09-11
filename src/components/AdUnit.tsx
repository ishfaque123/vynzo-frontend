'use client';
import { useEffect, useRef } from 'react';

export default function AdUnit() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
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
  );
}
