'use client';

import { useRequireAuth } from '@/lib/useRequireAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
