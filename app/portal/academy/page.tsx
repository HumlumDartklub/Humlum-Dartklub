import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function AcademyPage() {
  return (
    <GroupFeedPage
      title="My Academy"
      icon="🚀"
      subtitle="Din træningsrejse – fra ny til kampklar."
      groupPrefixes={[
        "Portal – Academy",
        "Portal - Academy",
        "Academy",
        "Nybegynder",
        "Øvet",
        "Turnering",
      ]}
      emptyHint="Academy-indhold er ikke sat op endnu."
    />
  );
}
