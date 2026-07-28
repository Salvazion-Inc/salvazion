import { spawnSync } from 'child_process';
import { readFileSync, mkdirSync, copyFileSync, existsSync, statSync } from 'fs';

const h = readFileSync('tmp/canva/page.html', 'utf8');
mkdirSync('public/founders', { recursive: true });
mkdirSync('tmp/canva/dl', { recursive: true });

function dl(url, dest) {
  console.log('GET', url, '->', dest);
  spawnSync(
    'curl.exe',
    ['-sL', `https://salvazion.org/${url}`, '-A', 'Mozilla/5.0', '-o', dest],
    { stdio: 'inherit' }
  );
  if (existsSync(dest)) console.log(' size', statSync(dest).size);
}

// All jpg media
const all = [
  ...h.matchAll(/"url":"(_assets\/media\/[a-f0-9]+\.jpg)","width":(\d+),"height":(\d+)/g),
];
console.log('jpg media entries', all.length);
const byUrl = new Map();
for (const m of all) {
  byUrl.set(m[1], { url: m[1], w: +m[2], h: +m[3] });
}
for (const r of byUrl.values()) {
  console.log(`${r.w}x${r.h}`, r.url);
  const name = r.url.split('/').pop();
  dl(r.url, `tmp/canva/dl/media-${name}`);
}

// Known founders (use largest)
dl(
  '_assets/media/767b2294a3779e7cc74533b8cf2570fb.jpg',
  'public/founders/cristian.jpg'
);
dl(
  '_assets/media/d534a72c3d3d7d701f139f4c77760716.jpg',
  'public/founders/beatriz.jpg'
);

// Extract frames
const ff = [
  process.env.LOCALAPPDATA +
    '\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe',
  'ffmpeg',
].find((p) => {
  try {
    return spawnSync(p, ['-version'], { encoding: 'utf8' }).status === 0;
  } catch {
    return false;
  }
});

if (ff) {
  spawnSync(
    ff,
    [
      '-y',
      '-ss',
      '0.3',
      '-i',
      'tmp/canva/dl/VAG2yPRi8Gw.mp4',
      '-update',
      '1',
      '-frames:v',
      '1',
      '-q:v',
      '2',
      'public/founders/family.jpg',
    ],
    { stdio: 'inherit' }
  );
}

// Matrix video already at public/videos/matrix-spiritual-revival.mp4
if (existsSync('tmp/canva/dl/matrix-rain.mp4')) {
  copyFileSync(
    'tmp/canva/dl/matrix-rain.mp4',
    'public/videos/matrix-spiritual-revival.mp4'
  );
  console.log('matrix video ready');
}
