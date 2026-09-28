const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync(
    path.join(
      __dirname,
      "../prisma/migrations/20260923_marketplace_payouts_kyc/migration.sql"
    ),
    "utf8"
  );
  // Split on semicolons carefully — run as one script via executeRawUnsafe for DO blocks
  await prisma.$executeRawUnsafe(sql);
  console.log("SQL applied");

  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name IN ('commission_pct','vendor_net','payout_id')
  `;
  console.log("order cols", cols);

  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('vendor_payouts','rate_limit_buckets')
  `;
  console.log("tables", tables);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
