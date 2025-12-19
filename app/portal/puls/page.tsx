import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function PulsPage() {
  return (
    <GroupFeedPage
      title="Klub-puls"
      icon="⚡"
      subtitle="Interne nyheder, små updates og alt det der gør klubben levende."
      groupPrefixes={["Portal – Puls", "Portal - Puls"]}
      emptyHint="Her vises klubbens interne puls." 
    />
  );
}
