import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Players — simple username-based (no auth, like Kaggle nicknames)
  players: defineTable({
    username: v.string(),
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  // Game results — one row per completed game
  gameResults: defineTable({
    playerId: v.id("players"),
    username: v.string(), // denormalized for fast leaderboard queries
    score: v.number(),
    mistakes: v.number(),
    timeMs: v.number(), // total game duration in ms
    completedAt: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_player", ["playerId"]),
});
