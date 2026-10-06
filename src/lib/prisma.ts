import { PrismaClient } from "@prisma/client";

/**
 * Champs secrets du vendeur exclus de TOUTES les lectures par défaut,
 * pour qu'aucun objet vendeur ne puisse les envoyer au navigateur par accident.
 * Les rares routes qui en ont besoin les demandent explicitement :
 * `omit: { passwordHash: false }`.
 */
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    omit: {
      vendor: {
        passwordHash: true,
        resetTokenHash: true,
        resetTokenExpires: true,
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
