import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function NyhederPage() {
  return (
    <GroupFeedPage
      title="Interne nyheder"
      icon="🗞️"
      subtitle="Ting der er relevante for medlemmer – uden støj."
      groupPrefixes={[
        "Portal – Nyheder",
        "Portal - Nyheder",
        "Portal – Puls",
      ]}
      emptyHint="Ingen interne nyheder endnu."
    />
  );
}
