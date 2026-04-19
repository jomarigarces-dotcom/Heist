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
  args: {
    account: v.optional(v.string()),
  },
  handler: async (ctx, { account }) => {
    let exceptions = await ctx.db.query("exceptions").collect();
    const timeLogs = await ctx.db.query("timeLogs").collect();
    const breakLogs = await ctx.db.query("breakLogs").collect();

    // Filter by account if specified
    if (account && account !== "ALL") {
      exceptions = exceptions.filter((e) => e.account === account);
    }

    const open = exceptions.filter((e) => e.status === "OPEN");

    // Helper to count open exceptions by ruleCode prefix
    const countRule = (...codes: string[]) =>
      open.filter((e) => codes.some((c) => e.ruleCode.startsWith(c))).length;

    return {
      // Summary
      totalOpen: open.length,
      resolved: exceptions.filter((e) => e.status === "RESOLVED").length,
      totalTimeLogs: timeLogs.length,
      totalBreakLogs: breakLogs.length,

      // Attendance Row
      lateCount: countRule("STEP_3_2", "STEP_3_3"),
      undertimeCount: countRule("STEP_3_4"),
      missingLogout: countRule("STEP_3_1_MISSING_LOGOUT"),
      scheduleNot40: countRule("STEP_3_9"),
      missingStatus: countRule("STEP_3_1_MISSING_STATUS"),
      missingAccount: countRule("STEP_3_1_MISSING_ACCOUNT"),
      errorCount: countRule("STEP_3_1_ERROR_COUNT"),

      // Breaks Row
      overbreakCount: countRule("STEP_4_3"),
      openBreaks: countRule("STEP_4_1"),
      clinicOvertime: countRule("STEP_4_2"),
      clinicLunchOverlap: countRule("STEP_4_5"),

      // Inquiries Row
      pendingOT: countRule("STEP_2_1_PENDING_OT"),
      pendingLeave: countRule("STEP_2_1_PENDING_LEAVE"),
      halfDayLeave: countRule("STEP_3_5"),
      leaveButPresent: countRule("STEP_3_6"),
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

// ─── Get Sync Status ─────────────────────────────────────────────────────────
export const getSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("syncStatus").first();
  },
});
