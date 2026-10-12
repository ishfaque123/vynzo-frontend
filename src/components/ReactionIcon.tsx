'use client';

// Facebook-style 3D SVG reaction icons — render consistently on all devices
// (system emojis show as boxes on some Android phones)

function Face({ children, id, from, to }: { children: React.ReactNode; id: string; from: string; to: string }) {
  return (
    <svg viewBox="0 0 36 36" className="h-full w-full">
      <defs>
        <radialGradient id={id} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill={`url(#${id})`} />
      {children}
    </svg>
  );
}

export default function ReactionIcon({ type, size = 24 }: { type: string; size?: number }) {
  const style = { width: size, height: size, display: 'inline-block', flexShrink: 0 };
  switch (type) {
    case 'like':
      return (
        <span style={style}>
          <svg viewBox="0 0 36 36" className="h-full w-full">
            <defs>
              <radialGradient id="fz-r-like" cx="35%" cy="28%" r="80%">
                <stop offset="0%" stopColor="#5BA1FF" />
                <stop offset="100%" stopColor="#1668DC" />
              </radialGradient>
            </defs>
            <circle cx="18" cy="18" r="17" fill="url(#fz-r-like)" />
            <path
              d="M15 26.5v-9.2c0-.5-.4-.9-.9-.9H11v11h3.1c.5 0 .9-.4.9-.9zM16.8 16l2.5-6.3c.2-.5.7-.8 1.2-.7.6.1 1 .6 1 1.2v4.3h5.2c.8 0 1.4.7 1.3 1.5l-1.2 6.5c-.1.7-.7 1.2-1.4 1.2h-8.6V16z"
              fill="#fff"
            />
          </svg>
        </span>
      );
    case 'love':
      return (
        <span style={style}>
          <svg viewBox="0 0 36 36" className="h-full w-full">
            <defs>
              <radialGradient id="fz-r-love" cx="35%" cy="28%" r="80%">
                <stop offset="0%" stopColor="#FF7A9E" />
                <stop offset="100%" stopColor="#E0245E" />
              </radialGradient>
            </defs>
            <circle cx="18" cy="18" r="17" fill="url(#fz-r-love)" />
            <path
              d="M18 27.5S9 21.6 9 15.7C9 12.6 11.4 10.5 14 10.5c1.7 0 3.2.9 4 2.3.8-1.4 2.3-2.3 4-2.3 2.6 0 5 2.1 5 5.2 0 5.9-9 11.8-9 11.8z"
              fill="#fff"
            />
          </svg>
        </span>
      );
    case 'haha':
      return (
        <span style={style}>
          <Face id="fz-r-haha" from="#FFE066" to="#F5A623">
            <path d="M10 15.5c1-1.6 3-1.6 4 0" stroke="#5b3b00" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M22 15.5c1-1.6 3-1.6 4 0" stroke="#5b3b00" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M10 20c2 4.5 14 4.5 16 0-2.5 1-13.5 1-16 0z" fill="#5b3b00" />
            <path d="M12.5 21.5c3 2 8 2 11 0-3 3.5-8 3.5-11 0z" fill="#fff" />
          </Face>
        </span>
      );
    case 'wow':
      return (
        <span style={style}>
          <Face id="fz-r-wow" from="#FFE066" to="#F5A623">
            <circle cx="12.5" cy="14" r="2.6" fill="#5b3b00" />
            <circle cx="23.5" cy="14" r="2.6" fill="#5b3b00" />
            <ellipse cx="18" cy="24" rx="4" ry="5" fill="#5b3b00" />
          </Face>
        </span>
      );
    case 'sad':
      return (
        <span style={style}>
          <Face id="fz-r-sad" from="#FFE066" to="#F5A623">
            <circle cx="12.5" cy="14" r="2.2" fill="#5b3b00" />
            <circle cx="23.5" cy="14" r="2.2" fill="#5b3b00" />
            <path d="M27 12.5c1.5 2.5 1.5 5-0.5 7-1-2-1-4.5 0.5-7z" fill="#4AA8FF" />
            <path d="M12 24c2-2.5 10-2.5 12 0" stroke="#5b3b00" strokeWidth="2" fill="none" strokeLinecap="round" />
          </Face>
        </span>
      );
    case 'angry':
      return (
        <span style={style}>
          <Face id="fz-r-angry" from="#FF9A5A" to="#E8590C">
            <path d="M9 12l6 2.5" stroke="#5b2500" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M27 12l-6 2.5" stroke="#5b2500" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="13" cy="17.5" r="2.2" fill="#5b2500" />
            <circle cx="23" cy="17.5" r="2.2" fill="#5b2500" />
            <path d="M12 25.5c2-2.5 10-2.5 12 0" stroke="#5b2500" strokeWidth="2" fill="none" strokeLinecap="round" />
          </Face>
        </span>
      );
    default:
      return null;
  }
}
