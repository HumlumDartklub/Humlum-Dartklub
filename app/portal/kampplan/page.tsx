import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function KampplanPage() {
  return (
    <GroupFeedPage
      title="Kampplan"
      icon="📝"
      subtitle="Kampe, resultater og hvem der møder hvem."
      groupPrefixes={["Portal – Kampplan", "Portal - Kampplan", "Portal – Kampe", "Portal - Kampe"]}
      emptyHint="Her vises kampplan og resultater."
    />
  );
}
