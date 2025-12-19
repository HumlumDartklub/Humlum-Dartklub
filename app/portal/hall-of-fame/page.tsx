import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function HallOfFamePage() {
  return (
    <GroupFeedPage
      title="Hall of Fame"
      icon="🏛️"
      subtitle="Legender, milepæle og historien vi skriver sammen."
      groupPrefixes={["Portal – Hall of Fame", "Portal - Hall of Fame", "Hall of Fame"]}
      emptyHint="Hall of Fame er på vej." 
    />
  );
}
