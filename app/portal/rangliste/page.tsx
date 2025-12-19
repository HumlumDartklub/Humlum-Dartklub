import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function RanglistePage() {
  return (
    <GroupFeedPage
      title="Rangliste"
      icon="📈"
      subtitle="Formkurve, pointræs og den sunde interne konkurrence."
      groupPrefixes={["Portal – Rangliste", "Portal - Rangliste", "Rangliste"]}
      emptyHint="Ranglisten er på vej." 
    />
  );
}
