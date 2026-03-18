'use client';

import dynamic from 'next/dynamic';

// Load entire app shell client-only — all children use Convex hooks
// which require ConvexProvider (not available during SSR/static build)
const AppShell = dynamic(() => import('@/components/AppShell'), {
  ssr: false,
  loading: () => (
    <div className="lg-background min-h-[100dvh] flex items-center justify-center">
      <p className="text-[15px]" style={{ color: '#8fa396' }}>Cargando...</p>
    </div>
  ),
});

export default function Home() {
  return <AppShell />;
}
