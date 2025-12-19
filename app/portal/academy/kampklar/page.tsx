import GroupFeedPage from "../../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function KampklarPage() {
  return (
    <GroupFeedPage
      title="Kampklar-test"
      icon="🧠"
      subtitle="Test dig selv – og bliv klar til kamp (og klubmesterskab)"
      groupPrefixes={[
        "Academy – Kampklar",
        "Academy - Kampklar",
        "Portal – Kampklar",
        "Portal - Kampklar",
      ]}
      emptyHint="Kampklar-test indhold er ikke lagt ind endnu."
      allowSearch={false}
    />
  );
}
