import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Coin229 — Accessoires mode au Bénin";
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
        <div style={{ fontSize: 28, color: "#2b9bff", letterSpacing: 6 }}>
          BÉNIN · ACCESSOIRES
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Coin<span style={{ color: "#2b9bff" }}>229</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "#d8e0ec", maxWidth: 800 }}>
          Montres, bijoux, sacs & lunettes — livrés à Cotonou, Porto-Novo et
          Godomey.
        </div>
      </div>
    ),
    { ...size }
  );
}
