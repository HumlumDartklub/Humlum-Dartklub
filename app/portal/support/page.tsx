import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  return (
    <GroupFeedPage
      title="Kontakt"
      icon="✉️"
      subtitle="Kontakt klubben – eller find den rigtige person."
      groupPrefixes={["Portal – Kontakt", "Portal - Kontakt", "Portal – Support", "Portal - Support"]}
      emptyHint="Her kommer kontaktinfo, åbningstider, og hvem der kan hjælpe med hvad."
      allowSearch={false}
    />
  );
}
