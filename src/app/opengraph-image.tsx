import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Afterstill — Living Atlas of Literacy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
          position: "relative",
        }}
      >
        {/* Ambient glow effects */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "20%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "20%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo/Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <svg width="80" height="80" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#030304" />
            <path
              d="M16 8 L11 24 M16 8 L21 24 M13 18 L19 18"
              stroke="#a78bfa"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="16" cy="12" r="2" fill="#e9d5ff" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "300",
            color: "#f5f5f5",
            letterSpacing: "-2px",
            marginBottom: "16px",
            fontFamily: "serif",
          }}
        >
          Afterstill
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: "24px",
            color: "#a78bfa",
            letterSpacing: "4px",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          Living Atlas of Literacy
        </p>

        {/* Decorative line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)",
            }}
          />
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#c4b5fd",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              width: "60px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
