// Rule codes → human-readable labels
export const RULE_LABELS = {
  STEP_2_1_PENDING_OT: "Pending OT Request",
  STEP_2_1_PENDING_LEAVE: "Pending/Retraction Leave",
  STEP_3_1_ERROR_COUNT: "Zoho Error Flag",
  STEP_3_1_MISSING_LOGOUT: "Missing Logout",
  STEP_3_1_MISSING_STATUS: "Missing Status",
  STEP_3_1_MISSING_ACCOUNT: "Missing Account",
  STEP_3_2_LATE_MINOR: "Late (Minor)",
  STEP_3_3_LATE_CRITICAL: "Late ≥ 4h (Critical)",
  STEP_3_4_UNDERTIME_CRITICAL: "Undertime ≥ 4h",
  STEP_3_5_HALF_DAY_LEAVE: "Half-Day Leave Check",
  STEP_3_6_LEAVE_BUT_PRESENT: "Full-Day Leave + Present",
  STEP_3_9_SCHEDULE_NOT_40H: "Schedule ≠ 40h/week",
  STEP_4_1_BREAK_NO_END: "Open Break (No End)",
  STEP_4_2_CLINIC_OVERTIME: "Clinic > 2h",
  STEP_4_3_OVERBREAK: "Overbreak ≥ 0.8h",
  STEP_4_5_CLINIC_LUNCH_OVERLAP: "Clinic/Lunch Overlap",
};

export const SEVERITY_ICONS = {
  HIGH: "🔴",
  MEDIUM: "🟡",
  LOW: "🟢",
};

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
