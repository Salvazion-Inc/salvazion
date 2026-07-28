/**
 * Build epic 12 Salvators reveal videos (EN + ES).
 * Renders progressive neon frames with Playwright, then FFmpeg assembles.
 *
 * Usage: node scripts/build-salvators-video.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'videos');
const TMP = path.join(ROOT, 'tmp', 'salvators-frames');

const W = 1280;
const H = 720;
/** Visible time of each frame before the next crossfade begins */
const HOLD_SEC = 1.15;
const TITLE_HOLD = 2.0;
const FINAL_HOLD = 3.2;
/** Soft crossfade between consecutive lines (seconds) */
const XFADE_SEC = 0.72;
const FPS = 30;
/** Reuse existing PNG frames if present (faster rebuild for audio/xfade tweaks) */
const REUSE_FRAMES = process.argv.includes('--reuse');

const EN = {
  title: 'FOCUSING ON THESE',
  title2: '12 SALVATORS:',
  points: [
    'All Glory to GOD and to Our Lord Jesus Christ.',
    'Strong Marriages and Families are the Foundation of Society.',
    'Protect Western Christian Culture and its Values.',
    'Love your Traditions, Homeland, Institutions, Culture and Roots.',
    'No to Globalism, International Organizations, Woke, or LGBTQ+.',
    'Follow a Purpose and join a Global Community.',
    'Using your Gifts to Serve People and the Community.',
    'Faith, Common Sense and Meritocracy are Key.',
    'Stay Healthy, Happy and Free Forever.',
    'Apply Exponential Technologies that generate Value.',
    'No to Transhumanism, BioConservatism is the Ideal.',
    'Most Conspiracy Theories are True.',
  ],
};

const ES = {
  title: 'ENFOCÁNDONOS EN ESTOS',
  title2: '12 SALVATORS:',
  points: [
    'Toda la Gloria a DIOS y a Nuestro Señor Jesucristo.',
    'Los Matrimonios y Familias Fuertes son el Fundamento de la Sociedad.',
    'Protege la Cultura Cristiana Occidental y sus Valores.',
    'Ama tus Tradiciones, Patria, Instituciones, Cultura y Raíces.',
    'No al Globalismo, Organizaciones Internacionales, Woke ni LGBTQ+.',
    'Sigue un Propósito y únete a una Comunidad Global.',
    'Usa tus Dones para Servir a las Personas y a la Comunidad.',
    'La Fe, el Sentido Común y la Meritocracia son Clave.',
    'Mantente Sano, Feliz y Libre para Siempre.',
    'Aplica Tecnologías Exponenciales que generen Valor.',
    'No al Transhumanismo; el BioConservadurismo es el Ideal.',
    'La mayoría de las Teorías de la Conspiración son Verdaderas.',
  ],
};

function htmlPage(copy, visibleCount, pulseIndex) {
  const items = copy.points
    .map((text, i) => {
      const n = i + 1;
      const on = i < visibleCount;
      const pulse = i === pulseIndex && on;
      const opacity = on ? 1 : 0;
      const translate = on ? '0' : '18px';
      return `
      <div class="row ${pulse ? 'pulse' : ''}" style="opacity:${opacity}; transform:translateY(${translate});">
        <span class="num">${n}.</span>
        <span class="txt">${escapeHtml(text)}</span>
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Rajdhani:wght@600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${W}px; height: ${H}px; overflow: hidden;
    background: #020403;
    color: #b8ffc4;
    font-family: 'Rajdhani', system-ui, sans-serif;
  }
  .stage {
    position: relative;
    width: 100%; height: 100%;
    background:
      radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,177,12,0.12), transparent 70%),
      radial-gradient(circle at 15% 20%, rgba(0,245,17,0.08), transparent 40%),
      radial-gradient(circle at 85% 80%, rgba(0,177,12,0.1), transparent 45%),
      linear-gradient(160deg, #010302 0%, #041008 40%, #020503 100%);
  }
  .grid {
    position: absolute; inset: 0; opacity: 0.22;
    background-image:
      linear-gradient(rgba(0,241,17,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,241,17,0.07) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black, transparent);
  }
  .circuit {
    position: absolute; inset: 0; opacity: 0.35;
    background:
      linear-gradient(115deg, transparent 40%, rgba(0,241,17,0.06) 50%, transparent 60%),
      repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,177,12,0.04) 40px, rgba(0,177,12,0.04) 41px);
  }
  .glow-orb {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,241,17,0.18), transparent 68%);
    filter: blur(8px); pointer-events: none;
  }
  .orb-a { top: -80px; left: 50%; transform: translateX(-50%); }
  .orb-b { bottom: -120px; right: -40px; width: 360px; height: 360px; opacity: 0.7; }
  .content {
    position: relative; z-index: 2;
    height: 100%;
    display: flex; flex-direction: column;
    align-items: center;
    padding: 36px 56px 28px;
  }
  .title {
    font-family: 'Orbitron', sans-serif;
    font-weight: 800;
    text-align: center;
    line-height: 1.05;
    letter-spacing: 0.04em;
    text-shadow:
      0 0 12px rgba(0,241,17,0.85),
      0 0 40px rgba(0,177,12,0.55),
      0 0 80px rgba(0,177,12,0.25);
    color: #7dff8f;
  }
  .title .t1 { font-size: 42px; display: block; }
  .title .t2 { font-size: 48px; display: block; margin-top: 4px; color: #9fffad; }
  .list {
    margin-top: 28px;
    width: 100%;
    max-width: 980px;
    display: flex; flex-direction: column; gap: 7px;
  }
  .row {
    display: flex; align-items: flex-start; gap: 14px;
    transition: opacity 0.35s ease, transform 0.35s ease;
  }
  .row.pulse .num, .row.pulse .txt {
    text-shadow:
      0 0 10px rgba(0,255,100,1),
      0 0 28px rgba(0,241,17,0.9),
      0 0 48px rgba(0,177,12,0.55);
    color: #d8ffe0;
  }
  .num {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 22px;
    min-width: 42px;
    color: #5dff75;
    text-shadow: 0 0 10px rgba(0,241,17,0.7);
    line-height: 1.25;
  }
  .txt {
    font-size: 22px;
    font-weight: 700;
    color: #b6ffc2;
    line-height: 1.25;
    letter-spacing: 0.01em;
    text-shadow: 0 0 8px rgba(0,177,12,0.35);
  }
  .footer {
    margin-top: auto;
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    letter-spacing: 0.28em;
    color: rgba(143,217,154,0.55);
    text-transform: uppercase;
  }
  .vignette {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    box-shadow: inset 0 0 120px 40px rgba(0,0,0,0.55);
  }
  .frame {
    position: absolute; inset: 14px; z-index: 3; pointer-events: none;
    border: 1px solid rgba(0,241,17,0.18);
    border-radius: 8px;
    box-shadow: 0 0 24px rgba(0,241,17,0.08) inset;
  }
</style>
</head>
<body>
  <div class="stage">
    <div class="grid"></div>
    <div class="circuit"></div>
    <div class="glow-orb orb-a"></div>
    <div class="glow-orb orb-b"></div>
    <div class="content">
      <div class="title">
        <span class="t1">${escapeHtml(copy.title)}</span>
        <span class="t2">${escapeHtml(copy.title2)}</span>
      </div>
      <div class="list">${items}</div>
      <div class="footer">SALVAZION · SALVATION · HEALTH · FREEDOM</div>
    </div>
    <div class="vignette"></div>
    <div class="frame"></div>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    // shell:false so paths with spaces (e.g. "Salvazion App") are not split
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false, windowsHide: true });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

async function findFfmpeg() {
  const candidates = [
    path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft',
      'WinGet',
      'Packages',
      'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'ffmpeg-8.1.2-full_build',
      'bin',
      'ffmpeg.exe'
    ),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'),
    'ffmpeg',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    path.join(process.env.ProgramFiles || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
  ];
  for (const c of candidates) {
    if (c !== 'ffmpeg' && !existsSync(c)) continue;
    try {
      await run(c, ['-version']);
      return c;
    } catch {
      /* try next */
    }
  }
  throw new Error('ffmpeg not found. Install FFmpeg and retry.');
}

async function renderLang(browser, lang, copy) {
  const dir = path.join(TMP, lang);
  await mkdir(dir, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });

  // Frame 0: title only
  // Frames 1..12: each new point appears with pulse
  const frames = [];
  for (let visible = 0; visible <= 12; visible++) {
    const pulse = visible === 0 ? -1 : visible - 1;
    const html = htmlPage(copy, visible, pulse);
    await page.setContent(html, { waitUntil: 'networkidle' });
    // wait for webfonts
    await page.waitForTimeout(450);
    const file = path.join(dir, `frame-${String(visible).padStart(2, '0')}.png`);
    await page.screenshot({ path: file, type: 'png' });
    frames.push(file);
    console.log(`[${lang}] frame ${visible}/12`);
  }

  // Final hold frame (all points, no pulse)
  {
    const html = htmlPage(copy, 12, -1);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const file = path.join(dir, 'frame-13.png');
    await page.screenshot({ path: file, type: 'png' });
    frames.push(file);
  }

  await page.close();
  return frames;
}

/**
 * Clip durations: each still is held long enough that after xfade the line
 * remains readable. xfade shortens the join by XFADE_SEC each time.
 */
function clipDurations(frameCount) {
  return Array.from({ length: frameCount }, (_, i) => {
    if (i === 0) return TITLE_HOLD + XFADE_SEC;
    if (i === frameCount - 1) return FINAL_HOLD + XFADE_SEC;
    return HOLD_SEC + XFADE_SEC;
  });
}

/** Total output duration after chained xfade. */
function totalDuration(durs) {
  // n clips, n-1 fades: sum(d) - (n-1)*xfade
  const n = durs.length;
  if (n === 0) return 0;
  return durs.reduce((a, b) => a + b, 0) - (n - 1) * XFADE_SEC;
}

/**
 * Build ambient cinematic pad (no third-party assets):
 * deep drone + fifth harmony + soft brown noise bed + gentle shimmer.
 */
async function buildAmbientAudio(ffmpeg, durationSec, outPath) {
  const d = Math.max(durationSec + 0.5, 4).toFixed(3);
  const fadeOutStart = Math.max(durationSec - 2.8, 1).toFixed(3);

  // Multi-layer lavfi synth → AAC
  await run(ffmpeg, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=55:sample_rate=44100:duration=${d}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=82.5:sample_rate=44100:duration=${d}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=110:sample_rate=44100:duration=${d}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=165:sample_rate=44100:duration=${d}`,
    '-f',
    'lavfi',
    '-i',
    `anoisesrc=color=brown:amplitude=0.04:sample_rate=44100:duration=${d}`,
    '-filter_complex',
    [
      // Root drone
      `[0:a]volume=0.14,lowpass=f=180,afade=t=in:st=0:d=2.2,afade=t=out:st=${fadeOutStart}:d=2.6[a0]`,
      // Fifth
      `[1:a]volume=0.09,lowpass=f=240,afade=t=in:st=0:d=2.6,afade=t=out:st=${fadeOutStart}:d=2.6[a1]`,
      // Octave with slow tremolo (breathing; tremolo f min 0.1)
      `[2:a]volume=0.055,tremolo=f=0.12:d=0.45,afade=t=in:st=0:d=3,afade=t=out:st=${fadeOutStart}:d=2.6[a2]`,
      // Soft high shimmer
      `[3:a]volume=0.028,highpass=f=120,tremolo=f=0.15:d=0.35,afade=t=in:st=0:d=3.5,afade=t=out:st=${fadeOutStart}:d=2.6[a3]`,
      // Warm noise bed
      `[4:a]volume=0.45,lowpass=f=320,afade=t=in:st=0:d=1.8,afade=t=out:st=${fadeOutStart}:d=2.6[a4]`,
      `[a0][a1][a2][a3][a4]amix=inputs=5:duration=first:dropout_transition=3,alimiter=limit=0.9,volume=1.15[aout]`,
    ].join(';'),
    '-map',
    '[aout]',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-t',
    String(durationSec),
    outPath,
  ]);
}

/**
 * Soft xfade chain between still frames + ambient audio + slow push-in.
 */
async function assembleVideo(ffmpeg, lang, frames) {
  const durs = clipDurations(frames.length);
  const total = totalDuration(durs);
  console.log(
    `[${lang}] xfade=${XFADE_SEC}s · clips=${frames.length} · duration≈${total.toFixed(2)}s`
  );

  // Prepare labeled video streams: loop still → scale → yuv420p
  const inputs = [];
  for (let i = 0; i < frames.length; i++) {
    inputs.push('-loop', '1', '-t', String(durs[i]), '-i', frames[i]);
  }

  const prep = frames
    .map(
      (_, i) =>
        `[${i}:v]fps=${FPS},scale=${W}:${H}:flags=lanczos,setsar=1,format=yuv420p,setpts=PTS-STARTPTS[v${i}]`
    )
    .join(';');

  // Chain xfade with soft dissolve (fade)
  // offset_i = sum(durs[0..i]) - i * XFADE  (join clip i+1 after processed stream length)
  let filter = prep;
  let lastLabel = 'v0';
  let elapsed = durs[0];
  for (let i = 1; i < frames.length; i++) {
    const offset = Math.max(elapsed - XFADE_SEC, 0.05);
    const outLabel = i === frames.length - 1 ? 'vx' : `x${i}`;
    // fade + slight darken mid-cross for softer blend
    filter += `;[${lastLabel}][v${i}]xfade=transition=fade:duration=${XFADE_SEC}:offset=${offset.toFixed(3)}[${outLabel}]`;
    lastLabel = outLabel;
    elapsed = elapsed + durs[i] - XFADE_SEC;
  }

  // Soft polish: slight contrast + ensure format (no zoompan — preserves xfade timing)
  filter += `;[${lastLabel}]eq=contrast=1.04:brightness=0.01:saturation=1.06,format=yuv420p[vout]`;

  const silentVideo = path.join(TMP, `${lang}-silent.mp4`);
  await run(ffmpeg, [
    '-y',
    ...inputs,
    '-filter_complex',
    filter,
    '-map',
    '[vout]',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(FPS),
    '-t',
    String(total),
    '-an',
    silentVideo,
  ]);

  const audioPath = path.join(TMP, `${lang}-ambient.m4a`);
  await buildAmbientAudio(ffmpeg, total, audioPath);

  const out = path.join(OUT_DIR, `12-salvators-${lang}.mp4`);
  await run(ffmpeg, [
    '-y',
    '-i',
    silentVideo,
    '-i',
    audioPath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    out,
  ]);

  console.log(`[${lang}] wrote ${out}`);
  return out;
}

async function loadOrRenderFrames(browser, lang, copy) {
  const dir = path.join(TMP, lang);
  if (REUSE_FRAMES && existsSync(path.join(dir, 'frame-00.png'))) {
    const frames = [];
    for (let i = 0; i <= 13; i++) {
      const f = path.join(dir, `frame-${String(i).padStart(2, '0')}.png`);
      if (!existsSync(f) && i === 13) {
        // final may be frame-13 without zero pad issues
        const alt = path.join(dir, 'frame-13.png');
        if (existsSync(alt)) {
          frames.push(alt);
          continue;
        }
      }
      if (!existsSync(f)) {
        console.log(`[${lang}] missing ${f}, re-rendering…`);
        return renderLang(browser, lang, copy);
      }
      frames.push(f);
    }
    console.log(`[${lang}] reusing ${frames.length} frames`);
    return frames;
  }
  return renderLang(browser, lang, copy);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  if (!REUSE_FRAMES) {
    if (existsSync(TMP)) await rm(TMP, { recursive: true, force: true });
  }
  await mkdir(TMP, { recursive: true });

  const ffmpeg = await findFfmpeg();
  console.log('ffmpeg ok', REUSE_FRAMES ? '(reuse frames)' : '(fresh render)');

  const browser = await chromium.launch({ headless: true });
  try {
    const enFrames = await loadOrRenderFrames(browser, 'en', EN);
    const esFrames = await loadOrRenderFrames(browser, 'es', ES);
    await assembleVideo(ffmpeg, 'en', enFrames);
    await assembleVideo(ffmpeg, 'es', esFrames);
  } finally {
    await browser.close();
  }

  console.log('Done. Videos with soft xfade + ambient audio:');
  console.log('  public/videos/12-salvators-en.mp4');
  console.log('  public/videos/12-salvators-es.mp4');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
