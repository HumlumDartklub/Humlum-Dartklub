import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function LinksPage() {
  return (
    <GroupFeedPage
      title="Links"
      icon="🔗"
      subtitle="Nyttige links (DDU, DIF, PDC, regler, udstyr osv.)."
      groupPrefixes={["Portal – Links", "Portal - Links", "Links"]}
      emptyHint="Her samler vi alle de links, man ellers altid skal lede efter."
    />
  );
}
