import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─── Bulk Insert: Time Logs ───────────────────────────────────────────────────
export const bulkInsertTimeLogs = internalMutation({
  args: {
    batchId: v.string(),
    records: v.array(
      v.object({
        employeeId: v.string(),
        employeeName: v.string(),
        account: v.optional(v.string()),
        site: v.optional(v.string()),
        date: v.string(),
        loginTime: v.optional(v.string()),
        logoutTime: v.optional(v.string()),
        status: v.optional(v.string()),
        lateHours: v.optional(v.number()),
        undertimeHours: v.optional(v.number()),
        billableHours: v.optional(v.number()),
        errorCount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { batchId, records }) => {
    for (const r of records) {
      await ctx.db.insert("timeLogs", { 
        ...r, 
        batchId,
        lateHours: r.lateHours ?? 0,
        undertimeHours: r.undertimeHours ?? 0,
        billableHours: r.billableHours ?? 0,
        errorCount: r.errorCount ?? 0
      });
    }
  },
});

// ─── Bulk Insert: Break Logs ──────────────────────────────────────────────────
export const bulkInsertBreakLogs = internalMutation({
  args: {
    batchId: v.string(),
    records: v.array(
      v.object({
        employeeId: v.string(),
        employeeName: v.string(),
        account: v.optional(v.string()),
        date: v.string(),
        breakType: v.optional(v.string()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        durationHours: v.optional(v.number()),
        overBreakHours: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { batchId, records }) => {
    for (const r of records) {
      await ctx.db.insert("breakLogs", { 
        ...r, 
        batchId,
        durationHours: r.durationHours ?? 0,
        overBreakHours: r.overBreakHours ?? 0
      });
    }
  },
});

// ─── Bulk Insert: Leaves ──────────────────────────────────────────────────────
export const bulkInsertLeaves = internalMutation({
  args: {
    batchId: v.string(),
    records: v.array(
      v.object({
        employeeId: v.string(),
        employeeName: v.string(),
        account: v.optional(v.string()),
        leaveDate: v.string(),
        leaveType: v.optional(v.string()),
        status: v.optional(v.string()),
        dayType: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { batchId, records }) => {
    for (const r of records) {
      await ctx.db.insert("leaves", { ...r, batchId });
    }
  },
});

// ─── Bulk Insert: OT Requests ─────────────────────────────────────────────────
export const bulkInsertOTRequests = internalMutation({
  args: {
    batchId: v.string(),
    records: v.array(
      v.object({
        employeeId: v.string(),
        employeeName: v.string(),
        account: v.optional(v.string()),
        otDate: v.string(),
        requestedHours: v.optional(v.number()),
        status: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { batchId, records }) => {
    for (const r of records) {
      await ctx.db.insert("otRequests", { ...r, batchId });
    }
  },
});

// ─── Bulk Insert: Schedules ───────────────────────────────────────────────────
export const bulkInsertSchedules = internalMutation({
  args: {
    batchId: v.string(),
    records: v.array(
      v.object({
        employeeId: v.string(),
        employeeName: v.string(),
        account: v.optional(v.string()),
        weekStartDate: v.string(),
        weekEndDate: v.string(),
        scheduledHours: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { batchId, records }) => {
    for (const r of records) {
      await ctx.db.insert("schedules", { ...r, batchId });
    }
  },
});

// ─── SOP Analyzer Engine ──────────────────────────────────────────────────────
// Triggered after time logs are ingested. Reads timeLogs & breakLogs for the
// given batchId and writes any violations to the `exceptions` table.
export const runAnalyzer = internalMutation({
  args: { batchId: v.string() },
  handler: async (ctx, { batchId }) => {
    const timeLogs = await ctx.db
      .query("timeLogs")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect();

    const breakLogs = await ctx.db
      .query("breakLogs")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect();

    const leaves = await ctx.db
      .query("leaves")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect();

    const otRequests = await ctx.db
      .query("otRequests")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect();

    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_batch", (q) => q.eq("batchId", batchId))
      .collect();

    const flags: Array<{
      employeeId: string;
      employeeName: string;
      account?: string;
      date: string;
      ruleCode: string;
      severity: string;
      description: string;
      rawValue?: string;
    }> = [];

    // ── STEP 2.1: Pending OT Requests ──────────────────────────────────────
    for (const ot of otRequests) {
      if (ot.status === "Pending") {
        flags.push({
          employeeId: ot.employeeId,
          employeeName: ot.employeeName,
          account: ot.account,
          date: ot.otDate,
          ruleCode: "STEP_2_1_PENDING_OT",
          severity: "MEDIUM",
          description: `Pending OT Request exists and requires approval before billing.`,
          rawValue: ot.requestedHours ? `${ot.requestedHours}h requested` : undefined,
        });
      }
    }

    // ── STEP 2.1: Pending/Retraction Leaves ────────────────────────────────
    for (const lv of leaves) {
      const status = lv.status ?? "";
      if (status === "Pending" || status.toLowerCase().includes("retraction")) {
        flags.push({
          employeeId: lv.employeeId,
          employeeName: lv.employeeName,
          account: lv.account,
          date: lv.leaveDate,
          ruleCode: "STEP_2_1_PENDING_LEAVE",
          severity: "MEDIUM",
          description: `Leave status is "${status}" — must be resolved before billing.`,
          rawValue: `${lv.leaveType} / ${status}`,
        });
      }
    }

    // ── TIME LOG RULES ──────────────────────────────────────────────────────
    for (const log of timeLogs) {
      const base = {
        employeeId: log.employeeId,
        employeeName: log.employeeName,
        account: log.account,
        date: log.date,
      };

      // STEP 3.1: Error Count > 0
      if ((log.errorCount ?? 0) > 0) {
        flags.push({
          ...base,
          ruleCode: "STEP_3_1_ERROR_COUNT",
          severity: "HIGH",
          description: `Time log has ${log.errorCount} error(s) flagged in Zoho.`,
          rawValue: String(log.errorCount),
        });
      }

      // STEP 3.1: Missing Logout
      if (!log.logoutTime || log.logoutTime.trim() === "") {
        flags.push({
          ...base,
          ruleCode: "STEP_3_1_MISSING_LOGOUT",
          severity: "HIGH",
          description: `Employee has no logout time recorded.`,
        });
      }

      // STEP 3.1: Missing Status
      if (!log.status || log.status.trim() === "") {
        flags.push({
          ...base,
          ruleCode: "STEP_3_1_MISSING_STATUS",
          severity: "MEDIUM",
          description: `Time log status is empty — account tagging may be incorrect.`,
        });
      }

      // STEP 3.1: Missing Account
      if (!log.account || log.account.trim() === "") {
        flags.push({
          ...base,
          ruleCode: "STEP_3_1_MISSING_ACCOUNT",
          severity: "MEDIUM",
          description: `Account/Site field is empty.`,
        });
      }

      // STEP 3.2: Late >= 0.80 hours (notify payroll)
      if ((log.lateHours ?? 0) >= 0.8) {
        flags.push({
          ...base,
          ruleCode: "STEP_3_2_LATE_MINOR",
          severity: "LOW",
          description: `Late of ${log.lateHours}h — verify if within allowable threshold.`,
          rawValue: `${log.lateHours}h`,
        });
      }

      // STEP 3.3: Late >= 4 hours (half-day deduction territory)
      if ((log.lateHours ?? 0) >= 4) {
        flags.push({
          ...base,
          ruleCode: "STEP_3_3_LATE_CRITICAL",
          severity: "HIGH",
          description: `Late of ${log.lateHours}h is ≥ 4 hours — half-day deduction required.`,
          rawValue: `${log.lateHours}h`,
        });
      }

      // STEP 3.4: Undertime >= 4 hours
      if ((log.undertimeHours ?? 0) >= 4) {
        flags.push({
          ...base,
          ruleCode: "STEP_3_4_UNDERTIME_CRITICAL",
          severity: "HIGH",
          description: `Undertime of ${log.undertimeHours}h is ≥ 4 hours — half-day deduction applies.`,
          rawValue: `${log.undertimeHours}h`,
        });
      }

      // STEP 3.5: Half-day leave — check lunch deduction
      const halfDayLeave = leaves.find(
        (l) =>
          l.employeeId === log.employeeId &&
          l.leaveDate === log.date &&
          (l.dayType ?? "").toLowerCase().includes("half")
      );
      if (halfDayLeave) {
        flags.push({
          ...base,
          ruleCode: "STEP_3_5_HALF_DAY_LEAVE",
          severity: "LOW",
          description: `Half-day leave found — verify lunch deduction is correctly applied.`,
          rawValue: `${halfDayLeave.leaveType} / ${halfDayLeave.dayType}`,
        });
      }

      // STEP 3.6: Full-day VL/SL but employee still logged in
      const fullDayLeave = leaves.find(
        (l) =>
          l.employeeId === log.employeeId &&
          l.leaveDate === log.date &&
          (l.leaveType === "VL" || l.leaveType === "SL") &&
          (l.dayType ?? "").toLowerCase().includes("full") &&
          l.status === "Approved"
      );
      if (fullDayLeave && log.loginTime && log.loginTime.trim() !== "") {
        flags.push({
          ...base,
          ruleCode: "STEP_3_6_LEAVE_BUT_PRESENT",
          severity: "HIGH",
          description: `Full-day ${fullDayLeave.leaveType} is approved but employee has a login time — verify and correct.`,
          rawValue: `Login: ${log.loginTime}`,
        });
      }
    }

    // ── STEP 3.9: Weekly Schedule ≠ 40 hours ───────────────────────────────
    for (const sched of schedules) {
      if (sched.scheduledHours !== undefined && sched.scheduledHours !== 40) {
        flags.push({
          employeeId: sched.employeeId,
          employeeName: sched.employeeName,
          account: sched.account,
          date: sched.weekStartDate,
          ruleCode: "STEP_3_9_SCHEDULE_NOT_40H",
          severity: "MEDIUM",
          description: `Weekly scheduled hours = ${sched.scheduledHours}h (expected 40h). Week: ${sched.weekStartDate} → ${sched.weekEndDate}`,
          rawValue: `${sched.scheduledHours}h`,
        });
      }
    }

    // ── BREAK LOG RULES ─────────────────────────────────────────────────────
    for (const brk of breakLogs) {
      const base = {
        employeeId: brk.employeeId,
        employeeName: brk.employeeName,
        account: brk.account,
        date: brk.date,
      };

      // STEP 4.1: Missing end time on break
      if (!brk.endTime || brk.endTime.trim() === "") {
        flags.push({
          ...base,
          ruleCode: "STEP_4_1_BREAK_NO_END",
          severity: "HIGH",
          description: `Break record (${brk.breakType}) has no end time — possible open break.`,
          rawValue: brk.breakType,
        });
      }

      // STEP 4.2: Clinic time > 2 hours
      if (
        (brk.breakType ?? "").toLowerCase().includes("clinic") &&
        (brk.durationHours ?? 0) > 2
      ) {
        flags.push({
          ...base,
          ruleCode: "STEP_4_2_CLINIC_OVERTIME",
          severity: "MEDIUM",
          description: `Clinic break exceeds 2 hours (${brk.durationHours}h). Excess time is deductible.`,
          rawValue: `${brk.durationHours}h`,
        });
      }

      // STEP 4.3: Overbreak >= 0.8 hours
      if ((brk.overBreakHours ?? 0) >= 0.8) {
        flags.push({
          ...base,
          ruleCode: "STEP_4_3_OVERBREAK",
          severity: "MEDIUM",
          description: `Overbreak of ${brk.overBreakHours}h — must be deducted from billable hours.`,
          rawValue: `${brk.overBreakHours}h`,
        });
      }
    }

    // ── STEP 4.5: Clinic overlaps Lunch ────────────────────────────────────
    // Group by employee+date to check overlap
    const grouped: Record<string, typeof breakLogs> = {};
    for (const brk of breakLogs) {
      const key = `${brk.employeeId}|${brk.date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(brk);
    }
    for (const entries of Object.values(grouped)) {
      const clinic = entries.find((b) =>
        (b.breakType ?? "").toLowerCase().includes("clinic")
      );
      const lunch = entries.find((b) =>
        (b.breakType ?? "").toLowerCase().includes("lunch")
      );
      if (clinic && lunch && clinic.startTime && lunch.startTime) {
        const parseHHMM = (t?: string): number => {
          if (!t || !t.includes(":")) return 0;
          const [h, m] = t.split(":").map(Number);
          return (h || 0) * 60 + (m || 0);
        };
        const cStart = parseHHMM(clinic.startTime);
        const cEnd = clinic.endTime ? parseHHMM(clinic.endTime) : cStart + 60;
        const lStart = parseHHMM(lunch.startTime);
        const lEnd = lunch.endTime ? parseHHMM(lunch.endTime) : lStart + 60;
        // Overlap check
        if (cStart < lEnd && cEnd > lStart) {
          flags.push({
            employeeId: clinic.employeeId,
            employeeName: clinic.employeeName,
            account: clinic.account,
            date: clinic.date,
            ruleCode: "STEP_4_5_CLINIC_LUNCH_OVERLAP",
            severity: "HIGH",
            description: `Clinic (${clinic.startTime}–${clinic.endTime ?? "?"}) overlaps Lunch (${lunch.startTime}–${lunch.endTime ?? "?"}). One must be deducted.`,
          });
        }
      }
    }

    // ── Write exceptions to DB ──────────────────────────────────────────────
    for (const flag of flags) {
      await ctx.db.insert("exceptions", {
        ...flag,
        status: "OPEN",
        batchId,
      });
    }

    return { flagged: flags.length };
  },
});

// ─── Resolve / Acknowledge Exception ─────────────────────────────────────────
export const resolveException = internalMutation({
  args: {
    exceptionId: v.id("exceptions"),
    action: v.union(v.literal("RESOLVED"), v.literal("ACKNOWLEDGED")),
    resolvedBy: v.string(),
  },
  handler: async (ctx, { exceptionId, action, resolvedBy }) => {
    await ctx.db.patch(exceptionId, {
      status: action,
      resolvedBy,
      resolvedAt: Date.now(),
    });
  },
});

// ─── Update Sync Status ─────────────────────────────────────────────────────
export const updateSyncStatus = internalMutation({
  args: {
    status: v.string(),
    lastSync: v.optional(v.number()),
    nextSync: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("syncStatus").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("syncStatus", args);
    }
  },
});

// ─── Clear All Data Tables ──────────────────────────────────────────────────
export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["timeLogs", "breakLogs", "leaves", "otRequests", "schedules", "exceptions"];
    let total = 0;
    for (const table of tables) {
      // Use take(200) to prevent hitting Convex's 8192 item write limit 
      // (deleting 1 document also updates ~4 indixes, so 200 * 6 * 5 = 6000 writes)
      const rows = await ctx.db.query(table as any).take(200);
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
      total += rows.length;
    }
    return { deleted: total, hasMore: total > 0 };
  },
});
