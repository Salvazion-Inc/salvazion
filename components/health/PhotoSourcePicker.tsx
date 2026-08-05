'use client';

import { useRef, type ReactNode } from 'react';

type Props = {
  /** Called with a selected image file from camera or gallery */
  onFile: (file: File) => void;
  lang?: 'es' | 'en';
  /** Optional preview area (e.g. current photo). Tap does nothing alone. */
  children?: ReactNode;
  className?: string;
  /** Prefer rear camera when using capture */
  facing?: 'environment' | 'user';
  /** Compact layout for grid cells (body views) */
  compact?: boolean;
};

/**
 * Explicit camera vs gallery pickers.
 * Mobile: capture= opens the device camera; gallery input has no capture so the photo library opens.
 * Desktop: both open a file dialog (camera may offer webcam depending on OS).
 */
export default function PhotoSourcePicker({
  onFile,
  lang = 'es',
  children,
  className = '',
  facing = 'environment',
  compact = false,
}: Props) {
  const es = lang !== 'en';
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);

  const handle = (file: File | null | undefined) => {
    if (file) onFile(file);
  };

  const clearAndOpen = (el: HTMLInputElement | null) => {
    if (!el) return;
    // Allow re-selecting the same file
    el.value = '';
    el.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {children}

      <div
        className={
          compact
            ? 'grid grid-cols-2 gap-1'
            : 'grid grid-cols-2 gap-2'
        }
      >
        <button
          type="button"
          onClick={() => clearAndOpen(cameraRef.current)}
          className={
            compact
              ? 'rounded-lg border border-[var(--border-strong)] bg-[var(--surface)]/70 py-1.5 text-[9px] text-[#8FD99A] active:scale-[0.98]'
              : 'btn-outline-sm py-2.5 text-[11px] flex items-center justify-center gap-1.5'
          }
        >
          <span aria-hidden>📷</span>
          {es ? 'Cámara' : 'Camera'}
        </button>
        <button
          type="button"
          onClick={() => clearAndOpen(galleryRef.current)}
          className={
            compact
              ? 'rounded-lg border border-[var(--border-soft)] bg-[var(--surface)]/50 py-1.5 text-[9px] text-[var(--sage)] active:scale-[0.98]'
              : 'btn-outline-sm py-2.5 text-[11px] flex items-center justify-center gap-1.5'
          }
        >
          <span aria-hidden>🖼</span>
          {es ? 'Galería' : 'Gallery'}
        </button>
      </div>

      {/* Camera — capture attribute prefers device camera on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={facing}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {/* Gallery — no capture so OS opens photo library / file picker */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
