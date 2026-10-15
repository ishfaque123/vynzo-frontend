export default function GooglePlayButton({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const isSm = size === 'sm';
  return (
    <a
      href="https://play.google.com/store/apps/details?id=com.frianzo.app"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get Frianzo on Google Play"
      className="inline-block transition hover:opacity-90 hover:brightness-110"
    >
      <span
        className={`flex items-center rounded-xl bg-black shadow-lg ${
          isSm ? 'gap-2 px-3.5 py-1.5' : 'gap-3 px-5 py-2.5'
        }`}
      >
        <svg viewBox="0 0 100 100" className={isSm ? 'h-6 w-6 shrink-0' : 'h-9 w-9 shrink-0'} aria-hidden="true">
          <polygon points="10,50 50,30 50,50 50,70" fill="#00A0FF" />
          <polygon points="50,30 90,10 90,38 50,50" fill="#00F076" />
          <polygon points="50,50 90,38 90,62" fill="#FFCE00" />
          <polygon points="50,50 90,62 90,90 50,70" fill="#FF3A44" />
        </svg>
        <span className="flex flex-col items-start leading-none">
          <span className={`font-medium uppercase tracking-wider text-white/90 ${isSm ? 'text-[8px]' : 'text-[10px]'}`}>
            Get it on
          </span>
          <span className={`font-semibold text-white ${isSm ? 'mt-0.5 text-base' : 'mt-1 text-2xl'}`}>
            Google Play
          </span>
        </span>
      </span>
    </a>
  );
}
