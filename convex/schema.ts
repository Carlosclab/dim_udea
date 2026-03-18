import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    username: v.string(),
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  gameResults: defineTable({
    playerId: v.id("players"),
    username: v.string(),
    score: v.number(),
    mistakes: v.number(),
    timeMs: v.number(),
    level: v.optional(v.string()), // 'best' | 'average' | 'worst'
    completedAt: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_player", ["playerId"])
    .index("by_level", ["level", "score"]),
});
