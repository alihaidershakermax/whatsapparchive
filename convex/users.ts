import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
  },
});

export const saveUser = mutation({
  args: { 
    phone: v.string(), 
    name: v.optional(v.string()), 
    avatarUrl: v.optional(v.string()),
    about: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        name: args.name ?? existing.name,
        avatarUrl: args.avatarUrl ?? existing.avatarUrl,
        about: args.about ?? existing.about,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("users", {
        phone: args.phone,
        name: args.name,
        avatarUrl: args.avatarUrl,
        about: args.about,
        isBanned: false,
        isMuted: false,
        lastSeen: Date.now(),
      });
    }
  },
});

export const toggleMute = mutation({
  args: { id: v.id("users"), isMuted: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isMuted: args.isMuted });
  },
});

export const toggleBan = mutation({
  args: { id: v.id("users"), isBanned: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isBanned: args.isBanned });
  },
});
