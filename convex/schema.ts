import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Raw time log records from Zoho (View_Time_Logs_All1)
  timeLogs: defineTable({
    employeeId: v.string(),
    employeeName: v.string(),
    account: v.optional(v.string()),
    site: v.optional(v.string()),
    date: v.string(), // "YYYY-MM-DD"
    loginTime: v.optional(v.string()),
    logoutTime: v.optional(v.string()),
    status: v.optional(v.string()),
    lateHours: v.optional(v.number()),
    undertimeHours: v.optional(v.number()),
    billableHours: v.optional(v.number()),
    errorCount: v.optional(v.number()),
    batchId: v.string(), // to allow re-ingestion per batch
  })
    .index("by_date", ["date"])
    .index("by_employee", ["employeeId"])
    .index("by_batch", ["batchId"]),

  // Raw break log records from Zoho (View_Break_Logs_All)
  breakLogs: defineTable({
    employeeId: v.string(),
    employeeName: v.string(),
    account: v.optional(v.string()),
    date: v.string(),
    breakType: v.optional(v.string()), // "Lunch", "Clinic", "Break", etc.
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    durationHours: v.optional(v.number()),
    overBreakHours: v.optional(v.number()),
    batchId: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_employee", ["employeeId"])
    .index("by_batch", ["batchId"]),

  // Raw leave records (Leaves_For_Approval_All_Statuses)
  leaves: defineTable({
    employeeId: v.string(),
    employeeName: v.string(),
    account: v.optional(v.string()),
    leaveDate: v.string(),
    leaveType: v.optional(v.string()), // "VL", "SL", "EL", etc.
    status: v.optional(v.string()), // "Approved", "Pending", "For Approval (Retraction)"
    dayType: v.optional(v.string()), // "Full Day", "Half Day"
    batchId: v.string(),
  })
    .index("by_date", ["leaveDate"])
    .index("by_employee", ["employeeId"])
    .index("by_batch", ["batchId"]),

  // Raw OT requests
  otRequests: defineTable({
    employeeId: v.string(),
    employeeName: v.string(),
    account: v.optional(v.string()),
    otDate: v.string(),
    requestedHours: v.optional(v.number()),
    status: v.optional(v.string()), // "Approved", "Pending", "Denied"
    batchId: v.string(),
  })
    .index("by_date", ["otDate"])
    .index("by_employee", ["employeeId"])
    .index("by_batch", ["batchId"]),

  // Daily schedules (All_Daily_Schedules_View_Only)
  schedules: defineTable({
    employeeId: v.string(),
    employeeName: v.string(),
    account: v.optional(v.string()),
    weekStartDate: v.string(),
    weekEndDate: v.string(),
    scheduledHours: v.optional(v.number()),
    batchId: v.string(),
  })
    .index("by_week", ["weekStartDate"])
    .index("by_employee", ["employeeId"])
    .index("by_batch", ["batchId"]),

  // ──────────────────────────────────────────
  // EXCEPTIONS: Auto-generated violation flags
  // ──────────────────────────────────────────
  exceptions: defineTable({
    employeeId: v.string(),
    employeeName: v.string(),
    account: v.optional(v.string()),
    date: v.string(),
    ruleCode: v.string(), // e.g. "STEP_3_1_MISSING_LOGOUT"
    severity: v.string(), // "HIGH" | "MEDIUM" | "LOW"
    description: v.string(),
    rawValue: v.optional(v.string()), // The actual value that triggered the flag
    status: v.string(), // "OPEN" | "RESOLVED" | "ACKNOWLEDGED"
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    batchId: v.string(),
  })
    .index("by_date", ["date"])
    .index("by_account", ["account"])
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_batch", ["batchId"]),
});
