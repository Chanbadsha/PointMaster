import { redirect } from 'next/navigation';
import DashboardContent from './DashboardContent.jsx';

export const metadata = {
  title: 'Dashboard - PointMaster',
};

export default async function DashboardPage() {
  return <DashboardContent />;
}
