import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleTouchIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
          borderRadius: "40px",
        }}
      >
        <svg viewBox="0 0 32 32" width="100" height="100">
          <path
            d="M16 6 L10 26 M16 6 L22 26 M12 18 L20 18"
            stroke="#a78bfa"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="16" cy="10" r="2.5" fill="#e9d5ff" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
