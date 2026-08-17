/**
 * Official Salvazion mark on a transparent field — no black square.
 * CSS HUD ring supplies motion; the lion stays still.
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
      <span className="brand-loader-mark" style={{ width: size, height: size }}>
        <span className="brand-loader-halo" aria-hidden />
        <span className="brand-loader-orbit brand-loader-orbit-a" aria-hidden />
        <span className="brand-loader-orbit brand-loader-orbit-b" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/videos/logo-loader-poster.png"
          alt=""
          width={size}
          height={size}
          className="brand-loader-static"
          aria-hidden
        />
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
