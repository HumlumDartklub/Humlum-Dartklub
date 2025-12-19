import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function BadgesPage() {
  return (
    <GroupFeedPage
      title="Badges"
      icon="🏅"
      subtitle="Små achievements, stor ære."
      groupPrefixes={["Portal – Badges", "Portal - Badges", "Badges"]}
      emptyHint="Badges er på vej." 
    />
  );
}
