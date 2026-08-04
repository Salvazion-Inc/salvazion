import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches bucket limit

/**
 * POST /api/profile/avatar
 * Multipart form field `file` (image/jpeg preferred).
 *
 * Uses the user session for auth + service role for Storage write so multi-device
 * sync works even when browser Storage RLS is misconfigured.
 * Sets profiles.avatar_url to the public URL (source of truth for mobile).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        {
          error:
            'Server missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel / .env.local.',
        },
        { status: 503 }
      );
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof Blob) || file.size < 32) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 5 MB)' }, { status: 400 });
    }

    const version = Date.now();
    const path = `${user.id}/avatar-${version}.jpg`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure bucket exists (idempotent; no-op if already created via SQL)
    try {
      await admin.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: MAX_BYTES,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      });
    } catch {
      /* already exists */
    }
    // Public flag if bucket pre-existed as private
    try {
      await admin.storage.updateBucket('avatars', {
        public: true,
        fileSizeLimit: MAX_BYTES,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      });
    } catch {
      /* ignore */
    }

    const { error: upErr } = await admin.storage.from('avatars').upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    });

    if (upErr) {
      console.error('[api/profile/avatar] storage upload', upErr.message);
      return NextResponse.json(
        { error: `Storage upload failed: ${upErr.message}` },
        { status: 502 }
      );
    }

    const { data: pub } = admin.storage.from('avatars').getPublicUrl(path);
    if (!pub?.publicUrl) {
      return NextResponse.json({ error: 'No public URL for avatar' }, { status: 502 });
    }

    const avatarUrl = `${pub.publicUrl.split('?')[0]}?v=${version}`;

    const { error: dbErr } = await admin
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (dbErr) {
      // Row may not exist yet
      const { error: upDb } = await admin.from('profiles').upsert({
        id: user.id,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
      if (upDb) {
        console.error('[api/profile/avatar] profiles update', upDb.message);
        return NextResponse.json(
          { error: `Profile update failed: ${upDb.message}` },
          { status: 502 }
        );
      }
    }

    // Best-effort cleanup of older avatar objects
    try {
      const { data: listed } = await admin.storage.from('avatars').list(user.id, {
        limit: 30,
      });
      const keep = `avatar-${version}.jpg`;
      const stale = (listed || [])
        .map((f) => f.name)
        .filter((n) => n.startsWith('avatar') && n !== keep)
        .map((n) => `${user.id}/${n}`);
      if (stale.length) await admin.storage.from('avatars').remove(stale);
    } catch {
      /* ignore */
    }

    return NextResponse.json({ ok: true, avatarUrl, remote: true });
  } catch (e) {
    console.error('[api/profile/avatar]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
