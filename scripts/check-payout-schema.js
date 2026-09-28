const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name IN ('commission_pct','vendor_net','payout_id','refund_status')
    ORDER BY column_name
  `);
  console.log("order cols", cols);

  const vcols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'vendors'
    AND column_name IN ('ifu','rccm','mobile_money','terms_accepted_at','reset_token_hash')
    ORDER BY column_name
  `);
  console.log("vendor cols", vcols);

  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('vendor_payouts','rate_limit_buckets')
  `);
  console.log("tables", tables);

  const migs = await prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at IS NOT NULL as done
    FROM _prisma_migrations
    ORDER BY started_at DESC
    LIMIT 12
  `);
  console.log("migs", migs);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
