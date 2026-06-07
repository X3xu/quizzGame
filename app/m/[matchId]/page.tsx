import MultiplayerRoom from '@/components/multiplayer/MultiplayerRoom';

// A match link: /m/<matchId>. Renders the realtime 1v1 room for both players.
export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <MultiplayerRoom matchId={matchId} />;
}
