/**
 * Adresse de retour après connexion (`?next=`) : uniquement un chemin du site.
 * Refuse « //domaine », « /\domaine » et toute URL absolue (redirection ouverte).
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/compte",
  /** Espace obligatoire, ex. "/admin" : tout autre chemin renvoie au fallback */
  prefix?: string
): string {
  if (!raw) return fallback;
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.includes("://") || /[\r\n]/.test(next)) return fallback;
  if (prefix) {
    // "/admin", "/admin/…", "/admin?…" — pas "/adminx" ni un autre espace
    const inside = next === prefix || (next.startsWith(prefix) && /^[/?#]/.test(next.slice(prefix.length)));
    if (!inside) return fallback;
  }
  return next;
}
