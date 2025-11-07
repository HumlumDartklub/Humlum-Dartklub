// app/admin/HeroPreview.tsx
"use client";

import { useEffect, useState } from "react";
import { HUMLUM_API } from "../config";

export default function HeroPreview() {
  const [title, setTitle] = useState("…");
  const [subtitle, setSubtitle] = useState("…");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${HUMLUM_API}?sheet=FORSIDE`, { cache: "no-store" });
        const rows = await res.json();

        // Find rækker med korrekt keys og status "ACTIVE"
        const titleRow = rows.find((r: any) =>
          r.section === "hero" &&
          r.key === "title" &&
          (r["status, valideret"] === "ACTIVE" || r.status === "ACTIVE")
        );

        const subRow = rows.find((r: any) =>
          r.section === "hero" &&
          r.key === "subtitle" &&
          (r["status, valideret"] === "ACTIVE" || r.status === "ACTIVE")
        );

        setTitle(titleRow?.value || "—");
        setSubtitle(subRow?.value || "");
      } catch (e) {
        console.error(e);
        setTitle("Fejl");
        setSubtitle("");
      }
    };

    load();
  }, []);

  return (
    <div
      style={{
        marginTop: 30,
        padding: 20,
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        background: "#101010",
        color: "white"
      }}
    >
      <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 10 }}>
        Live Hero Preview
      </div>
      <h2 style={{ fontSize: 28, marginBottom: 6 }}>{title}</h2>
      <div style={{ fontSize: 16, opacity: 0.8 }}>{subtitle}</div>
    </div>
  );
}
