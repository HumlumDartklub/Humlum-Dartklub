import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function MaterialerPage() {
  return (
    <GroupFeedPage
      title="Materialer"
      icon="📦"
      subtitle="Dokumenter, guides, links og goodies – samlet ét sted."
      groupPrefixes={[
        "Portal – Dokumenter",
        "Portal - Dokumenter",
        "Portal – Materialer",
        "Portal - Materialer",
        "Portal – Goodies",
        "Portal - Goodies",
        "Dart ABC",
      ]}
      emptyHint="Ingen materialer endnu."
    />
  );
}
