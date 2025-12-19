"use client";

import GroupFeedPage from "../components/GroupFeedPage";

export default function DartAbcPage() {
  return (
    <GroupFeedPage
      icon="📘"
      title="Dart ABC"
      subtitle="Kort, praktisk og lige til – for nybegyndere (og alle der vil finpudse basics)."
      groupPrefixes={[
        "Nybegynder",
        "Dart ABC",
        "Academy – Nybegynder",
        "Academy - Nybegynder",
      ]}
      emptyHint="Dart ABC er på vej."
      allowSearch={true}
    />
  );
}
