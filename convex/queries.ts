import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get all exceptions, optionally filtered (paginated) ─────────────────────
export const listExceptions = query({
  args: {
    account: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, { account, status, page }) => {
    let rows = await ctx.db.query("exceptions").collect();

    if (account && account !== "ALL") {
      rows = rows.filter((r) => r.account === account);
    }
    if (status && status !== "ALL") {
      rows = rows.filter((r) => r.status === status);
    }

    const PAGE_SIZE = 100;
    const currentPage = page ?? 1;
    const totalCount = rows.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      rows: rows.slice(start, start + PAGE_SIZE),
      totalCount,
      totalPages,
      currentPage,
    };
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

// ─── Get raw time logs (paginated) ────────────────────────────────────────────
export const listTimeLogs = query({
  args: {
    account: v.optional(v.string()),
    date: v.optional(v.string()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, { account, date, page }) => {
    let rows = await ctx.db.query("timeLogs").collect();
    if (account && account !== "ALL") {
      rows = rows.filter((r) => r.account === account);
    }
    if (date) {
      rows = rows.filter((r) => r.date === date);
    }
    const PAGE_SIZE = 100;
    const currentPage = page ?? 1;
    const totalCount = rows.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      rows: rows.slice(start, start + PAGE_SIZE),
      totalCount,
      totalPages,
      currentPage,
    };
  },
});

// ─── Get raw break logs (paginated) ───────────────────────────────────────────
export const listBreakLogs = query({
  args: {
    account: v.optional(v.string()),
    date: v.optional(v.string()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, { account, date, page }) => {
    let rows = await ctx.db.query("breakLogs").collect();
    if (account && account !== "ALL") {
      rows = rows.filter((r) => r.account === account);
    }
    if (date) {
      rows = rows.filter((r) => r.date === date);
    }
    const PAGE_SIZE = 100;
    const currentPage = page ?? 1;
    const totalCount = rows.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      rows: rows.slice(start, start + PAGE_SIZE),
      totalCount,
      totalPages,
      currentPage,
    };
  },
});

// ─── Get raw leaves (paginated) ───────────────────────────────────────────────
export const listLeaves = query({
  args: {
    account: v.optional(v.string()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, { account, page }) => {
    let rows = await ctx.db.query("leaves").collect();
    if (account && account !== "ALL") {
      rows = rows.filter((r) => r.account === account);
    }
    const PAGE_SIZE = 100;
    const currentPage = page ?? 1;
    const totalCount = rows.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      rows: rows.slice(start, start + PAGE_SIZE),
      totalCount,
      totalPages,
      currentPage,
    };
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
