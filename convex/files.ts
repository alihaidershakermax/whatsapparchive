import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    // Normalize: old records used `course`, new ones use `subject`
    return files.map(f => ({
      ...f,
      subject: f.subject ?? f.course ?? "غير محدد",
    }));
  },
});

export const getByStageAndSubject = query({
  args: { stage: v.string(), subject: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_stage_subject", (q) =>
        q.eq("stage", args.stage).eq("subject", args.subject)
      )
      .collect();
  },
});

export const add = mutation({
  args: {
    stage: v.string(),
    subject: v.string(),
    name: v.string(),
    fileUrl: v.string(),
    mimetype: v.string(),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("files"),
    stage: v.string(),
    subject: v.string(),
    name: v.string(),
    fileUrl: v.optional(v.string()),
    mimetype: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    for (const f of files) {
      await ctx.db.delete(f._id);
    }
  },
});
