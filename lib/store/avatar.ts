import { createClient } from '@/lib/supabase/client';

const MAX_EDGE = 512;
const JPEG_QUALITY = 0.82;
const MAX_DATA_URL_CHARS = 450_000; // ~ keep localStorage safe

export type AvatarProcessResult =
  | { ok: true; dataUrl: string; blob: Blob }
  | { ok: false; error: string };

/**
 * Resize + compress an image File for profile use (square-ish cover crop center).
 */
export async function processAvatarFile(file: File): Promise<AvatarProcessResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Elige una imagen (JPG, PNG o WebP).' };
  }
  if (file.size > 12 * 1024 * 1024) {
    return { ok: false, error: 'La imagen es demasiado grande (máx. 12 MB).' };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const size = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - size) / 2);
    const sy = Math.floor((bitmap.height - size) / 2);
    const edge = Math.min(MAX_EDGE, size);

    const canvas = document.createElement('canvas');
    canvas.width = edge;
    canvas.height = edge;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return { ok: false, error: 'No se pudo procesar la imagen en este dispositivo.' };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, edge, edge);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) return { ok: false, error: 'No se pudo comprimir la imagen.' };

    const dataUrl = await blobToDataUrl(blob);
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      const tighter = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.65)
      );
      if (!tighter) return { ok: false, error: 'Imagen demasiado grande tras comprimir.' };
      const dataUrl2 = await blobToDataUrl(tighter);
      if (dataUrl2.length > MAX_DATA_URL_CHARS) {
        return { ok: false, error: 'Imagen demasiado grande. Prueba otra foto.' };
      }
      return { ok: true, dataUrl: dataUrl2, blob: tighter };
    }

    return { ok: true, dataUrl, blob };
  } catch {
    return { ok: false, error: 'No se pudo leer la imagen.' };
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Preferred path: server API with service role (works even if Storage RLS is wrong).
 */
async function uploadAvatarViaApi(blob: Blob): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append('file', blob, 'avatar.jpg');
    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
    });
    const body = (await res.json().catch(() => ({}))) as {
      avatarUrl?: string;
      error?: string;
    };
    if (!res.ok) {
      console.warn('[Salvazion] avatar API upload failed', res.status, body.error);
      return null;
    }
    return body.avatarUrl || null;
  } catch (e) {
    console.warn('[Salvazion] avatar API upload error', e);
    return null;
  }
}

/**
 * Browser-side Storage upload (fallback when API/service role unavailable).
 */
export async function uploadAvatarToSupabase(blob: Blob): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const version = Date.now();
    const path = `${user.id}/avatar-${version}.jpg`;
    const legacyPath = `${user.id}/avatar.jpg`;

    const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

    if (upErr) {
      console.warn('[Salvazion] client storage upload failed', upErr.message);
      const { error: legacyErr } = await supabase.storage
        .from('avatars')
        .upload(legacyPath, blob, {
          upsert: true,
          contentType: 'image/jpeg',
          cacheControl: '60',
        });
      if (legacyErr) {
        const retry = await supabase.storage.from('avatars').update(legacyPath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '60',
          upsert: true,
        });
        if (retry.error) {
          console.warn('[Salvazion] avatar upload skipped', retry.error.message);
          return null;
        }
        const { data } = supabase.storage.from('avatars').getPublicUrl(legacyPath);
        if (!data.publicUrl) return null;
        const url = `${data.publicUrl.split('?')[0]}?v=${version}`;
        await persistAvatarUrl(supabase, user.id, url);
        return url;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(legacyPath);
      if (!data.publicUrl) return null;
      const url = `${data.publicUrl.split('?')[0]}?v=${version}`;
      await persistAvatarUrl(supabase, user.id, url);
      return url;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    if (!data.publicUrl) return null;
    const url = `${data.publicUrl.split('?')[0]}?v=${version}`;
    await persistAvatarUrl(supabase, user.id, url);

    try {
      const { data: listed } = await supabase.storage.from('avatars').list(user.id, {
        limit: 20,
      });
      const stale = (listed || [])
        .map((f) => f.name)
        .filter((name) => name.startsWith('avatar') && name !== `avatar-${version}.jpg`)
        .map((name) => `${user.id}/${name}`);
      if (stale.length) void supabase.storage.from('avatars').remove(stale);
    } catch {
      /* ignore */
    }

    return url;
  } catch (e) {
    console.warn('[Salvazion] avatar upload failed', e);
    return null;
  }
}

async function persistAvatarUrl(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  url: string
): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    avatar_url: url,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.warn('[Salvazion] profiles.avatar_url persist failed', error.message);
  }
}

/**
 * Save avatar for multi-device use.
 * 1) Server API (service role) — preferred
 * 2) Direct Storage from browser — fallback
 * 3) Local data-URL only if both fail (device-only; does NOT sync)
 */
export async function saveAvatarImage(file: File): Promise<
  | { ok: true; avatarUrl: string; remote: boolean }
  | { ok: false; error: string }
> {
  const processed = await processAvatarFile(file);
  if (!processed.ok) return processed;

  // Prefer API so mobile always gets profiles.avatar_url + Storage object
  const viaApi = await uploadAvatarViaApi(processed.blob);
  if (viaApi) {
    return { ok: true, avatarUrl: viaApi, remote: true };
  }

  const viaClient = await uploadAvatarToSupabase(processed.blob);
  if (viaClient) {
    return { ok: true, avatarUrl: viaClient, remote: true };
  }

  // Last resort: local only — surface as soft failure so UI can warn hard
  return {
    ok: true,
    avatarUrl: processed.dataUrl,
    remote: false,
  };
}
