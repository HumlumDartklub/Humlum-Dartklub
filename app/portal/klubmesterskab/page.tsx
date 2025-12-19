import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function KlubmesterskabPage() {
  return (
    <GroupFeedPage
      title="Klubmesterskab"
      icon="🏆"
      subtitle="Stilling, regler, kampe og alt det vi kan drille hinanden med."
      groupPrefixes={[
        "Portal – Klubmesterskab",
        "Portal - Klubmesterskab",
        "Klubmesterskab",
        "KM",
      ]}
      emptyHint="Klubmesterskab er ikke sat op endnu."
    />
  );
}
