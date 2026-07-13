import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LandingClient } from './_components/landing-client';
import { DashboardClient } from './_components/dashboard-client';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    return <DashboardClient />;
  }
  
  return <LandingClient />;
}
