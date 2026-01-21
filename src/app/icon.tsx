import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030304",
          borderRadius: "50%",
        }}
      >
        {/* Stylized "A" with afterglow effect */}
        <svg viewBox="0 0 32 32" width="32" height="32">
          <defs>
            <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.5" />
            </linearGradient>
          </defs>
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
    ),
    {
      ...size,
    }
  );
}
