/**
 * Adresse de retour après connexion (`?next=`) : uniquement un chemin du site.
 * Refuse « //domaine », « /\domaine » et toute URL absolue (redirection ouverte).
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/compte"): string {
  if (!raw) return fallback;
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.includes("://") || /[\r\n]/.test(next)) return fallback;
  return next;
}
