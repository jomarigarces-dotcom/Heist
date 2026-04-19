import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get all exceptions, optionally filtered by account and/or status ─────────
export const listExceptions = query({
  args: {
    account: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { account, status }) => {
    let q = ctx.db.query("exceptions");

    // Filter by account if provided
    if (account && account !== "ALL") {
      const rows = await q
        .withIndex("by_account", (idx) => idx.eq("account", account))
        .collect();
      if (status && status !== "ALL") {
        return rows.filter((r) => r.status === status);
      }
      return rows;
    }

    const rows = await q.collect();
    if (status && status !== "ALL") {
      return rows.filter((r) => r.status === status);
    }
    return rows;
  },
});

// ─── Get unique accounts from exceptions table (for filter dropdown) ──────────
export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("exceptions").collect();
    const accounts = [...new Set(rows.map((r) => r.account).filter(Boolean))];
    return accounts as string[];
  },
});

// ─── Get raw time logs ────────────────────────────────────────────────────────
export const listTimeLogs = query({
  args: {
    account: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { account, date }) => {
    let rows = await ctx.db.query("timeLogs").collect();
    if (account && account !== "ALL") {
      rows = rows.filter((r) => r.account === account);
    }
    if (date) {
      rows = rows.filter((r) => r.date === date);
    }
    return rows;
  },
});

// ─── Get raw break logs ───────────────────────────────────────────────────────
export const listBreakLogs = query({
  args: {
    account: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { account, date }) => {
    let rows = await ctx.db.query("breakLogs").collect();
    if (account && account !== "ALL") {
      rows = rows.filter((r) => r.account === account);
    }
    if (date) {
      rows = rows.filter((r) => r.date === date);
    }
    return rows;
  },
});

// ─── Get raw leaves ───────────────────────────────────────────────────────────
export const listLeaves = query({
  args: {
    account: v.optional(v.string()),
  },
  handler: async (ctx, { account }) => {
    let rows = await ctx.db.query("leaves").collect();
    if (account && account !== "ALL") {
      rows = rows.filter((r) => r.account === account);
    }
    return rows;
  },
});

// ─── Stats for dashboard summary cards ───────────────────────────────────────
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const exceptions = await ctx.db.query("exceptions").collect();
    const timeLogs = await ctx.db.query("timeLogs").collect();
    const breakLogs = await ctx.db.query("breakLogs").collect();

    const open = exceptions.filter((e) => e.status === "OPEN").length;
    const high = exceptions.filter(
      (e) => e.severity === "HIGH" && e.status === "OPEN"
    ).length;
    const medium = exceptions.filter(
      (e) => e.severity === "MEDIUM" && e.status === "OPEN"
    ).length;
    const resolved = exceptions.filter((e) => e.status === "RESOLVED").length;

    return {
      totalExceptions: open,
      highSeverity: high,
      mediumSeverity: medium,
      resolved,
      totalTimeLogs: timeLogs.length,
      totalBreakLogs: breakLogs.length,
    };
  },
});

// ─── Public mutation: resolve or acknowledge an exception ─────────────────────
export const resolveException = mutation({
  args: {
    exceptionId: v.id("exceptions"),
    action: v.union(v.literal("RESOLVED"), v.literal("ACKNOWLEDGED")),
    resolvedBy: v.optional(v.string()),
  },
  handler: async (ctx, { exceptionId, action, resolvedBy }) => {
    await ctx.db.patch(exceptionId, {
      status: action,
      resolvedBy: resolvedBy ?? "QC Team",
      resolvedAt: Date.now(),
    });
  },
});
