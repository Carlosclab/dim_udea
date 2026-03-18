import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Login or register — returns player ID
export const loginOrCreate = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 2 || trimmed.length > 20) {
      throw new Error("El nombre debe tener entre 2 y 20 caracteres");
    }

    // Check if player exists
    const existing = await ctx.db
      .query("players")
      .withIndex("by_username", (q) => q.eq("username", trimmed))
      .first();

    if (existing) return existing._id;

    // Create new player
    return await ctx.db.insert("players", {
      username: trimmed,
      createdAt: Date.now(),
    });
  },
});

// Get player by ID
export const getPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    return await ctx.db.get(playerId);
  },
});
