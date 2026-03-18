import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save a completed game result
export const saveResult = mutation({
  args: {
    playerId: v.id("players"),
    username: v.string(),
    score: v.number(),
    mistakes: v.number(),
    timeMs: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gameResults", {
      playerId: args.playerId,
      username: args.username,
      score: args.score,
      mistakes: args.mistakes,
      timeMs: args.timeMs,
      completedAt: Date.now(),
    });
  },
});

// Global leaderboard — top 20 by score (desc), then by fewer mistakes, then faster time
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db
      .query("gameResults")
      .withIndex("by_score")
      .order("desc")
      .take(100);

    // Group by player: keep only each player's best score
    const bestByPlayer = new Map<string, typeof results[0]>();
    for (const r of results) {
      const existing = bestByPlayer.get(r.username);
      if (
        !existing ||
        r.score > existing.score ||
        (r.score === existing.score && r.mistakes < existing.mistakes) ||
        (r.score === existing.score && r.mistakes === existing.mistakes && r.timeMs < existing.timeMs)
      ) {
        bestByPlayer.set(r.username, r);
      }
    }

    return Array.from(bestByPlayer.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes;
        return a.timeMs - b.timeMs;
      })
      .slice(0, 20);
  },
});

// Player's personal history
export const getPlayerHistory = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    return await ctx.db
      .query("gameResults")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .order("desc")
      .take(10);
  },
});
