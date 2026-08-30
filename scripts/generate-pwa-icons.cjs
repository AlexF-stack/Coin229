const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const GOLD = "#d4af37";
const NAVY = "#0f2d26";

function c2Svg(size, { bg = NAVY, c = "#ffffff", two = GOLD, pad = 0 } = {}) {
  const s = size;
  const inset = pad;
  const vb = 64;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${vb} ${vb}">
  <rect width="${vb}" height="${vb}" rx="${Math.round(vb * 0.22)}" fill="${bg}"/>
  <g transform="translate(${inset}, ${inset}) scale(${(vb - inset * 2) / vb})">
    <path d="M38.5 18.2c-2.1-1.6-4.7-2.5-7.6-2.5-8.2 0-14.2 6.1-14.2 15.3s6 15.3 14.2 15.3c2.9 0 5.5-.9 7.6-2.5"
      stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M30.2 28.5c0-3.8 2.9-6.4 7.1-6.4 3.9 0 6.7 2.3 6.7 5.5 0 2.5-1.4 4.2-4.6 6.3l-7.4 4.8v3.8h14.2"
      stroke="${two}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;
}

async function fromSourceOrSvg(size, file, opts) {
  const source = path.join(__dirname, "..", "public", "brand", "icon-dark.png");
  if (fs.existsSync(source)) {
    const radius = Math.round(size * (opts.radiusRatio ?? 0.22));
    const rounded = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/>
      </svg>`
    );
    await sharp(source)
      .resize(size, size, { fit: "cover" })
      .composite([{ input: rounded, blend: "dest-in" }])
      .png()
      .toFile(file);
    return;
  }
  await sharp(Buffer.from(c2Svg(size, opts))).png().toFile(file);
}

async function makeMaskable(size, file) {
  const source = path.join(__dirname, "..", "public", "brand", "icon-dark.png");
  if (fs.existsSync(source)) {
    const pad = Math.round(size * 0.12);
    const inner = size - pad * 2;
    const bg = await sharp({
      create: { width: size, height: size, channels: 3, background: NAVY },
    })
      .png()
      .toBuffer();
    const icon = await sharp(source).resize(inner, inner, { fit: "cover" }).png().toBuffer();
    await sharp(bg)
      .composite([{ input: icon, top: pad, left: pad }])
      .png()
      .toFile(file);
    return;
  }
  await sharp(Buffer.from(c2Svg(size, { pad: 4 }))).png().toFile(file);
}

async function main() {
  // Dossier versionné : Android/Chrome figent l’icône à l’install ;
  // un nouveau chemin force le refresh après réinstall (évite CacheFirst SW).
  const dir = path.join(__dirname, "..", "public", "icons", "c2");
  fs.mkdirSync(dir, { recursive: true });
  await fromSourceOrSvg(192, path.join(dir, "icon-192.png"), { radiusRatio: 0.22 });
  await fromSourceOrSvg(512, path.join(dir, "icon-512.png"), { radiusRatio: 0.22 });
  await makeMaskable(512, path.join(dir, "icon-512-maskable.png"));
  await fromSourceOrSvg(180, path.join(dir, "apple-touch-icon.png"), { radiusRatio: 0.2 });
  console.log("PWA icons generated in public/icons/c2");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
