import { ImageResponse } from "next/og";

export const alt = "Veridian furniture AR product pages";
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
            <div
              style={{
                alignItems: "center",
                background: "#17201a",
                borderRadius: 16,
                color: "#ffffff",
                display: "flex",
                fontSize: 30,
                fontWeight: 800,
                height: 72,
                justifyContent: "center",
                width: 72
              }}
            >
              AR
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#1f6f5b", fontSize: 24, fontWeight: 800 }}>Veridian</span>
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
