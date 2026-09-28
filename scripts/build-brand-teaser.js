/**
 * Teaser Coin229 — logo réel + produits catalogue + captures app + son original.
 * Usage: node scripts/build-brand-teaser.js
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FF =
  process.env.FFMPEG ||
  "C:\\Users\\ALEX\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.1-full_build\\bin\\ffmpeg.exe";
const OUT = path.join(ROOT, "docs/marketing/com/teaser-brand");
const FRAMES = path.join(OUT, "frames");
const CLIPS = path.join(OUT, "clips");
const VIDEOS = path.join(ROOT, "docs/marketing/com/videos");

function ff(args) {
  execSync(`"${FF}" -y ${args}`, {
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });
}

function ensureDirs() {
  for (const d of [OUT, FRAMES, CLIPS, VIDEOS]) fs.mkdirSync(d, { recursive: true });
}

function makeAudio() {
  // Bed original Coin229 — pas la piste Genai
  // Pad grave E2 + B2 + E3 + bruit rose léger, fade in/out
  const audio = path.join(OUT, "coin229-audio-bed.m4a");
  ff(
    `-f lavfi -i "sine=frequency=82.41:duration=34" ` +
      `-f lavfi -i "sine=frequency=123.47:duration=34" ` +
      `-f lavfi -i "sine=frequency=164.81:duration=34" ` +
      `-f lavfi -i "anoisesrc=duration=34:color=pink:amplitude=0.02" ` +
      `-filter_complex "` +
      `[0]volume=0.14,afade=t=in:d=0.01[a0];` +
      `[1]volume=0.09[a1];` +
      `[2]volume=0.05[a2];` +
      `[3]lowpass=f=500,volume=0.35[n];` +
      `[a0][a1][a2][n]amix=inputs=4:duration=first:dropout_transition=0,` +
      `highpass=f=45,lowpass=f=3500,` +
      `afade=t=in:st=0:d=2.2,afade=t=out:st=30:d=3.5,` +
      `volume=0.85" ` +
      `-c:a aac -b:a 192k "${audio}"`
  );
  return audio;
}

function frameProduct(name, productRel, label) {
  const product = path.join(OUT, "products", productRel);
  const logo = path.join(OUT, "logo-on-dark.png");
  const icon = path.join(OUT, "icon-512.png");
  const out = path.join(FRAMES, name);
  const safe = label.replace(/'/g, "").replace(/—/g, "-");
  ff(
    `-i "${product}" -i "${logo}" -i "${icon}" -filter_complex "` +
      `color=c=0x0a0b0f:s=1920x1080:d=1[bg];` +
      `[0:v]scale=820:820:force_original_aspect_ratio=decrease,` +
      `pad=820:820:(ow-iw)/2:(oh-ih)/2:color=0x0a0b0f[prod];` +
      `[bg][prod]overlay=(W-w)/2:(H-h)/2+10[base];` +
      `[1:v]scale=560:-1[lg];` +
      `[2:v]scale=110:110[ic];` +
      `[base][lg]overlay=(W-w)/2:36[v1];` +
      `[v1][ic]overlay=W-w-48:48[v2];` +
      `[v2]drawbox=x=0:y=980:w=1920:h=100:color=0x0a0b0f@0.82:t=fill,` +
      `drawtext=text='${safe}':fontcolor=0xC9A227:fontsize=32:` +
      `x=(w-text_w)/2:y=1014:` +
      `fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

function frameApp(name, shotRel, caption) {
  const shot = path.join(OUT, "app", shotRel);
  const logo = path.join(OUT, "logo-on-dark.png");
  const out = path.join(FRAMES, name);
  const safe = caption.replace(/'/g, "").replace(/—/g, "-");
  ff(
    `-i "${shot}" -i "${logo}" -filter_complex "` +
      `color=c=0x0a0b0f:s=1920x1080:d=1[bg];` +
      `[0:v]scale=1480:-1:force_original_aspect_ratio=decrease[ui];` +
      `[bg][ui]overlay=(W-w)/2:(H-h)/2+40[base];` +
      `[1:v]scale=520:-1[lg];` +
      `[base][lg]overlay=(W-w)/2:28,` +
      `drawbox=x=0:y=0:w=1920:h=10:color=0xC9A227:t=fill,` +
      `drawtext=text='${safe}':fontcolor=white:fontsize=26:` +
      `x=(w-text_w)/2:y=1024:fontfile=C\\\\:/Windows/Fonts/arial.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

function frameLogoOpen() {
  const logo = path.join(OUT, "logo-on-dark.png");
  const icon = path.join(OUT, "icon-512.png");
  const out = path.join(FRAMES, "01-logo.png");
  ff(
    `-i "${logo}" -i "${icon}" -filter_complex "` +
      `color=c=0x000000:s=1920x1080:d=1[bg];` +
      `[1:v]scale=200:200[ic];` +
      `[0:v]scale=1100:-1[lg];` +
      `[bg][ic]overlay=(W-w)/2:160[b0];` +
      `[b0][lg]overlay=(W-w)/2:(H-h)/2+40,` +
      `drawtext=text='ACCESSOIRES. STYLE. CONFIANCE.':fontcolor=0xC9A227:fontsize=30:` +
      `x=(w-text_w)/2:y=h-110:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

function frameC2() {
  const c2 = path.join(OUT, "brand-c2-3d.png");
  const logo = path.join(OUT, "logo-on-dark.png");
  const out = path.join(FRAMES, "02-c2-3d.png");
  const src = fs.existsSync(c2) ? c2 : path.join(OUT, "icon-512.png");
  ff(
    `-i "${src}" -i "${logo}" -filter_complex "` +
      `color=c=0x050505:s=1920x1080:d=1[bg];` +
      `[0:v]scale=860:-1[mark];` +
      `[bg][mark]overlay=(W-w)/2:(H-h)/2-80[base];` +
      `[1:v]scale=640:-1[lg];` +
      `[base][lg]overlay=(W-w)/2:H-h-80" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

function frameComingSoon() {
  const logo = path.join(OUT, "logo-on-dark.png");
  const icon = path.join(OUT, "icon-512.png");
  const out = path.join(FRAMES, "08-coming-soon.png");
  ff(
    `-i "${logo}" -i "${icon}" -filter_complex "` +
      `color=c=0x0B2E24:s=1920x1080:d=1[bg];` +
      `[1:v]scale=140:140[ic];` +
      `[0:v]scale=780:-1[lg];` +
      `[bg][ic]overlay=(W-w)/2:80[b0];` +
      `[b0][lg]overlay=(W-w)/2:240,` +
      `drawtext=text='COMING SOON':fontcolor=white:fontsize=88:` +
      `x=(w-text_w)/2:y=(h-text_h)/2+80:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='Toute une tenue. Les bons details.':fontcolor=0xC9A227:fontsize=34:` +
      `x=(w-text_w)/2:y=(h/2)+160:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='Cotonou  -  Porto-Novo  -  Godomey':fontcolor=0xdddddd:fontsize=26:` +
      `x=(w-text_w)/2:y=(h/2)+220:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='coin229.vercel.app':fontcolor=white:fontsize=30:` +
      `x=(w-text_w)/2:y=h-90:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

function frameEnd() {
  const logo = path.join(OUT, "logo-on-dark.png");
  const icon = path.join(OUT, "icon-512.png");
  const out = path.join(FRAMES, "09-end.png");
  ff(
    `-i "${logo}" -i "${icon}" -filter_complex "` +
      `color=c=0x000000:s=1920x1080:d=1[bg];` +
      `[1:v]scale=220:220[ic];` +
      `[0:v]scale=920:-1[lg];` +
      `[bg][ic]overlay=(W-w)/2:120[b1];` +
      `[b1][lg]overlay=(W-w)/2:380,` +
      `drawtext=text='Marketplace accessoires - Benin':fontcolor=0xaaaaaa:fontsize=28:` +
      `x=(w-text_w)/2:y=780:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='coin229.vercel.app/boutique':fontcolor=0xC9A227:fontsize=36:` +
      `x=(w-text_w)/2:y=840:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

function clipFromFrame(framePath, idx, seconds, zoomIn) {
  const out = path.join(CLIPS, `c-${String(idx).padStart(2, "0")}.mp4`);
  const n = Math.round(seconds * 30);
  const z = zoomIn
    ? `zoompan=z='min(1.0+0.0011*on,1.14)':d=${n}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30`
    : `zoompan=z='if(eq(on,1),1.12,max(1.12-0.001*on,1.0))':d=${n}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30`;
  ff(
    `-loop 1 -i "${framePath}" -vf "${z},format=yuv420p" -t ${seconds} ` +
      `-c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p "${out}"`
  );
  return out;
}

function main() {
  ensureDirs();
  console.log("AUDIO…");
  const audio = makeAudio();

  console.log("FRAMES…");
  const f1 = frameLogoOpen();
  const f2 = frameC2();
  frameProduct("03-montre.png", "montre-05.jpg", "Montres luxe - catalogue Coin229");
  frameProduct("04-bijou.png", "mb-08.jpg", "Bijoux - catalogue Coin229");
  frameProduct("05-sandale.png", "sandale-01.jpg", "Sandales luxe - catalogue Coin229");
  frameApp("06-app-home.png", "home.png", "App Coin229 - Accueil");
  frameApp("07-app-boutique.png", "boutique.png", "App Coin229 - Boutique");
  frameApp("07b-app-vendeur.png", "vendeur.png", "App Coin229 - Espace vendeur");
  const f8 = frameComingSoon();
  const f9 = frameEnd();

  const sequence = [
    [f1, 5.0, true],
    [f2, 4.0, true],
    [path.join(FRAMES, "03-montre.png"), 3.8, true],
    [path.join(FRAMES, "04-bijou.png"), 3.5, true],
    [path.join(FRAMES, "05-sandale.png"), 3.5, true],
    [path.join(FRAMES, "06-app-home.png"), 3.8, false],
    [path.join(FRAMES, "07-app-boutique.png"), 3.8, false],
    [path.join(FRAMES, "07b-app-vendeur.png"), 3.2, false],
    [f8, 5.0, false],
    [f9, 5.0, false],
  ];

  console.log("CLIPS…");
  const list = [];
  sequence.forEach(([fp, dur, zin], i) => {
    list.push(clipFromFrame(fp, i + 1, dur, zin));
  });

  const listFile = path.join(CLIPS, "list.txt");
  fs.writeFileSync(
    listFile,
    list.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n")
  );

  const v16 = path.join(VIDEOS, "coin229-TEASER-BRAND-16x9.mp4");
  const v9 = path.join(VIDEOS, "coin229-TEASER-BRAND-9x16.mp4");
  console.log("MUX 16x9…");
  ff(
    `-f concat -safe 0 -i "${listFile}" -i "${audio}" ` +
      `-c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${v16}"`
  );
  console.log("CROP 9x16…");
  ff(
    `-i "${v16}" -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920" ` +
      `-c:v libx264 -crf 17 -c:a aac -b:a 192k -movflags +faststart "${v9}"`
  );
  console.log("OK", v16);
  console.log("OK", v9);
}

main();
