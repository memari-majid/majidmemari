import { ImageResponse } from "next/og";

export const alt = "AI in Business Analytics, a field reference by Majid Memari";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AnalyticsReferenceImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", background: "#f7f6f2", color: "#203955", padding: "78px 88px", borderTop: "12px solid #086b73" }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "#086b73", marginBottom: 34 }}>Majid Memari · Teaching</div>
        <div style={{ display: "flex", maxWidth: 910, fontSize: 91, lineHeight: 1.02, fontWeight: 700, letterSpacing: -4 }}>AI in Business Analytics</div>
        <div style={{ display: "flex", maxWidth: 830, fontSize: 33, lineHeight: 1.3, color: "#536176", marginTop: 35 }}>A field reference for AI scientists and business-school instructors.</div>
      </div>
    ),
    size,
  );
}
