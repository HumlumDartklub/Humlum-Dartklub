import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function NotifikationerPage() {
  return (
    <GroupFeedPage
      title="Notifikationer"
      icon="🔔"
      subtitle="Små vigtige ting (betaling, ændringer, deadlines osv.)."
      groupPrefixes={["Portal – Notifikationer", "Portal - Notifikationer"]}
      emptyHint="Ingen notifikationer endnu."
    />
  );
}
