import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("broadcasts", {
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("broadcasts")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const markSent = mutation({
  args: { id: v.id("broadcasts"), sentCount: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      sentCount: args.sentCount,
    });
  },
});

export const markFailed = mutation({
  args: { id: v.id("broadcasts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "failed", sentAt: Date.now() });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("broadcasts").order("desc").take(50);
  },
});
