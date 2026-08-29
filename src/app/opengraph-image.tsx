import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Coin229 — Les détails qui changent tout.";
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
          background: "#0F2D26",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 26, color: "#D4AF37", letterSpacing: 6 }}>
          LES DÉTAILS QUI CHANGENT TOUT
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Coin<span style={{ color: "#D4AF37" }}>229</span>
        </div>
        <div
          style={{ marginTop: 28, fontSize: 30, color: "#F6F3EC", maxWidth: 820 }}
        >
          Montres, bijoux, sacs & lunettes — livrés à Cotonou, Porto-Novo et
          Godomey.
        </div>
      </div>
    ),
    { ...size }
  );
}
