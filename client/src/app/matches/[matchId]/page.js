import MatchDetailContent from './MatchDetailContent.jsx';

export async function generateMetadata({ params }) {
  return {
    title: `Match - PointMaster`,
  };
}

export default async function MatchDetailPage({ params }) {
  const { matchId } = await params;
  return <MatchDetailContent matchId={matchId} />;
}
