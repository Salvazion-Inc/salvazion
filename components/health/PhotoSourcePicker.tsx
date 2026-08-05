'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  SALVAZION_CAMERA_ICON,
  SALVAZION_FOLDER_ICON,
  SalvazionMediaIcon,
} from '@/components/ui/MediaIcons';

export {
  SALVAZION_CAMERA_ICON,
  SALVAZION_FOLDER_ICON,
  SalvazionMediaIcon,
} from '@/components/ui/MediaIcons';

type Props = {
  /** Called with a selected image file from camera or gallery */
  onFile: (file: File) => void;
  /** Optional clear/remove current photo */
  onClear?: () => void;
  lang?: 'es' | 'en';
  className?: string;
  /** Prefer rear camera when using capture (meal/body = environment) */
  facing?: 'environment' | 'user';
  /** Compact layout for body view grid cells */
  compact?: boolean;
  /** Whether a photo is already set (drives "Cambiar foto" vs "Añadir foto") */
  hasPhoto?: boolean;
  /** Preview / frame (image or empty state) */
  children?: ReactNode;
  /** Sheet title override */
  title?: string;
  /** Sheet subtitle override */
  subtitle?: string;
  /** Aspect class for the tappable frame when no custom children layout */
  frameClassName?: string;
  disabled?: boolean;
};

/**
 * Same UX as ProfileAvatar "Cambiar foto":
 * tap preview → action sheet → Cámara | Galería / carpetas
 * with Salvazion HUD icons.
 */
export default function PhotoSourcePicker({
  onFile,
  onClear,
  lang,
  children,
  className = '',
  facing = 'environment',
  compact = false,
  hasPhoto = false,
  title,
  subtitle,
  frameClassName,
  disabled = false,
}: Props) {
  const { t, lang: i18nLang } = useI18n();
  const es = (lang ?? i18nLang) !== 'en';
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = () => {
    if (disabled) return;
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  const openCamera = () => {
    closeSheet();
    requestAnimationFrame(() => {
      if (cameraRef.current) {
        cameraRef.current.value = '';
        cameraRef.current.click();
      }
    });
  };

  const openGallery = () => {
    closeSheet();
    requestAnimationFrame(() => {
      if (galleryRef.current) {
        galleryRef.current.value = '';
        galleryRef.current.click();
      }
    });
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    onFile(file);
    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  };

  const handleClear = () => {
    closeSheet();
    onClear?.();
  };

  const sheetTitle =
    title || (hasPhoto ? t('profile.changePhoto') : t('profile.addPhoto'));
  const sheetSub =
    subtitle ||
    (es
      ? 'Usa la cámara o elige una imagen de tus carpetas'
      : 'Use the camera or pick an image from your files');

  const badgeSize = compact ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-xs';

  return (
    <div className={`flex flex-col ${compact ? 'items-stretch' : 'items-center'} ${className}`}>
      <div className={`relative ${compact ? 'w-full' : 'w-full'}`}>
        <button
          type="button"
          onClick={openSheet}
          disabled={disabled}
          className={
            frameClassName ||
            (compact
              ? 'relative w-full aspect-[3/4] rounded-xl border-2 border-[#8FD99A]/40 bg-[#040404] overflow-hidden flex items-center justify-center hover:border-[#8FD99A] transition-all disabled:opacity-50'
              : 'relative w-full aspect-[16/10] rounded-2xl border-2 border-[#8FD99A]/40 bg-[#040404] overflow-hidden flex items-center justify-center hover:border-[#8FD99A] transition-all lion-glow disabled:opacity-50')
          }
          aria-label={sheetTitle}
        >
          {children}
        </button>

        {/* Edit badge — same pattern as profile */}
        <button
          type="button"
          onClick={openSheet}
          disabled={disabled}
          className={`absolute -bottom-1 -right-1 ${badgeSize} rounded-full bg-[#7BC98A] text-[#040404] flex items-center justify-center shadow-[0_0_12px_rgba(143,217,154,0.45)] border border-[#040404] hover:scale-105 transition z-[1]`}
          aria-label={t('profile.changePhoto')}
          title={t('profile.changePhoto')}
        >
          ✎
        </button>
      </div>

      <div className={`mt-2 flex flex-col ${compact ? 'items-center' : 'items-center'} gap-1`}>
        <button
          type="button"
          onClick={openSheet}
          disabled={disabled}
          className={`text-[#8FD99A] hover:underline disabled:opacity-50 ${
            compact ? 'text-[10px]' : 'text-xs'
          }`}
        >
          {hasPhoto ? t('profile.changePhoto') : t('profile.addPhoto')}
        </button>
        {hasPhoto && onClear && !compact && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-[11px] text-[#B7F7AC]/50 hover:text-red-400 transition disabled:opacity-50"
          >
            {t('profile.removePhoto')}
          </button>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={facing}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={sheetTitle}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            aria-label={es ? 'Cerrar' : 'Close'}
            onClick={closeSheet}
          />
          <div className="relative z-10 w-full max-w-sm mx-4 mb-6 sm:mb-0 glass rounded-2xl border border-[var(--border-soft)] overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.55)]">
            <div className="px-4 pt-4 pb-2 text-center border-b border-[var(--border-soft)]">
              <p className="text-sm font-semibold text-white">{sheetTitle}</p>
              <p className="text-[11px] text-[var(--sage)] mt-1">{sheetSub}</p>
            </div>

            <div className="p-3 space-y-2">
              <button
                type="button"
                onClick={openCamera}
                disabled={disabled}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-active)] transition text-left"
              >
                <SalvazionMediaIcon src={SALVAZION_CAMERA_ICON} alt="" size={40} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">
                    {t('profile.takePhoto')}
                  </span>
                  <span className="block text-[11px] text-[var(--sage)]">
                    {t('profile.takePhotoHint')}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={openGallery}
                disabled={disabled}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-active)] transition text-left"
              >
                <SalvazionMediaIcon src={SALVAZION_FOLDER_ICON} alt="" size={40} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">
                    {t('profile.chooseGallery')}
                  </span>
                  <span className="block text-[11px] text-[var(--sage)]">
                    {t('profile.chooseGalleryHint')}
                  </span>
                </span>
              </button>

              {hasPhoto && onClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 text-red-300/90 hover:bg-red-500/10 transition text-left"
                >
                  <span className="w-10 h-10 rounded-full border border-red-500/30 flex items-center justify-center text-sm shrink-0">
                    ✕
                  </span>
                  <span className="text-sm font-medium">{t('profile.removePhoto')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeSheet}
                className="btn-secondary w-full py-3 text-sm mt-1"
              >
                {es ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
