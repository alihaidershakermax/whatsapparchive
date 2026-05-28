import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: { userPhone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_userPhone", (q) => q.eq("userPhone", args.userPhone))
      .order("desc")
      .take(50);
  },
});

export const listAllRecent = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("messages").order("desc").take(100).collect();
    }
})

export const send = mutation({
  args: {
    userPhone: v.string(),
    text: v.string(),
    fromMe: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
