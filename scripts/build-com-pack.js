/**
 * Pack com FINAL Coin229 — structuré, 1 logo discret, message commercial, son garanti.
 * node scripts/build-com-pack.js
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FF =
  process.env.FFMPEG ||
  "C:\\Users\\ALEX\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.1-full_build\\bin\\ffmpeg.exe";
const FP = FF.replace("ffmpeg.exe", "ffprobe.exe");

const PACK = path.join(ROOT, "docs/marketing/com/PACK-FINAL");
const AFF = path.join(PACK, "01-affiches");
const VID = path.join(PACK, "02-videos");
const ASSETS = path.join(PACK, "_assets");
const FRAMES = path.join(ASSETS, "frames");
const CLIPS = path.join(ASSETS, "clips");

const LOGO = path.join(ROOT, "public/brand/logo-on-dark.png");
const LOGO_LIGHT = path.join(ROOT, "public/brand/logo-lockup.png");
const ICON = path.join(ROOT, "public/icons/c2/icon-512.png");
const PROD = {
  montre: path.join(ROOT, "public/uploads/montres-luxe/montre-05.jpg"),
  bijou: path.join(ROOT, "public/uploads/montres-bijoux/mb-08.jpg"),
  sandale: path.join(ROOT, "public/uploads/sandales-luxe/sandale-01.jpg"),
};
const APP = {
  home: path.join(ROOT, "docs/marketing/com/teaser-brand/app/home.png"),
  boutique: path.join(
    ROOT,
    "docs/marketing/com/teaser-brand/app/boutique.png"
  ),
};

function sh(cmd) {
  execSync(cmd, {
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
    maxBuffer: 30 * 1024 * 1024,
  });
}
function ff(args) {
  sh(`"${FF}" -y ${args}`);
}
function hasAudio(file) {
  try {
    const out = execSync(
      `"${FP}" -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "${file}"`,
      { encoding: "utf8", windowsHide: true }
    ).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function ensure() {
  for (const d of [PACK, AFF, VID, ASSETS, FRAMES, CLIPS]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

/** Son commercial simple : kick soft + pad (toujours muxé) */
function makeBed(seconds = 28) {
  const out = path.join(ASSETS, "bed.m4a");
  // Deux couches : pad + pulse rythmique léger
  ff(
    `-f lavfi -i "sine=frequency=98:duration=${seconds}" ` +
      `-f lavfi -i "sine=frequency=147:duration=${seconds}" ` +
      `-f lavfi -i "sine=frequency=196:duration=${seconds}" ` +
      `-f lavfi -i "anoisesrc=d=${seconds}:c=pink:a=0.025" ` +
      `-filter_complex "` +
      `[0]volume=0.25[a];[1]volume=0.18[b];[2]volume=0.35[c];` +
      `[3]lowpass=f=800,volume=0.7[n];` +
      `[a][b][c][n]amix=inputs=4:normalize=0,` +
      `loudnorm=I=-16:TP=-1.5:LRA=11,` +
      `afade=t=in:d=1.2,afade=t=out:st=${seconds - 3}:d=2.8" -c:a aac -b:a 192k "${out}"`
  );
  return out;
}

/** Affiche Story 9:16 — 1 produit + 1 logo petit + CTA */
function posterStory() {
  const out = path.join(AFF, "01-story-produit.png");
  ff(
    `-i "${PROD.montre}" -i "${LOGO}" -filter_complex "` +
      `color=c=0x0B2E24:s=1080x1920:d=1[bg];` +
      `[0:v]scale=900:1100:force_original_aspect_ratio=decrease,` +
      `pad=900:1100:(ow-iw)/2:(oh-ih)/2:color=0x0B2E24[p];` +
      `[bg][p]overlay=(W-w)/2:320[base];` +
      `[1:v]scale=280:-1[lg];` +
      `[base][lg]overlay=(W-w)/2:80,` +
      `drawtext=text='Livraison Cotonou':fontcolor=0xC9A227:fontsize=28:` +
      `x=(w-text_w)/2:y=1480:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='Paiement a la livraison':fontcolor=white:fontsize=34:` +
      `x=(w-text_w)/2:y=1530:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='Commander  →  coin229.vercel.app':fontcolor=0xC9A227:fontsize=26:` +
      `x=(w-text_w)/2:y=1720:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

/** Affiche feed 1:1 — message commercial clair */
function posterFeed() {
  const out = path.join(AFF, "02-feed-offre.png");
  ff(
    `-i "${PROD.bijou}" -i "${LOGO_LIGHT}" -filter_complex "` +
      `color=c=0xF4EFE6:s=1080x1080:d=1[bg];` +
      `[0:v]scale=500:500:force_original_aspect_ratio=decrease,` +
      `pad=500:500:(ow-iw)/2:(oh-ih)/2:color=0xF4EFE6[p];` +
      `[bg][p]overlay=60:290[base];` +
      `[1:v]scale=300:-1[lg];` +
      `[base][lg]overlay=60:60,` +
      `drawtext=text='Montres & bijoux':fontcolor=0x0B2E24:fontsize=42:` +
      `x=600:y=320:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='livres chez toi':fontcolor=0x0B2E24:fontsize=42:` +
      `x=600:y=380:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='Des 25 000 FCFA':fontcolor=0xC9A227:fontsize=28:` +
      `x=600:y=480:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='livraison offerte':fontcolor=0x333333:fontsize=26:` +
      `x=600:y=530:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='coin229.vercel.app/boutique':fontcolor=0x0B2E24:fontsize=22:` +
      `x=600:y=900:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

/** Affiche vendeurs — recrutement */
function posterVendeur() {
  const out = path.join(AFF, "03-recrute-vendeurs.png");
  ff(
    `-i "${LOGO_LIGHT}" -filter_complex "` +
      `color=c=0xF4EFE6:s=1080x1350:d=1[bg];` +
      `[0:v]scale=360:-1[lg];` +
      `[bg][lg]overlay=(W-w)/2:80,` +
      `drawtext=text='Vends sur Coin229':fontcolor=0x0B2E24:fontsize=48:` +
      `x=(w-text_w)/2:y=280:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='1. Photos   2. Prix   3. Commandes':fontcolor=0x333333:fontsize=28:` +
      `x=(w-text_w)/2:y=400:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='Commission 10 pct':fontcolor=0xC9A227:fontsize=40:` +
      `x=(w-text_w)/2:y=520:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='Inscription gratuite':fontcolor=0x0B2E24:fontsize=32:` +
      `x=(w-text_w)/2:y=620:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawbox=x=140:y=780:w=800:h=90:color=0x0B2E24:t=fill,` +
      `drawtext=text='coin229.vercel.app/vendeur/inscription':fontcolor=white:fontsize=22:` +
      `x=(w-text_w)/2:y=810:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

/** Coming soon sobre — logo une fois en haut */
function posterComingSoon() {
  const out = path.join(AFF, "04-coming-soon.png");
  ff(
    `-i "${LOGO}" -filter_complex "` +
      `color=c=0x0B2E24:s=1080x1920:d=1[bg];` +
      `[0:v]scale=420:-1[lg];` +
      `[bg][lg]overlay=(W-w)/2:220,` +
      `drawtext=text='COMING SOON':fontcolor=white:fontsize=64:` +
      `x=(w-text_w)/2:y=780:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='Toute une tenue. Les bons details.':fontcolor=0xC9A227:fontsize=28:` +
      `x=(w-text_w)/2:y=900:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='Cotonou · Porto-Novo · Godomey':fontcolor=0xcccccc:fontsize=24:` +
      `x=(w-text_w)/2:y=980:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='coin229.vercel.app':fontcolor=white:fontsize=26:` +
      `x=(w-text_w)/2:y=1600:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf" ` +
      `-frames:v 1 -update 1 "${out}"`
  );
  return out;
}

function frame(name, filterArgs, inputs) {
  const out = path.join(FRAMES, name);
  const ins = inputs.map((p) => `-i "${p}"`).join(" ");
  ff(`${ins} -filter_complex "${filterArgs}" -frames:v 1 -update 1 "${out}"`);
  return out;
}

function buildFrames() {
  // 1 — Logo seul (court)
  frame(
    "f01.png",
    `color=c=0x0B2E24:s=1920x1080:d=1[bg];[0:v]scale=640:-1[lg];[bg][lg]overlay=(W-w)/2:(H-h)/2`,
    [LOGO]
  );
  // 2 — Produit montre + CTA (logo petit coin)
  frame(
    "f02.png",
    `color=c=0x0a0b0f:s=1920x1080:d=1[bg];` +
      `[0:v]scale=780:780:force_original_aspect_ratio=decrease,pad=780:780:(ow-iw)/2:(oh-ih)/2:color=0x0a0b0f[p];` +
      `[bg][p]overlay=120:(H-h)/2[base];` +
      `[1:v]scale=280:-1[lg];` +
      `[base][lg]overlay=1600:60,` +
      `drawtext=text='Montres selectionnees':fontcolor=white:fontsize=42:x=980:y=360:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='Livrees a Cotonou':fontcolor=0xC9A227:fontsize=34:x=980:y=440:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='Paiement a la livraison':fontcolor=0xdddddd:fontsize=28:x=980:y=520:fontfile=C\\\\:/Windows/Fonts/arial.ttf`,
    [PROD.montre, LOGO]
  );
  // 3 — Bijou
  frame(
    "f03.png",
    `color=c=0x0a0b0f:s=1920x1080:d=1[bg];` +
      `[0:v]scale=780:780:force_original_aspect_ratio=decrease,pad=780:780:(ow-iw)/2:(oh-ih)/2:color=0x0a0b0f[p];` +
      `[bg][p]overlay=1020:(H-h)/2[base];` +
      `[1:v]scale=280:-1[lg];` +
      `[base][lg]overlay=60:60,` +
      `drawtext=text='Bijoux qui completent':fontcolor=white:fontsize=40:x=80:y=400:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='ta tenue':fontcolor=0xC9A227:fontsize=40:x=80:y=470:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf`,
    [PROD.bijou, LOGO]
  );
  // 4 — App boutique (preuve)
  frame(
    "f04.png",
    `color=c=0x0a0b0f:s=1920x1080:d=1[bg];` +
      `[0:v]scale=1500:-1[ui];` +
      `[bg][ui]overlay=(W-w)/2:(H-h)/2[base];` +
      `[1:v]scale=240:-1[lg];` +
      `[base][lg]overlay=48:40,` +
      `drawtext=text='Sur coin229.vercel.app':fontcolor=0xC9A227:fontsize=28:x=48:y=1020:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf`,
    [APP.boutique, LOGO]
  );
  // 5 — Offre
  frame(
    "f05.png",
    `color=c=0x0B2E24:s=1920x1080:d=1[bg];` +
      `[0:v]scale=360:-1[lg];` +
      `[bg][lg]overlay=(W-w)/2:160,` +
      `drawtext=text='Livraison offerte des 25 000 FCFA':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=480:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='Mobile Money  ·  Paiement a la livraison':fontcolor=0xC9A227:fontsize=30:x=(w-text_w)/2:y=580:fontfile=C\\\\:/Windows/Fonts/arial.ttf,` +
      `drawtext=text='Cotonou · Porto-Novo · Godomey':fontcolor=0xcccccc:fontsize=26:x=(w-text_w)/2:y=680:fontfile=C\\\\:/Windows/Fonts/arial.ttf`,
    [LOGO]
  );
  // 6 — CTA final
  frame(
    "f06.png",
    `color=c=0x000000:s=1920x1080:d=1[bg];` +
      `[0:v]scale=520:-1[lg];` +
      `[bg][lg]overlay=(W-w)/2:280,` +
      `drawtext=text='Commande maintenant':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=620:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf,` +
      `drawtext=text='coin229.vercel.app/boutique':fontcolor=0xC9A227:fontsize=36:x=(w-text_w)/2:y=720:fontfile=C\\\\:/Windows/Fonts/arialbd.ttf`,
    [LOGO]
  );
}

function clip(frameName, idx, sec) {
  const src = path.join(FRAMES, frameName);
  const out = path.join(CLIPS, `c${idx}.mp4`);
  const n = Math.round(sec * 30);
  ff(
    `-loop 1 -i "${src}" -vf "zoompan=z='min(1.0+0.0008*on,1.08)':d=${n}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,format=yuv420p" ` +
      `-t ${sec} -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p "${out}"`
  );
  return out;
}

function muxVideo(clips, audio, outPath) {
  const list = path.join(CLIPS, "list.txt");
  fs.writeFileSync(
    list,
    clips.map((c) => `file '${c.replace(/\\/g, "/")}'`).join("\n")
  );
  // Force re-encode + audio explicit to avoid silent mux issues
  ff(
    `-f concat -safe 0 -i "${list}" -i "${audio}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v libx264 -preset medium -crf 18 ` +
      `-c:a aac -b:a 192k -shortest -movflags +faststart "${outPath}"`
  );
  if (!hasAudio(outPath)) {
    throw new Error("VIDEO SANS AUDIO: " + outPath);
  }
}

function writeReadme() {
  const md = `# Pack com FINAL — Coin229

## Structure

\`\`\`
PACK-FINAL/
  01-affiches/     ← 4 affiches (logo 1×, message clair)
  02-videos/       ← teaser client + teaser vendeur (AVEC SON)
  LIRE-MOI.md
\`\`\`

## Affiches — quoi poster

| Fichier | Où | Message |
|---------|-----|---------|
| \`01-story-produit.png\` | WhatsApp Status / IG Story | Produit + livraison + CTA |
| \`02-feed-offre.png\` | Instagram / Facebook | Offre 25k livraison offerte |
| \`03-recrute-vendeurs.png\` | Groupes vendeurs | Commission 10% + lien inscription |
| \`04-coming-soon.png\` | Teaser avant lancement | Coming soon sobre |

## Vidéos — quoi diffuser

| Fichier | Durée | Usage |
|---------|-------|--------|
| \`teaser-client-16x9.mp4\` | ~22 s | Facebook / YouTube |
| \`teaser-client-9x16.mp4\` | ~22 s | Status / TikTok / Reels |
| \`teaser-vendeur-9x16.mp4\` | ~12 s | Recrutement marques |

**Son :** bed original Coin229 (muxé et vérifié).

## Règles com

1. **1 logo** par visuel (pas de doublon C2 + lockup + icône).
2. **1 message** + **1 CTA** (lien boutique ou inscription).
3. Toujours coller le lien pub UTM depuis l’espace vendeur pour les marques.

Régénérer : \`node scripts/build-com-pack.js\`
`;
  fs.writeFileSync(path.join(PACK, "LIRE-MOI.md"), md, "utf8");
}

function main() {
  ensure();
  console.log("1. Affiches…");
  posterStory();
  posterFeed();
  posterVendeur();
  posterComingSoon();

  console.log("2. Frames teaser…");
  buildFrames();

  console.log("3. Audio…");
  const bed = makeBed(26);

  console.log("4. Clips client…");
  const clientClips = [
    clip("f01.png", 1, 2.5),
    clip("f02.png", 2, 4.0),
    clip("f03.png", 3, 3.5),
    clip("f04.png", 4, 4.0),
    clip("f05.png", 5, 3.5),
    clip("f06.png", 6, 4.0),
  ];

  const v16 = path.join(VID, "teaser-client-16x9.mp4");
  const v9 = path.join(VID, "teaser-client-9x16.mp4");
  console.log("5. Mux client…");
  muxVideo(clientClips, bed, v16);
  ff(
    `-i "${v16}" -vf "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920" ` +
      `-c:v libx264 -crf 18 -c:a aac -b:a 192k -movflags +faststart "${v9}"`
  );
  if (!hasAudio(v9)) throw new Error("9x16 sans audio");

  // Teaser vendeur court depuis affiche + CTA
  console.log("6. Teaser vendeur…");
  const vendPoster = path.join(AFF, "03-recrute-vendeurs.png");
  const vendClip = path.join(CLIPS, "vendeur.mp4");
  ff(
    `-loop 1 -i "${vendPoster}" -i "${bed}" ` +
      `-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xF4EFE6,zoompan=z='min(1.0+0.0007*on,1.06)':d=360:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p" ` +
      `-t 12 -map 0:v:0 -map 1:a:0 -c:v libx264 -crf 18 -c:a aac -b:a 192k -shortest ` +
      `-movflags +faststart "${path.join(VID, "teaser-vendeur-9x16.mp4")}"`
  );
  if (!hasAudio(path.join(VID, "teaser-vendeur-9x16.mp4"))) {
    throw new Error("vendeur sans audio");
  }

  writeReadme();
  console.log("OK", PACK);
  console.log("AUDIO client16", hasAudio(v16));
  console.log("AUDIO client9", hasAudio(v9));
}

main();
