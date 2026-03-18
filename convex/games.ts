import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveResult = mutation({
  args: {
    playerId: v.id("players"),
    username: v.string(),
    score: v.number(),
    mistakes: v.number(),
    timeMs: v.number(),
    level: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gameResults", {
      playerId: args.playerId,
      username: args.username,
      score: args.score,
      mistakes: args.mistakes,
      timeMs: args.timeMs,
      level: args.level,
      completedAt: Date.now(),
    });
  },
});

// Global leaderboard — top 20, best per player
export const getLeaderboard = query({
  args: { level: v.optional(v.string()) },
  handler: async (ctx, { level }) => {
    let results;
    if (level) {
      results = await ctx.db
        .query("gameResults")
        .withIndex("by_level", (q) => q.eq("level", level))
        .order("desc")
        .take(100);
    } else {
      results = await ctx.db
        .query("gameResults")
        .withIndex("by_score")
        .order("desc")
        .take(100);
    }

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
