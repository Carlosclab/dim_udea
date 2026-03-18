'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

const STORAGE_KEY = 'timsort_player';

interface StoredPlayer {
  id: string;
  username: string;
}

export function usePlayerSession() {
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loginOrCreate = useMutation(api.players.loginOrCreate);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { id, username: name } = JSON.parse(stored) as StoredPlayer;
        setPlayerId(id as Id<"players">);
        setUsername(name);
      }
    } catch {
      // Ignore parse errors
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (name: string) => {
    const id = await loginOrCreate({ username: name });
    const trimmed = name.trim().toLowerCase();
    setPlayerId(id);
    setUsername(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, username: trimmed }));
    return id;
  }, [loginOrCreate]);

  const logout = useCallback(() => {
    setPlayerId(null);
    setUsername(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { playerId, username, loading, isLoggedIn: !!playerId, login, logout };
}
