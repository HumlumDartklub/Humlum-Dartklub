import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function SaesonPage() {
  return (
    <GroupFeedPage
      title="Sæson"
      icon="🗂️"
      subtitle="Overblik: sæsonmål, formater, milepæle og status."
      groupPrefixes={["Portal – Sæson", "Portal - Sæson", "Sæson"]}
      emptyHint="Sæson-overblikket er på vej." 
    />
  );
}
