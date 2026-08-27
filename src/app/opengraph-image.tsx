import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Coin229 — Accessoires. Style. Confiance.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "#020b26",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#c9a227", letterSpacing: 6 }}>
          ACCESSOIRES · STYLE · CONFIANCE
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Coin<span style={{ color: "#c9a227" }}>229</span>
        </div>
        <div
          style={{ marginTop: 28, fontSize: 32, color: "#e2ddd3", maxWidth: 800 }}
        >
          Montres, bijoux, sacs & lunettes — livrés à Cotonou, Porto-Novo et
          Godomey.
        </div>
      </div>
    ),
    { ...size }
  );
}
