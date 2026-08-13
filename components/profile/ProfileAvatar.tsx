'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { saveAvatarImage } from '@/lib/store/avatar';
import { saveProfile } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import { useFlashToast } from '@/components/ui/FlashToast';
import {
  SALVAZION_CAMERA_ICON,
  SALVAZION_FOLDER_ICON,
  SalvazionMediaIcon,
} from '@/components/ui/MediaIcons';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { box: string; px: number; badge: string }> = {
  sm: { box: 'w-10 h-10', px: 40, badge: 'w-4 h-4 text-[9px]' },
  md: { box: 'w-14 h-14', px: 56, badge: 'w-5 h-5 text-[10px]' },
  lg: { box: 'w-20 h-20', px: 80, badge: 'w-7 h-7 text-xs' },
  xl: { box: 'w-28 h-28', px: 112, badge: 'w-8 h-8 text-sm' },
};

interface Props {
  avatarUrl?: string | null;
  name?: string;
  editable?: boolean;
  size?: Size;
  className?: string;
  onChange?: (avatarUrl: string | undefined) => void;
}

/**
 * Profile photo with optional edit:
 * - Camera (capture)
 * - Gallery / folders (file picker without capture)
 */
export default function ProfileAvatar({
  avatarUrl,
  name = 'Salvazion',
  editable = false,
  size = 'lg',
  className = '',
  onChange,
}: Props) {
  const { t, lang } = useI18n();
  const tx = (en: string, es: string, pt: string) =>
    lang === 'pt' ? pt : lang === 'es' ? es : en;
  const { flash, toast: saveToast } = useFlashToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** When set, overrides prop until parent re-passes a matching avatarUrl via key remount or onChange. */
  const [localOverride, setLocalOverride] = useState<
    { active: false } | { active: true; url?: string }
  >({ active: false });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imgEpoch, setImgEpoch] = useState(0);
  const [imgBroken, setImgBroken] = useState(false);

  // External sync (other device / server refresh): drop local override when prop changes
  useEffect(() => {
    setLocalOverride({ active: false });
    setImgEpoch((n) => n + 1);
    setImgBroken(false);
  }, [avatarUrl]);

  const displayUrl = localOverride.active
    ? localOverride.url
    : avatarUrl || undefined;
  const showPhoto = Boolean(displayUrl) && !imgBroken;
  const dim = SIZES[size];

  const openSheet = () => {
    if (!editable || busy) return;
    setError(null);
    setSheetOpen(true);
  };

  const closeSheet = () => setSheetOpen(false);

  const openCamera = () => {
    closeSheet();
    // Defer so sheet unmount doesn't swallow the click on iOS
    requestAnimationFrame(() => cameraInputRef.current?.click());
  };

  const openGallery = () => {
    closeSheet();
    requestAnimationFrame(() => galleryInputRef.current?.click());
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await saveAvatarImage(file);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLocalOverride({ active: true, url: result.avatarUrl });
      setImgEpoch((n) => n + 1);
      // Always persist to profiles (remote URL already written by upload when possible)
      await saveProfile({ avatarUrl: result.avatarUrl });
      onChange?.(result.avatarUrl);
      if (!result.remote) {
        setError(
          tx(
            'Cloud upload failed. Photo is only on this device and will not show on mobile. Check SUPABASE_SERVICE_ROLE_KEY and the avatars bucket, then upload again.',
            'No se pudo subir a la nube. La foto solo está en este dispositivo y no aparecerá en mobile. Revisa SUPABASE_SERVICE_ROLE_KEY y el bucket avatars, luego vuelve a subirla.',
            'Não foi possível enviar para a nuvem. A foto só está neste dispositivo e não aparecerá no mobile. Revise SUPABASE_SERVICE_ROLE_KEY e o bucket avatars e envie de novo.'
          )
        );
      } else {
        flash(t('common.changesSaved'));
      }
    } finally {
      setBusy(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    if (!editable || busy) return;
    closeSheet();
    setBusy(true);
    setError(null);
    try {
      setLocalOverride({ active: true, url: undefined });
      await saveProfile({ avatarUrl: '' });
      onChange?.(undefined);
      flash(t('common.updated'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {saveToast}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={openSheet}
          disabled={!editable || busy}
          className={`${dim.box} rounded-full border-2 border-[#8FD99A]/50 lion-glow overflow-hidden bg-[#040404] relative ${
            editable ? 'cursor-pointer hover:border-[#8FD99A] transition-all' : 'cursor-default'
          }`}
          aria-label={editable ? t('profile.changePhoto') : name}
        >
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${displayUrl}#${imgEpoch}`}
              src={displayUrl}
              alt={name}
              width={dim.px}
              height={dim.px}
              className="w-full h-full object-cover"
              decoding="async"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <Image
              src="/logo-icon.png"
              alt={name}
              width={dim.px}
              height={dim.px}
              className="object-cover w-full h-full"
            />
          )}
          {busy && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[#8FD99A]/40 border-t-[#8FD99A] rounded-full animate-spin" />
            </div>
          )}
        </button>

        {editable && (
          <button
            type="button"
            onClick={openSheet}
            disabled={busy}
            className={`absolute -bottom-0.5 -right-0.5 ${dim.badge} rounded-full bg-[#7BC98A] text-[#040404] flex items-center justify-center shadow-[0_0_12px_rgba(143,217,154,0.45)] border border-[#040404] hover:scale-105 transition`}
            aria-label={t('profile.changePhoto')}
            title={t('profile.changePhoto')}
          >
            ✎
          </button>
        )}

        {editable && (
          <>
            {/* Cámara frontal / trasera del dispositivo */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
            {/* Galería / carpetas / archivos */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </>
        )}
      </div>

      {editable && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={openSheet}
            disabled={busy}
            className="text-xs text-[#8FD99A] hover:underline disabled:opacity-50"
          >
            {displayUrl ? t('profile.changePhoto') : t('profile.addPhoto')}
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="text-[11px] text-[#B7F7AC]/50 hover:text-red-400 transition disabled:opacity-50"
            >
              {t('profile.removePhoto')}
            </button>
          )}
          {error && (
            <p className="text-[11px] text-red-400 text-center max-w-[220px]">{error}</p>
          )}
        </div>
      )}

      {/* Action sheet: Cámara | Galería */}
      {sheetOpen && editable && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={tx('Choose profile photo', 'Elegir foto de perfil', 'Escolher foto de perfil')}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            aria-label={tx('Close', 'Cerrar', 'Fechar')}
            onClick={closeSheet}
          />
          <div className="relative z-10 w-full max-w-sm mx-4 mb-6 sm:mb-0 glass rounded-2xl border border-[var(--border-soft)] overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.55)]">
            <div className="px-4 pt-4 pb-2 text-center border-b border-[var(--border-soft)]">
              <p className="text-sm font-semibold text-white">
                {displayUrl ? t('profile.changePhoto') : t('profile.addPhoto')}
              </p>
              <p className="text-[11px] text-[var(--sage)] mt-1">
                {tx(
                  'Use the camera or pick an image from your files',
                  'Usa la cámara o elige una imagen de tus carpetas',
                  'Use a câmera ou escolha uma imagem das suas pastas'
                )}
              </p>
            </div>

            <div className="p-3 space-y-2">
              <button
                type="button"
                onClick={openCamera}
                disabled={busy}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-active)] transition text-left"
              >
                <SalvazionMediaIcon src={SALVAZION_CAMERA_ICON} size={40} />
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
                disabled={busy}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-active)] transition text-left"
              >
                <SalvazionMediaIcon src={SALVAZION_FOLDER_ICON} size={40} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">
                    {t('profile.chooseGallery')}
                  </span>
                  <span className="block text-[11px] text-[var(--sage)]">
                    {t('profile.chooseGalleryHint')}
                  </span>
                </span>
              </button>

              {displayUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={busy}
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
                {tx('Cancel', 'Cancelar', 'Cancelar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
