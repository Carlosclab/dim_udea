'use client';

import { useState } from 'react';
import { usePlayerSession } from '@/lib/usePlayerSession';
import LoginScreen from '@/components/LoginScreen';
import Leaderboard from '@/components/Leaderboard';
import TimSortGame from '@/components/TimSortGame';

type View = 'login' | 'game' | 'leaderboard';

export default function Home() {
  const { playerId, username, loading, isLoggedIn, login, logout } = usePlayerSession();
  const [view, setView] = useState<View>('game');

  if (loading) {
    return (
      <div className="lg-background min-h-[100dvh] flex items-center justify-center">
        <p className="text-[15px]" style={{ color: '#8fa396' }}>Cargando...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={async (name) => {
          await login(name);
          setView('game');
        }}
      />
    );
  }

  if (view === 'leaderboard') {
    return (
      <Leaderboard
        currentUsername={username}
        playerId={playerId}
        onClose={() => setView('game')}
        onPlay={() => setView('game')}
      />
    );
  }

  return (
    <TimSortGame
      playerId={playerId!}
      username={username!}
      onShowLeaderboard={() => setView('leaderboard')}
      onLogout={logout}
    />
  );
}
