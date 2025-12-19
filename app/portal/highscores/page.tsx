import GroupFeedPage from "../components/GroupFeedPage";

export const dynamic = "force-dynamic";

export default function HighscoresPage() {
  return (
    <GroupFeedPage
      title="Highscores"
      icon="🎯"
      subtitle="180'ere, checkout-monstre og de der kast vi aldrig glemmer."
      groupPrefixes={["Portal – Highscores", "Portal - Highscores", "Highscores"]}
      emptyHint="Highscores er på vej." 
    />
  );
}
