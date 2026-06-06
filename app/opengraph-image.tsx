import { ImageResponse } from "next/og";

// Inline SVG cube mark as base64 data URI — ImageResponse doesn't support raw SVG children,
// but <img src="data:image/svg+xml;base64,..."> renders correctly.
const CUBE_SVG_B64 =
  "PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzE2MTQwRiIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE0LDEyKSI+PHBvbHlnb24gcG9pbnRzPSIxOCwyIDM2LDEyIDE4LDIyIDAsMTIiIGZpbGw9IiNFREU2RDYiLz48cG9seWdvbiBwb2ludHM9IjAsMTIgMTgsMjIgMTgsNDIgMCwzMiIgZmlsbD0iIzNFNkI1NyIvPjxwb2x5Z29uIHBvaW50cz0iMzYsMTIgMTgsMjIgMTgsNDIgMzYsMzIiIGZpbGw9IiM5RkI3QTYiLz48L2c+PC9zdmc+";

export const alt = "Augmenta furniture AR product pages";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f8f4",
          color: "#17201a",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          width: "100%"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            width: "100%"
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 18
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/svg+xml;base64,${CUBE_SVG_B64}`}
              width={72}
              height={72}
              alt=""
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#16140F", fontSize: 28, fontWeight: 600 }}>
                augmenta<span style={{ color: "#3E6B57" }}>3D</span>
              </span>
              <span style={{ color: "#697266", fontSize: 22 }}>Furniture AR Commerce</span>
            </div>
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: 0, lineHeight: 1.02, maxWidth: 900 }}>
            If they can see it in their room, they&apos;re more likely to buy it.
          </div>
          <div style={{ color: "#697266", fontSize: 30, lineHeight: 1.35, maxWidth: 880 }}>
            Turn 4 furniture photos into verified 3D/AR product pages.
          </div>
        </div>
      </div>
    ),
    size
  );
}
