import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function KalenderPage() {
  return (
    <GroupFeedPage
      title="Kalender"
      icon="📅"
      subtitle="Træning, events, turneringer – hold dig opdateret."
      groupPrefixes={[
        "Portal – Kalender",
        "Portal - Kalender",
        "Portal – Events",
        "Portal - Events",
      ]}
      emptyHint="Kalenderen er tom lige nu."
    />
  );
}
