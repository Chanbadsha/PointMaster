import RoomDetailContent from './RoomDetailContent.jsx';

export async function generateMetadata({ params }) {
  const { roomId } = await params;
  return {
    title: `Room - PointMaster`,
  };
}

export default async function RoomDetailPage({ params }) {
  const { roomId } = await params;
  return <RoomDetailContent roomId={roomId} />;
}
