'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface Props {
  currentUsername: string | null;
  playerId: Id<"players"> | null;
  onClose: () => void;
  onPlay: () => void;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function Medal({ rank }: { rank: number }) {
  if (rank === 0) return <span className="text-[18px]">🥇</span>;
  if (rank === 1) return <span className="text-[18px]">🥈</span>;
  if (rank === 2) return <span className="text-[18px]">🥉</span>;
  return <span className="text-[13px] font-bold" style={{ color: '#8fa396' }}>{rank + 1}</span>;
}

export default function Leaderboard({ currentUsername, playerId, onClose, onPlay }: Props) {
  const leaderboard = useQuery(api.games.getLeaderboard);
  const myHistory = useQuery(api.games.getPlayerHistory, playerId ? { playerId } : "skip");

  return (
    <div className="lg-background min-h-[100dvh] flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onClose} className="text-[15px] font-semibold" style={{ color: '#026937' }}>
          ← Volver
        </button>
        <h1 className="text-[20px] font-bold" style={{ color: '#1a2e22' }}>Ranking</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Global leaderboard */}
        <div className="lg-panel p-4 mb-4 lg-slide-up">
          <p className="text-[12px] font-semibold tracking-wide mb-3" style={{ color: '#8fa396' }}>
            TOP GLOBAL
          </p>

          {!leaderboard ? (
            <div className="py-6 text-center">
              <p className="text-[14px]" style={{ color: '#b0c4b8' }}>Cargando...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[14px]" style={{ color: '#b0c4b8' }}>Aun no hay partidas. Se el primero!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {leaderboard.map((entry, i) => {
                const isMe = entry.username === currentUsername;
                return (
                  <div
                    key={entry._id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isMe ? 'rgba(2,105,55,0.08)' : 'transparent',
                      border: isMe ? '1px solid rgba(2,105,55,0.15)' : '1px solid transparent',
                    }}
                  >
                    <div className="w-8 flex items-center justify-center">
                      <Medal rank={i} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate" style={{ color: isMe ? '#026937' : '#1a2e22' }}>
                        {entry.username}
                        {isMe && <span className="text-[11px] ml-1" style={{ color: '#43b649' }}>(tu)</span>}
                      </p>
                      <p className="text-[12px]" style={{ color: '#8fa396' }}>
                        {entry.mistakes} error{entry.mistakes !== 1 ? 'es' : ''} · {formatTime(entry.timeMs)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[17px] font-bold" style={{ color: '#026937' }}>{entry.score}</p>
                      <p className="text-[11px]" style={{ color: '#8fa396' }}>pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My history */}
        {myHistory && myHistory.length > 0 && (
          <div className="lg-panel p-4 mb-4 lg-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-[12px] font-semibold tracking-wide mb-3" style={{ color: '#8fa396' }}>
              TUS PARTIDAS
            </p>
            <div className="space-y-1">
              {myHistory.map((g) => (
                <div key={g._id} className="flex items-center gap-3 px-3 py-2 rounded-xl">
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold" style={{ color: '#1a2e22' }}>
                      {g.score} pts
                    </p>
                    <p className="text-[12px]" style={{ color: '#8fa396' }}>
                      {g.mistakes} error{g.mistakes !== 1 ? 'es' : ''} · {formatTime(g.timeMs)}
                    </p>
                  </div>
                  <p className="text-[11px]" style={{ color: '#b0c4b8' }}>
                    {new Date(g.completedAt).toLocaleDateString('es')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Play button */}
        <button onClick={onPlay} className="lg-btn lg-btn-primary w-full text-[17px] mt-2">
          Jugar
        </button>
      </div>
    </div>
  );
}
