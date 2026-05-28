import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phone: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    about: v.optional(v.string()),
    isBanned: v.boolean(),
    isMuted: v.optional(v.boolean()),
    lastSeen: v.number(),
  }).index("by_phone", ["phone"]),

  files: defineTable({
    stage: v.string(),
    subject: v.optional(v.string()), // may be missing in old records
    course:  v.optional(v.string()), // legacy field from old records
    name: v.string(),
    fileUrl: v.string(),
    mimetype: v.string(),
    size: v.optional(v.number()),
  }).index("by_stage_subject", ["stage", "subject"]),

  admins: defineTable({
    phone: v.string(),
    role: v.optional(v.string()), 
  }).index("by_phone", ["phone"]),

  messages: defineTable({
    userPhone: v.string(),
    text: v.string(),
    timestamp: v.number(),
    fromMe: v.boolean(), 
  }).index("by_userPhone", ["userPhone"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  broadcasts: defineTable({
    message: v.string(),
    status: v.string(),       // 'pending' | 'sent' | 'failed'
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
    sentCount: v.optional(v.number()),
  }).index("by_status", ["status"]),
});
