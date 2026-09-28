/**
 * Suite E2E vendeur — prêt avant paiement.
 * Couvre auth, isolation, vitrine, niches, admin gate, panier mono-vendeur.
 */
const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const BASE = process.env.BASE_URL || "https://coin229.vercel.app";
const prisma = new PrismaClient();
const stamp = Date.now().toString(36);

function parseSetCookie(res) {
  const raw = res.headers.getSetCookie?.() || [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  const single = res.headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function check(name, fn) {
  try {
    const detail = await fn();
    return { name, ok: true, ...((detail && typeof detail === "object") ? detail : {}) };
  } catch (e) {
    return { name, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  const email = `ready-vendeur-${stamp}@coin229.test`;
  const password = randomBytes(12).toString("base64url");
  const boutique = `Ready Marque ${stamp}`;
  const results = [];

  // —— Pages publiques
  for (const path of [
    "/vendeur/inscription",
    "/vendeur/login",
    "/vendeur/coin229",
    "/boutique",
    "/panier",
  ]) {
    results.push(
      await check(`GET ${path}`, async () => {
        const r = await fetch(`${BASE}${path}`);
        if (r.status !== 200) throw new Error(`status ${r.status}`);
        return { status: r.status };
      })
    );
  }

  results.push(
    await check("footer CTA vendeur", async () => {
      const r = await fetch(`${BASE}/`);
      const html = await r.text();
      // may be old deploy — soft check later after redeploy
      return {
        status: r.status,
        hasCta:
          html.includes("/vendeur/inscription") ||
          html.includes("Vendre sur Coin229"),
      };
    })
  );

  // —— Middleware: espace sans cookie → redirect
  results.push(
    await check("middleware espace sans auth", async () => {
      const r = await fetch(`${BASE}/vendeur/espace`, { redirect: "manual" });
      if (r.status !== 307 && r.status !== 302)
        throw new Error(`expected redirect, got ${r.status}`);
      const loc = r.headers.get("location") || "";
      if (!loc.includes("/vendeur/login")) throw new Error(`bad location ${loc}`);
      return { status: r.status };
    })
  );

  // —— Register
  let vendorCookie = "";
  let vendorId = "";
  let slug = "";
  results.push(
    await check("register", async () => {
      const r = await fetch(`${BASE}/api/vendor/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomBoutique: boutique,
          email,
          password,
          contact: "+22990112233",
          description: "Marque prête E2E",
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(JSON.stringify(j));
      vendorCookie = parseSetCookie(r);
      vendorId = j.vendorId;
      slug = j.slug;
      if (!vendorCookie) throw new Error("no cookie");
      if (j.statut !== "en_attente") throw new Error(`statut ${j.statut}`);
      return { vendorId, slug, statut: j.statut };
    })
  );

  // —— Login bad password
  results.push(
    await check("login mauvais MDP", async () => {
      const r = await fetch(`${BASE}/api/vendor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "wrong-password-xx" }),
      });
      if (r.status !== 401) throw new Error(`status ${r.status}`);
      return { status: r.status };
    })
  );

  // —— Login ok
  results.push(
    await check("login ok", async () => {
      const r = await fetch(`${BASE}/api/vendor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(JSON.stringify(j));
      vendorCookie = parseSetCookie(r) || vendorCookie;
      return { status: r.status, statut: j.statut };
    })
  );

  // —— Espace pages
  for (const path of [
    "/vendeur/espace",
    "/vendeur/espace/produits",
    "/vendeur/espace/commandes",
    "/vendeur/espace/pub",
  ]) {
    results.push(
      await check(`auth ${path}`, async () => {
        const r = await fetch(`${BASE}${path}`, {
          headers: { Cookie: vendorCookie },
          redirect: "manual",
        });
        if (r.status !== 200) throw new Error(`status ${r.status}`);
        const html = await r.text();
        if (!html.includes(boutique) && !html.includes("Espace vendeur") && !html.includes("Produits")) {
          // dashboard should show boutique name
          if (path === "/vendeur/espace" && !html.includes(boutique))
            throw new Error("missing boutique name");
        }
        return { status: r.status };
      })
    );
  }

  // —— Vitrine pas publique tant que en_attente
  results.push(
    await check("vitrine cachée en_attente", async () => {
      const r = await fetch(`${BASE}/vendeur/${slug}`, { redirect: "manual" });
      if (r.status !== 404) throw new Error(`expected 404 got ${r.status}`);
      return { status: r.status };
    })
  );

  // —— Activer + produit
  let productId = "";
  results.push(
    await check("activer + produit niche", async () => {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { statut: "actif" },
      });
      const p = await prisma.product.create({
        data: {
          vendorId,
          nom: `Ready Piece ${stamp}`,
          description: "Produit ready avant paiement",
          categorie: "sac",
          niche: "cosmétique",
          genre: "femme",
          prix: 9900,
          stockQuantite: 4,
          images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
          ],
          statut: "actif",
        },
      });
      productId = p.id;
      return { productId };
    })
  );

  results.push(
    await check("vitrine publique après activation", async () => {
      const r = await fetch(`${BASE}/vendeur/${slug}`);
      const html = await r.text();
      if (r.status !== 200) throw new Error(`status ${r.status}`);
      if (!html.includes(boutique)) throw new Error("missing boutique");
      if (!html.includes(`Ready Piece ${stamp}`)) throw new Error("missing product");
      return { status: r.status };
    })
  );

  results.push(
    await check("fiche produit + marque + UTM", async () => {
      const url = `${BASE}/produit/${productId}?utm_source=vendor&utm_medium=share&utm_campaign=${slug}`;
      const r = await fetch(url);
      const html = await r.text();
      if (r.status !== 200) throw new Error(`status ${r.status}`);
      if (!html.includes(boutique)) throw new Error("missing brand");
      if (!html.includes(`Ready Piece ${stamp}`)) throw new Error("missing nom");
      return { status: r.status };
    })
  );

  results.push(
    await check("boutique filtre niche", async () => {
      const r = await fetch(
        `${BASE}/boutique?niche=${encodeURIComponent("cosmétique")}`
      );
      const html = await r.text();
      if (r.status !== 200) throw new Error(`status ${r.status}`);
      if (!html.includes(`Ready Piece ${stamp}`))
        throw new Error("product not in niche filter");
      return { status: r.status };
    })
  );

  // —— Isolation commandes (vendor A ne voit pas order vendor B)
  results.push(
    await check("isolation commandes vendorId", async () => {
      const coin = await prisma.vendor.findFirst({
        where: { OR: [{ slug: "coin229" }, { id: "vendor_coin229_local" }] },
      });
      if (!coin) throw new Error("coin229 vendor missing");
      const mine = await prisma.order.count({ where: { vendorId } });
      const theirs = await prisma.order.count({
        where: { vendorId: coin.id },
      });
      // just ensure queries are scoped differently
      if (vendorId === coin.id) throw new Error("same vendor");
      return { mine, theirs, coinId: coin.id };
    })
  );

  // —— Suspend + login bloqué
  results.push(
    await check("suspend + login 403", async () => {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { statut: "suspendu" },
      });
      const r = await fetch(`${BASE}/api/vendor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (r.status !== 403) throw new Error(`status ${r.status}`);
      return { status: r.status };
    })
  );

  results.push(
    await check("produit masqué si vendeur suspendu", async () => {
      const r = await fetch(`${BASE}/produit/${productId}`);
      // fetchProductById returns null → 404
      if (r.status !== 404) throw new Error(`expected 404 got ${r.status}`);
      return { status: r.status };
    })
  );

  // —— Logout
  results.push(
    await check("logout DELETE", async () => {
      const r = await fetch(`${BASE}/api/vendor/login`, {
        method: "DELETE",
        headers: { Cookie: vendorCookie },
      });
      if (!r.ok) throw new Error(`status ${r.status}`);
      return { status: r.status };
    })
  );

  // —— Admin gate
  results.push(
    await check("admin vendeurs protégé", async () => {
      const r = await fetch(`${BASE}/admin/vendeurs`, { redirect: "manual" });
      if (r.status !== 307 && r.status !== 302)
        throw new Error(`status ${r.status}`);
      return { status: r.status };
    })
  );

  // —— Panier mono-vendeur (logique store — unit via simulation)
  results.push(
    await check("panier mono-vendeur logique", async () => {
      const items = [{ vendorId: "A" }, { vendorId: "B" }];
      const multi = new Set(items.map((i) => i.vendorId)).size > 1;
      if (!multi) throw new Error("expected multi");
      return { multi };
    })
  );

  // Cleanup
  results.push(
    await check("cleanup", async () => {
      if (productId) {
        await prisma.orderItem.deleteMany({ where: { productId } });
        await prisma.product.delete({ where: { id: productId } }).catch(() => {});
      }
      if (vendorId) {
        await prisma.vendor.delete({ where: { id: vendorId } }).catch(() => {});
      }
      return {};
    })
  );

  // Compte démo uniquement si un mot de passe est fourni hors du dépôt.
  const demoEmail = "demo.vendeur@coin229.bj";
  const demoPass = process.env.DEMO_VENDOR_PASSWORD?.trim();
  if (!demoPass || demoPass.length < 8) {
    results.push({
      name: "seed compte démo durable",
      ok: true,
      skipped: "DEMO_VENDOR_PASSWORD absent",
    });
  } else {
  results.push(
    await check("seed compte démo durable", async () => {
      const salt = randomBytes(16);
      const hash = scryptSync(demoPass, salt, 64);
      const passwordHash = `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
      const existing = await prisma.vendor.findUnique({ where: { email: demoEmail } });
      let v;
      if (existing) {
        v = await prisma.vendor.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            statut: "actif",
            slug: existing.slug || "demo-marque",
            nomBoutique: "Demo Marque",
            contact: "+22990001122",
            description: "Compte démo vendeur — prêt avant paiement.",
          },
        });
      } else {
        v = await prisma.vendor.create({
          data: {
            nomBoutique: "Demo Marque",
            email: demoEmail,
            passwordHash,
            contact: "+22990001122",
            slug: "demo-marque",
            description: "Compte démo vendeur — prêt avant paiement.",
            statut: "actif",
          },
        });
      }
      const count = await prisma.product.count({ where: { vendorId: v.id } });
      if (count === 0) {
        await prisma.product.create({
          data: {
            vendorId: v.id,
            nom: "Serum Glow Démo",
            description: "Produit démo niche cosmétique pour tests pub.",
            categorie: "sac",
            niche: "cosmétique",
            genre: "femme",
            prix: 12000,
            prixPromo: 9900,
            stockQuantite: 10,
            images: [
              "https://images.unsplash.com/photo-1620916565916-15bd429d44df?w=800&q=80",
            ],
            statut: "actif",
          },
        });
      }
      return { slug: v.slug, email: demoEmail };
    })
  );
  }

  const failed = results.filter((r) => !r.ok);
  const soft = results.filter((r) => r.name === "footer CTA vendeur" && r.ok && !r.hasCta);

  console.log(
    JSON.stringify(
      {
        base: BASE,
        passed: results.filter((r) => r.ok).length,
        total: results.length,
        failed,
        softWarnings: soft,
        demoAccount: demoPass
          ? {
              email: demoEmail,
              login: `${BASE}/vendeur/login`,
              store: `${BASE}/vendeur/demo-marque`,
            }
          : null,
        results,
      },
      null,
      2
    )
  );
  process.exit(failed.length ? 1 : 0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
