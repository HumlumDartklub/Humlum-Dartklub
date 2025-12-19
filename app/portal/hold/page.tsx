import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function HoldPage() {
  return (
    <GroupFeedPage
      title="Hold"
      icon="👥"
      subtitle="Holdoversigt, roller og små hold-nyheder."
      groupPrefixes={["Portal – Hold", "Portal - Hold", "Hold"]}
      emptyHint="Her kommer holdoversigten (og senere smart team-management)."
    />
  );
}
