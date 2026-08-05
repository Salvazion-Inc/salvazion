'use client';

/** Salvazion HUD media icons (camera / folders) shared by profile + health photo flows */

export const SALVAZION_CAMERA_ICON = '/icons/ui/camera.jpg';
export const SALVAZION_FOLDER_ICON = '/icons/ui/folder.jpg';

export function SalvazionMediaIcon({
  src,
  alt = '',
  size = 40,
  className = '',
}: {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[#040404] lion-glow ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : true}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        draggable={false}
      />
    </span>
  );
}
