import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function HjaelpPage() {
  return (
    <GroupFeedPage
      title="Hjælp"
      icon="🛟"
      subtitle="FAQ, regler i klubben, og hvordan tingene fungerer."
      groupPrefixes={["Portal – Hjælp", "Portal - Hjælp", "Portal – FAQ", "Portal - FAQ", "Hjælp", "FAQ"]}
      emptyHint="Her samler vi svar på de klassiske spørgsmål (så du slipper for 200 beskeder på Messenger)."
    />
  );
}
