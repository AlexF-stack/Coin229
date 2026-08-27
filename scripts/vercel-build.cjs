#!/usr/bin/env node
/**
 * Build Vercel : generate + migrate (si DB) + next build
 */
const { execSync } = require("child_process");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("node scripts/generate-pwa-icons.cjs");
run("npx prisma generate");

const db = process.env.DATABASE_URL || "";
const realDb =
  db.startsWith("postgres") &&
  !db.includes("YOUR_") &&
  !db.includes("placeholder");

if (realDb) {
  try {
    run("npx prisma migrate deploy");
  } catch (e) {
    console.error("prisma migrate deploy a échoué — abort build");
    process.exit(1);
  }
} else {
  console.log("Skip prisma migrate deploy (DATABASE_URL absente / placeholder)");
}

run("npx next build");
