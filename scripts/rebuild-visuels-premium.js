/**
 * Rebuild VISUELS-COIN229 around preferred 3D teasers.
 * Logo: noir (lockup) + C2. Formats réseaux qui performent.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs", "marketing", "VISUELS-COIN229");
const SRC3D = path.join(ROOT, "docs", "marketing", "com", "teaser-3d");
const SRC_DESIGN = path.join(ROOT, "docs", "marketing", "com", "design-pro");
const SRC_BRAND = path.join(ROOT, "docs", "marketing", "com", "teaser-brand");
const ASSETS = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-Users-ALEX-Desktop-Coin229",
  "assets"
);

const FFMPEG =
  process.env.FFMPEG ||
  "C:\\Users\\ALEX\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.1-full_build\\bin\\ffmpeg.exe";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function findAsset(substr) {
  if (!fs.existsSync(ASSETS)) return null;
  const hit = fs.readdirSync(ASSETS).find((n) => n.includes(substr));
  return hit ? path.join(ASSETS, hit) : null;
}

function pick(file) {
  const fromAssets = findAsset(file.replace(".png", ""));
  if (fromAssets && fs.existsSync(fromAssets)) return fromAssets;
  const local = path.join(SRC3D, file);
  if (fs.existsSync(local)) return local;
  const design = path.join(SRC_DESIGN, file);
  if (fs.existsSync(design)) return design;
  throw new Error("Missing source: " + file);
}

async function cover(src, w, h, dest) {
  await sharp(src)
    .resize(w, h, { fit: "cover", position: "centre" })
    .png({ quality: 92, compressionLevel: 8 })
    .toFile(dest);
}

/** Soft C2 badge bottom-right — one mark only */
async function withC2Badge(srcPath, outPath, badgePath, size = 96, margin = 36) {
  const meta = await sharp(srcPath).metadata();
  const w = meta.width;
  const h = meta.height;
  const badge = await sharp(badgePath)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const buf = await sharp(srcPath)
    .composite([{ input: badge, left: w - size - margin, top: h - size - margin }])
    .png()
    .toBuffer();
  await sharp(buf).png().toFile(outPath);
}

/** Make near-white bg transparent so logo sits clean on cream */
async function logoTransparent(src, targetW) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 235 && g > 235 && b > 235) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(targetW, null, { fit: "inside" })
    .png()
    .toBuffer();
}

/** Strip near-black bg from C2 3D render */
async function c2Transparent(src, size) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 28 && g < 28 && b < 28) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** End card: cream + logo noir lockup + C2 3D */
async function makeEndCard(w, h, outPath, logoNoir, c2) {
  const canvas = sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: { r: 245, g: 240, b: 230 },
    },
  });

  const logoW = Math.round(w * 0.62);
  const logoBuf = await logoTransparent(logoNoir, logoW);
  const logoMeta = await sharp(logoBuf).metadata();

  const c2Size = Math.round(Math.min(w, h) * 0.2);
  const c2Buf = await c2Transparent(c2, c2Size);
  const c2Meta = await sharp(c2Buf).metadata();

  const svgText = Buffer.from(`
    <svg width="${w}" height="${h}">
      <text x="${w / 2}" y="${Math.round(h * 0.78)}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(h * 0.035)}"
        fill="#1a1a1a" letter-spacing="4">COMING SOON</text>
      <text x="${w / 2}" y="${Math.round(h * 0.84)}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(h * 0.022)}"
        fill="#8a7340" letter-spacing="3">coin229.com</text>
    </svg>
  `);

  const logoLeft = Math.round((w - logoMeta.width) / 2);
  const logoTop = Math.round(h * 0.42);
  const c2Left = Math.round((w - c2Meta.width) / 2);
  const c2Top = Math.round(h * 0.16);

  await canvas
    .composite([
      { input: c2Buf, left: c2Left, top: c2Top },
      { input: logoBuf, left: logoLeft, top: logoTop },
      { input: svgText, left: 0, top: 0 },
    ])
    .png()
    .toFile(outPath);
}

async function makeVendeurCard(w, h, outPath, logoNoir, c2) {
  const canvas = sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: { r: 245, g: 240, b: 230 },
    },
  });
  const logoW = Math.round(w * 0.55);
  const logoBuf = await logoTransparent(logoNoir, logoW);
  const logoMeta = await sharp(logoBuf).metadata();
  const c2Size = Math.round(Math.min(w, h) * 0.18);
  const c2Buf = await c2Transparent(c2, c2Size);
  const c2Meta = await sharp(c2Buf).metadata();
  const svg = Buffer.from(`
    <svg width="${w}" height="${h}">
      <text x="${w / 2}" y="${Math.round(h * 0.58)}" text-anchor="middle"
        font-family="Georgia, serif" font-size="${Math.round(h * 0.055)}" font-weight="700"
        fill="#111">Vendez sur Coin229</text>
      <line x1="${w * 0.35}" y1="${h * 0.62}" x2="${w * 0.65}" y2="${h * 0.62}"
        stroke="#C9A84C" stroke-width="2"/>
      <text x="${w / 2}" y="${Math.round(h * 0.70)}" text-anchor="middle"
        font-family="Arial" font-size="${Math.round(h * 0.028)}"
        fill="#333">Commission claire · Paiement sécurisé</text>
      <text x="${w / 2}" y="${Math.round(h * 0.78)}" text-anchor="middle"
        font-family="Arial" font-size="${Math.round(h * 0.024)}"
        fill="#8a7340">coin229.com/vendeur</text>
    </svg>
  `);
  await canvas
    .composite([
      { input: c2Buf, left: Math.round((w - c2Meta.width) / 2), top: Math.round(h * 0.12) },
      { input: logoBuf, left: Math.round((w - logoMeta.width) / 2), top: Math.round(h * 0.32) },
      { input: svg, left: 0, top: 0 },
    ])
    .png()
    .toFile(outPath);
}

function runFfmpeg(args) {
  execFileSync(FFMPEG, ["-y", ...args], { stdio: "inherit" });
}

async function buildVideo(frames, outMp4, w, h) {
  const tmp = path.join(OUT, "_tmp_frames");
  ensureDir(tmp);
  fs.readdirSync(tmp).forEach((f) => fs.unlinkSync(path.join(tmp, f)));

  for (let i = 0; i < frames.length; i++) {
    const dest = path.join(tmp, `f${String(i + 1).padStart(2, "0")}.png`);
    await cover(frames[i], w, h, dest);
  }

  const listPath = path.join(tmp, "list.txt");
  const lines = frames.map((_, i) => {
    const f = path.join(tmp, `f${String(i + 1).padStart(2, "0")}.png`).replace(/\\/g, "/");
    return `file '${f}'\nduration 1.4`;
  });
  const last = path
    .join(tmp, `f${String(frames.length).padStart(2, "0")}.png`)
    .replace(/\\/g, "/");
  lines.push(`file '${last}'`);
  fs.writeFileSync(listPath, lines.join("\n"));

  const silent = path.join(tmp, "silent.mp4");
  runFfmpeg([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-vf",
    `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},fps=30`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    silent,
  ]);

  // Soft tone bed + loudnorm so it's not "silent"
  const tone = path.join(tmp, "tone.wav");
  runFfmpeg([
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=220:duration=12",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=330:duration=12",
    "-filter_complex",
    "[0][1]amix=inputs=2:duration=first,volume=0.35,afade=t=in:st=0:d=0.4,afade=t=out:st=10.5:d=1.2",
    tone,
  ]);

  runFfmpeg([
    "-i",
    silent,
    "-i",
    tone,
    "-shortest",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-af",
    "loudnorm=I=-14:TP=-1.5:LRA=11",
    outMp4,
  ]);
}

async function main() {
  const dirs = [
    "01-affiches/story",
    "01-affiches/feed",
    "01-affiches/coming-soon",
    "01-affiches/vendeurs",
    "02-videos/client",
    "02-videos/vendeurs",
    "03-logo-brand",
    "04-captures-app",
    "05-produits-catalogue",
    "_tmp_frames",
  ];
  dirs.forEach((d) => ensureDir(path.join(OUT, d)));

  // Wipe old ugly affiches + old videos (skip locked files)
  for (const sub of [
    "01-affiches/story",
    "01-affiches/feed",
    "01-affiches/coming-soon",
    "01-affiches/vendeurs",
    "02-videos/client",
    "02-videos/vendeurs",
  ]) {
    const p = path.join(OUT, sub);
    for (const f of fs.readdirSync(p)) {
      try {
        fs.unlinkSync(path.join(p, f));
      } catch (e) {
        if (e.code !== "EBUSY" && e.code !== "EPERM") throw e;
        console.warn("skip locked", f);
      }
    }
  }

  const sources = {
    void: pick("teaser3d-01-watch-void.png"),
    orbit: pick("teaser3d-02-orbit.png"),
    glass: pick("teaser3d-03-glass.png"),
    chain: pick("teaser3d-04-chain.png"),
    title3d: pick("teaser3d-05-title3d.png"),
    sunnies: pick("teaser3d-06-sunnies.png"),
    finale: pick("teaser3d-07-finale.png"),
    vertical: pick("teaser3d-08-vertical.png"),
    kv: pick("design-cs-06-kv.png"),
  };

  const logoNoir = path.join(SRC_BRAND, "logo-lockup.png");
  const logoDark = path.join(SRC_BRAND, "logo-on-dark.png");
  const c2Icon = path.join(SRC_BRAND, "icon-512.png");
  const c2_3d = path.join(SRC_BRAND, "brand-c2-3d.png");

  // Logos → brand folder (logo noir = lockup; C2 icon + 3D)
  fs.copyFileSync(logoNoir, path.join(OUT, "03-logo-brand", "logo-noir.png"));
  fs.copyFileSync(logoDark, path.join(OUT, "03-logo-brand", "logo-on-dark.png"));
  fs.copyFileSync(c2Icon, path.join(OUT, "03-logo-brand", "icon-c2-512.png"));
  fs.copyFileSync(c2_3d, path.join(OUT, "03-logo-brand", "brand-c2-3d.png"));
  // keep lockup alias
  fs.copyFileSync(logoNoir, path.join(OUT, "03-logo-brand", "logo-lockup.png"));

  const story = path.join(OUT, "01-affiches", "story");
  const feed = path.join(OUT, "01-affiches", "feed");
  const coming = path.join(OUT, "01-affiches", "coming-soon");
  const vendeurs = path.join(OUT, "01-affiches", "vendeurs");

  // --- STORY 9:16 (WA Status / IG / TikTok) — product first, C2 discreet ---
  await cover(sources.vertical, 1080, 1920, path.join(story, "01-coming-soon.png"));
  await cover(sources.void, 1080, 1920, path.join(story, "02-montre.png"));
  await cover(sources.orbit, 1080, 1920, path.join(story, "03-mouvement.png"));
  await cover(sources.finale, 1080, 1920, path.join(story, "04-finale.png"));
  await withC2Badge(
    path.join(story, "02-montre.png"),
    path.join(story, "02-montre.png"),
    c2Icon,
    110,
    40
  );
  await withC2Badge(
    path.join(story, "03-mouvement.png"),
    path.join(story, "03-mouvement.png"),
    c2Icon,
    110,
    40
  );
  await makeEndCard(1080, 1920, path.join(story, "05-logo-noir-c2.png"), logoNoir, c2_3d);

  // --- FEED 1080x1350 (4:5 — meilleur reach IG que 1:1) ---
  await cover(sources.glass, 1080, 1350, path.join(feed, "01-montre-luxe.png"));
  await cover(sources.chain, 1080, 1350, path.join(feed, "02-bracelets.png"));
  await cover(sources.sunnies, 1080, 1350, path.join(feed, "03-lunettes.png"));
  await cover(sources.finale, 1080, 1350, path.join(feed, "04-selection.png"));
  await cover(sources.kv, 1080, 1350, path.join(feed, "05-editorial-logo-noir.png"));
  await withC2Badge(
    path.join(feed, "01-montre-luxe.png"),
    path.join(feed, "01-montre-luxe.png"),
    c2Icon,
    90,
    32
  );
  await withC2Badge(
    path.join(feed, "02-bracelets.png"),
    path.join(feed, "02-bracelets.png"),
    c2Icon,
    90,
    32
  );
  await makeEndCard(1080, 1080, path.join(feed, "06-carre-logo-noir-c2.png"), logoNoir, c2_3d);

  // --- COMING SOON ---
  await cover(sources.vertical, 1080, 1920, path.join(coming, "story-9x16.png"));
  await cover(sources.title3d, 1080, 1080, path.join(coming, "title-3d.png"));
  await cover(sources.kv, 1920, 1080, path.join(coming, "banner-editorial.png"));
  await makeEndCard(1080, 1920, path.join(coming, "end-logo-noir.png"), logoNoir, c2_3d);

  // --- VENDEURS (logo noir + C2, pas de collage produit moche) ---
  await makeVendeurCard(1080, 1350, path.join(vendeurs, "recrute-feed.png"), logoNoir, c2_3d);
  await makeVendeurCard(1080, 1920, path.join(vendeurs, "recrute-story.png"), logoNoir, c2_3d);

  // --- VIDEO client 9:16 & 16:9 — séquence premium ---
  const seq = [
    sources.void,
    sources.orbit,
    sources.glass,
    sources.chain,
    sources.sunnies,
    sources.finale,
    sources.vertical,
    path.join(story, "05-logo-noir-c2.png"),
  ];
  await buildVideo(
    seq,
    path.join(OUT, "02-videos", "client", "teaser-client-9x16.mp4"),
    1080,
    1920
  );
  await buildVideo(
    seq,
    path.join(OUT, "02-videos", "client", "teaser-client-16x9.mp4"),
    1920,
    1080
  );

  // Vendeur video: finale + end vendeur
  const vendEnd = path.join(vendeurs, "recrute-story.png");
  await buildVideo(
    [sources.finale, sources.orbit, c2_3d, vendEnd],
    path.join(OUT, "02-videos", "vendeurs", "teaser-vendeur-9x16.mp4"),
    1080,
    1920
  );

  // Cleanup tmp
  const tmp = path.join(OUT, "_tmp_frames");
  fs.rmSync(tmp, { recursive: true, force: true });

  const readme = `# VISUELS COIN229 — pack premium (réseaux)

Direction validée : teasers 3D luxe (fond sombre, or, produit flottant).
Logo : **noir** (\`logo-noir.png\`) + **C2** (\`brand-c2-3d.png\` / \`icon-c2-512.png\`).
Anciens collages = brouillons (\`docs/marketing/com/\`) — ne pas poster.

## Ce qui marche sur les réseaux

| Canal | Format | Fichier à poster |
|-------|--------|------------------|
| WhatsApp Status / Stories | 9:16 | \`01-affiches/story/\` ou vidéo 9x16 |
| Instagram Reels / TikTok | 9:16 vidéo | \`02-videos/client/teaser-client-9x16.mp4\` |
| Instagram feed | 4:5 | \`01-affiches/feed/01\` → \`05\` |
| Carrousel IG | 4:5 × 4–5 | feed/01 montre → 04 sélection → 05 éditorial |
| Facebook / YouTube | 16:9 | \`02-videos/client/teaser-client-16x9.mp4\` |
| Coming soon | 9:16 + carré | \`01-affiches/coming-soon/\` |
| Recrutement vendeurs | 4:5 / 9:16 | \`01-affiches/vendeurs/\` |

## Règles com

1. Produit d’abord (1–3 s), logo **une fois** en fin (noir + C2).
2. Pas de collage multi-logos.
3. Vidéos dans \`02-videos/\` uniquement (son normalisé).
4. Profil réseaux : \`03-logo-brand/icon-c2-512.png\`.

## Structure

\`\`\`
01-affiches/story|feed|coming-soon|vendeurs
02-videos/client|vendeurs
03-logo-brand/   logo-noir · C2 · lockup
04-captures-app/
05-produits-catalogue/
\`\`\`

Chemin : \`docs/marketing/VISUELS-COIN229\`
`;
  fs.writeFileSync(path.join(OUT, "LIRE-MOI.md"), readme, "utf8");

  console.log("OK →", OUT);
  const count = (dir) =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => !f.startsWith(".")).length
      : 0;
  console.log("story", count(story), "feed", count(feed), "coming", count(coming));
  console.log(
    "videos client",
    fs.readdirSync(path.join(OUT, "02-videos", "client"))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
