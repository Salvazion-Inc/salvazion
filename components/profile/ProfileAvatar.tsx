'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { saveAvatarImage } from '@/lib/store/avatar';
import { saveProfile } from '@/lib/store/profile';

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
 * Profile photo with optional in-place edit (camera badge).
 * Default fallback: Salvazion lion logo.
 */
export default function ProfileAvatar({
  avatarUrl,
  name = 'Salvazion',
  editable = false,
  size = 'lg',
  className = '',
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | undefined>(avatarUrl || undefined);

  useEffect(() => {
    setLocalUrl(avatarUrl || undefined);
  }, [avatarUrl]);

  const displayUrl = localUrl;
  const dim = SIZES[size];

  const openPicker = () => {
    if (!editable || busy) return;
    inputRef.current?.click();
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
      setLocalUrl(result.avatarUrl);
      await saveProfile({ avatarUrl: result.avatarUrl });
      onChange?.(result.avatarUrl);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    if (!editable || busy) return;
    setBusy(true);
    setError(null);
    try {
      setLocalUrl(undefined);
      await saveProfile({ avatarUrl: '' });
      onChange?.(undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={openPicker}
          disabled={!editable || busy}
          className={`${dim.box} rounded-full border-2 border-[#00F511]/50 lion-glow overflow-hidden bg-[#040404] relative ${
            editable ? 'cursor-pointer hover:border-[#00F511] transition-all' : 'cursor-default'
          }`}
          aria-label={editable ? 'Cambiar foto de perfil' : name}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={name}
              width={dim.px}
              height={dim.px}
              className="w-full h-full object-cover"
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
              <div className="w-5 h-5 border-2 border-[#00F511]/40 border-t-[#00F511] rounded-full animate-spin" />
            </div>
          )}
        </button>

        {editable && (
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className={`absolute -bottom-0.5 -right-0.5 ${dim.badge} rounded-full bg-[#00F511] text-[#040404] flex items-center justify-center shadow-[0_0_12px_rgba(0,245,17,0.45)] border border-[#040404] hover:scale-105 transition`}
            aria-label="Editar foto"
            title="Cambiar foto"
          >
            ✎
          </button>
        )}

        {editable && (
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="user"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
        )}
      </div>

      {editable && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="text-xs text-[#00F511] hover:underline disabled:opacity-50"
          >
            {displayUrl ? 'Cambiar foto' : 'Añadir foto'}
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="text-[11px] text-[#B7F7AC]/50 hover:text-red-400 transition disabled:opacity-50"
            >
              Quitar foto
            </button>
          )}
          {error && (
            <p className="text-[11px] text-red-400 text-center max-w-[220px]">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
