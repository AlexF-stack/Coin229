const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "https://coin229.vercel.app";

const VIEWPORTS = [
  { name: "Tiny-320", width: 320, height: 568, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: "Galaxy-S8", ...devices["Galaxy S8"] },
  { name: "iPhone-SE", ...devices["iPhone SE"] },
  { name: "iPhone-13", ...devices["iPhone 13"] },
  { name: "iPhone-14-Pro-Max", ...devices["iPhone 14 Pro Max"] },
  { name: "Pixel-7", ...devices["Pixel 7"] },
  { name: "iPad-Mini", ...devices["iPad Mini"] },
];

const PAGES = [
  { path: "/", expect: ["Explorer la boutique", "Livraison locale"] },
  { path: "/boutique", expect: ["Boutique", "Rechercher", "Toutes"] },
  { path: "/boutique?categorie=montre", expect: ["Montres"] },
  { path: "/produit/prod_montre_recta", expect: ["FCFA"] },
  { path: "/panier", expect: ["Panier"] },
  { path: "/commande", expect: ["commande", "Commande", "Livraison", "panier"] },
  { path: "/favoris", expect: ["Favoris", "favoris"] },
  { path: "/compte", expect: ["Compte", "compte", "connecter", "Connexion"] },
  { path: "/offline", expect: ["hors ligne", "Hors ligne"] },
  { path: "/a-propos", expect: ["propos", "Coin229"] },
  { path: "/livraison", expect: ["Livraison", "FCFA"] },
  { path: "/retours", expect: ["Retour", "retour"] },
  { path: "/page-introuvable-qa-xyz", expect: ["introuvable", "404", "boutique"] },
];

function hasAny(text, needles) {
  const t = text.toLowerCase();
  return needles.some((n) => t.includes(String(n).toLowerCase()));
}

async function auditPage(page, route) {
  const issues = [];
  const url = BASE + route.path;
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForTimeout(800);

  const status = response ? response.status() : 0;
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const title = await page.title();

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const vw = window.innerWidth;

    // Overflow page réel : ignore le contenu dans overflow-x auto/scroll
    let maxRight = 0;
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width <= 1) continue;
      if (r.right <= vw + 2) continue;
      let p = el.parentElement;
      let contained = false;
      while (p && p !== body) {
        const ps = getComputedStyle(p);
        if (
          ps.overflowX === "auto" ||
          ps.overflowX === "scroll" ||
          ps.overflowX === "hidden" ||
          ps.overflowX === "clip"
        ) {
          contained = true;
          break;
        }
        p = p.parentElement;
      }
      if (!contained) maxRight = Math.max(maxRight, r.right);
    }
    const overflowX = Math.max(0, Math.round(maxRight - vw));

    const interactive = [
      ...document.querySelectorAll(
        "header a, header button, nav a, nav button, .btn, main button[aria-label]"
      ),
    ];
    let small = 0;
    let tiny = 0;
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (r.width < 40 || r.height < 40) small++;
      if (r.width < 28 || r.height < 28) tiny++;
    }

    const bottomNav = !!document.querySelector(
      'nav.fixed.bottom-0, nav[class*="bottom-0"]'
    );
    const dialogs = document.querySelectorAll('[role="dialog"]').length;

    const mainOpacity = (() => {
      const m = document.querySelector("main");
      return m ? parseFloat(getComputedStyle(m).opacity) : 1;
    })();

    return {
      overflowX,
      smallTouch: small,
      tinyTouch: tiny,
      bottomNav,
      dialogs,
      mainOpacity,
      productLinks: document.querySelectorAll('a[href*="/produit/"]').length,
      vw: window.innerWidth,
      vh: window.innerHeight,
    };
  });

  if (route.path === "/page-introuvable-qa-xyz") {
    if (![404, 200].includes(status) && status !== 404) {
      // Next not-found can be 404
    }
    if (status !== 404 && !hasAny(bodyText, route.expect)) {
      issues.push({ sev: "P1", msg: `404 page unexpected status=${status}` });
    }
  } else if (status >= 400) {
    issues.push({ sev: "P0", msg: `HTTP ${status}` });
  }

  if (!hasAny(bodyText, route.expect) && route.path !== "/page-introuvable-qa-xyz") {
    // commande may redirect if empty cart
    if (!(route.path === "/commande" && hasAny(bodyText, ["panier", "vide", "Boutique"]))) {
      issues.push({
        sev: "P1",
        msg: `Contenu attendu manquant (${route.expect.slice(0, 2).join("|")})`,
      });
    }
  }

  if (metrics.overflowX > 3) {
    issues.push({
      sev: metrics.overflowX > 20 ? "P0" : "P1",
      msg: `Overflow horizontal ${metrics.overflowX}px`,
    });
  }

  if (metrics.mainOpacity < 0.4) {
    issues.push({ sev: "P0", msg: `Main opacity ${metrics.mainOpacity}` });
  }

  // Bottom nav expected on most shop pages at mobile widths
  const expectBottomNav =
    metrics.vw < 768 &&
    !["/commande", "/offline", "/page-introuvable-qa-xyz"].includes(route.path) &&
    !route.path.startsWith("/produit/");
  if (expectBottomNav && !metrics.bottomNav) {
    issues.push({ sev: "P2", msg: "Bottom nav absente" });
  }

  if (metrics.tinyTouch > 8) {
    issues.push({
      sev: "P2",
      msg: `${metrics.tinyTouch} cibles tactiles < 28px`,
    });
  }

  return {
    path: route.path,
    status,
    title,
    issues,
    metrics,
    ok: issues.filter((i) => i.sev === "P0" || i.sev === "P1").length === 0,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = {
    base: BASE,
    startedAt: new Date().toISOString(),
    devices: [],
    summary: { pass: 0, fail: 0, p0: 0, p1: 0, p2: 0 },
  };

  for (const device of VIEWPORTS) {
    const context = await browser.newContext({
      ...device,
      locale: "fr-BJ",
    });
    const page = await context.newPage();
    const deviceResult = {
      name: device.name,
      width: device.viewport?.width || device.width,
      height: device.viewport?.height || device.height,
      pages: [],
    };

    // Seed cart once so /panier and /commande are tested with content (catch layout bugs)
    try {
      await page.goto(BASE + "/boutique", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(600);
      const add = page.getByRole("button", { name: "Ajouter au panier" }).first();
      if (await add.isVisible().catch(() => false)) {
        await add.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(400);
      }
    } catch {
      /* empty catalog / offline — continue */
    }

    for (const route of PAGES) {
      try {
        const r = await auditPage(page, route);
        deviceResult.pages.push(r);
        if (r.ok) report.summary.pass++;
        else report.summary.fail++;
        for (const issue of r.issues) {
          if (issue.sev === "P0") report.summary.p0++;
          if (issue.sev === "P1") report.summary.p1++;
          if (issue.sev === "P2") report.summary.p2++;
        }
      } catch (e) {
        deviceResult.pages.push({
          path: route.path,
          ok: false,
          issues: [{ sev: "P0", msg: String(e.message || e) }],
          error: true,
        });
        report.summary.fail++;
        report.summary.p0++;
      }
    }

    report.devices.push(deviceResult);
    await context.close();
  }

  report.finishedAt = new Date().toISOString();
  const out = path.join(__dirname, "mobile-qa-report.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ summary: report.summary, out }, null, 2));

  // Print compact failures
  for (const d of report.devices) {
    for (const p of d.pages) {
      if (!p.ok || (p.issues && p.issues.length)) {
        const msgs = (p.issues || []).map((i) => `${i.sev}:${i.msg}`).join(" | ");
        if (msgs) console.log(`[${d.name}] ${p.path} → ${msgs}`);
      }
    }
  }

  await browser.close();
  process.exit(report.summary.p0 > 0 ? 2 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
