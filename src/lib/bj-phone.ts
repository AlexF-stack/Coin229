/**
 * Numéros béninois — source unique (client + serveur).
 *
 * Depuis le passage à 10 chiffres (nov. 2024), tous les numéros sont de la
 * forme 01 XX XX XX XX ; l'ancien numéro à 8 chiffres devient « 01 » + ancien.
 * Format canonique stocké : +229 suivi des 10 chiffres, ex. +2290197000000.
 */

export const BJ_PHONE_PLACEHOLDER = "01 97 00 00 00";
export const BJ_PHONE_ERROR =
  "Numéro invalide. Ex. 01 97 00 00 00 (10 chiffres)";

/** Retourne le numéro canonique +229XXXXXXXXXX, ou null si invalide */
export function normalizeBjPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00229")) digits = digits.slice(2);
  if (digits.startsWith("229") && (digits.length === 11 || digits.length === 13)) {
    digits = digits.slice(3);
  }
  // Ancien format 8 chiffres → migration officielle : préfixe 01
  if (digits.length === 8) digits = `01${digits}`;
  if (/^0\d{9}$/.test(digits)) return `+229${digits}`;
  return null;
}

/** Partie locale à 10 chiffres (sans +229), ex. 0197000000 */
export function bjLocalNumber(raw: string | null | undefined): string | null {
  const n = normalizeBjPhone(raw);
  return n ? n.slice(4) : null;
}

/** Affichage lisible : 01 97 00 00 00 */
export function formatBjPhone(raw: string | null | undefined): string {
  const local = bjLocalNumber(raw);
  if (!local) return raw ?? "";
  return local.replace(/(\d{2})(?=\d)/g, "$1 ");
}
