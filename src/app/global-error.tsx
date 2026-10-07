"use client";

import { useEffect } from "react";

/**
 * Dernier recours : erreur dans le layout racine lui-même.
 * Remplace tout le document — styles en ligne, aucune dépendance.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr-BJ">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#ffffff",
          color: "#0f2d26",
          padding: 16,
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: "#d4af37" }}>
            Coin229
          </p>
          <h1 style={{ fontSize: 24, margin: "8px 0" }}>Le site rencontre un problème</h1>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            Réessaie dans un instant. Si le problème continue, contacte-nous sur
            WhatsApp.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "#0f2d26",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Réessayer
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- layout cassé : navigation complète voulue */}
            <a
              href="/"
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #0f2d26",
                color: "#0f2d26",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Accueil
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
              Référence : {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
