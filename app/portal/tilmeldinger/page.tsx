import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function TilmeldingerPage() {
  return (
    <GroupFeedPage
      title="Tilmeldinger"
      icon="✅"
      subtitle="Tilmeld dig til events, turneringer og aktiviteter."
      groupPrefixes={["Portal – Tilmeldinger", "Portal - Tilmeldinger", "Tilmeldinger"]}
      emptyHint="Her kommer tilmeldinger (v1: links / v2: rigtig signup-flow)."
    />
  );
}
