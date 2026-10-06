/**
 * Secrets de session par type de jeton — compatible Edge (aucun import Node).
 *
 * Chaque jeton (admin, vendeur, téléphone, confirmation de commande) :
 * - est signé avec SON secret ;
 * - inclut son type dans le message signé (séparation de domaine),
 *   donc un jeton d'un type ne peut jamais être validé comme un autre.
 *
 * En production : secret dédié obligatoire, ≥ 16 caractères, distinct des
 * autres secrets et de ADMIN_PASSWORD, jamais une valeur d'exemple.
 * Hors production : repli sur les autres secrets pour simplifier le dev local.
 */

export type SessionKind = "admin" | "vendor" | "phone" | "order";

const MIN_LENGTH = 16;

/** Valeurs publiées dans .env.example / docs — refusées en production */
const EXAMPLE_VALUES = new Set([
  "long-random-string-at-least-16-chars",
  "remplacer-par-secret-admin-unique",
  "remplacer-par-secret-vendeur-unique",
  "remplacer-par-secret-telephone-unique",
  "change-me-strong-password",
  "coin229admin",
]);

const ENV_BY_KIND: Record<SessionKind, string> = {
  admin: "ADMIN_SESSION_SECRET",
  vendor: "VENDOR_SESSION_SECRET",
  phone: "PHONE_SESSION_SECRET",
  order: "PHONE_SESSION_SECRET",
};

function readEnv(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function productionSecret(kind: SessionKind): string | null {
  const name = ENV_BY_KIND[kind];
  const value = readEnv(name);
  if (!value || value.length < MIN_LENGTH) return null;
  if (EXAMPLE_VALUES.has(value)) return null;
  if (value === readEnv("ADMIN_PASSWORD")) return null;
  // Un secret partagé entre deux types de session est refusé
  for (const other of new Set(Object.values(ENV_BY_KIND))) {
    if (other !== name && readEnv(other) === value) return null;
  }
  return value;
}

function developmentSecret(kind: SessionKind): string | null {
  const candidates = [
    readEnv(ENV_BY_KIND[kind]),
    readEnv("ADMIN_SESSION_SECRET"),
    readEnv("ADMIN_PASSWORD"),
  ];
  for (const c of candidates) {
    if (c && c.length >= 8) return c;
  }
  return null;
}

export function getSessionSecret(kind: SessionKind): string | null {
  return isProduction() ? productionSecret(kind) : developmentSecret(kind);
}

/** Message réellement signé : le type fait partie de la signature */
export function signingInput(kind: SessionKind, payload: string): string {
  return `coin229.${kind}.v2.${payload}`;
}

/** Vérifie le champ `typ` du payload décodé */
export function hasKind(json: unknown, kind: SessionKind): boolean {
  return (
    typeof json === "object" &&
    json !== null &&
    (json as { typ?: unknown }).typ === kind
  );
}
