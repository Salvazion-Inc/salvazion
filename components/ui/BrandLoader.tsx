/**
 * Official Salvazion logo loop — used on page loads instead of copy.
 * Silent by design: no “the Lion is working” line.
 */
export default function BrandLoader({
  size = 140,
  label = 'Salvazion',
  fullscreen = false,
  className = '',
}: {
  size?: number;
  /** Accessible name only (visually hidden). */
  label?: string;
  fullscreen?: boolean;
  className?: string;
}) {
  const mark = (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt=""
          width={size}
          height={size}
          className="brand-loader-static pointer-events-none select-none lion-glow absolute inset-0 h-full w-full object-contain"
          aria-hidden
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/logo-icon.png"
          width={size}
          height={size}
          className="brand-loader-video pointer-events-none select-none lion-glow h-full w-full object-contain"
          aria-hidden
        >
          <source src="/videos/logo-loader.mp4" type="video/mp4" />
        </video>
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );

  if (!fullscreen) return mark;

  return (
    <div className="min-h-[100dvh] bg-[var(--true-black)] flex items-center justify-center">
      {mark}
    </div>
  );
}
