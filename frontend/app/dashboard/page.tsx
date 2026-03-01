'use client';

import { useRequireAuth } from '@/lib/useRequireAuth';
import SocietyDashboard from './SocietyDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardWrapper() {
  const { user } = useRequireAuth();

  if (!user) return null;

  const isSociety = Boolean(user.user_metadata?.society);

  if (isSociety) {
    return <SocietyDashboard />;
  }

  return <StudentDashboard />;
}
