'use client';
import { useEffect, useRef } from 'react';

export default function AdUnit() {
  const ref = useRef<HTMLModElement>(null);
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
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-8689135580842158"
      data-ad-slot="8018318674"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
