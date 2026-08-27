const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function makeIcon(size, file, radiusRatio = 0.22) {
  const r = Math.round(size * radiusRatio);
  const fontSize = Math.round(size * 0.48);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#020b26"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#2b9bff">C</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function makeMaskable(size, file) {
  const pad = Math.round(size * 0.1);
  const inner = size - pad * 2;
  const fontSize = Math.round(inner * 0.48);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#020b26"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#2b9bff">C</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function main() {
  const dir = path.join(__dirname, "..", "public", "icons");
  fs.mkdirSync(dir, { recursive: true });
  await makeIcon(192, path.join(dir, "icon-192.png"));
  await makeIcon(512, path.join(dir, "icon-512.png"));
  await makeMaskable(512, path.join(dir, "icon-512-maskable.png"));
  await makeIcon(180, path.join(dir, "apple-touch-icon.png"), 0.2);
  console.log("PWA icons generated in public/icons");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
