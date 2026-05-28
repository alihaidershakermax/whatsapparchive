import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
  },
});

export const isAdmin = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
    return !!admin;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("admins").collect();
  },
});

export const add = mutation({
  args: { phone: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
    if (existing) {
        await ctx.db.patch(existing._id, { role: args.role });
    } else {
        await ctx.db.insert("admins", { phone: args.phone, role: args.role });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("admins") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
