import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function MaanedensSpillerPage() {
  return (
    <GroupFeedPage
      title="Månedens spiller"
      icon="⭐"
      subtitle="Hvem har været varmest? (Og hvem siger selv de har?)"
      groupPrefixes={["Portal – Månedens spiller", "Portal - Månedens spiller", "Månedens spiller"]}
      emptyHint="Månedens spiller er på vej." 
    />
  );
}
