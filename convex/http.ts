import { httpRouter } from "convex/server";
import { ingestTimeLogs } from "./ingest";
import { ingestBreakLogs } from "./ingest";
import { ingestLeaves } from "./ingest";
import { ingestOTRequests } from "./ingest";
import { ingestSchedules } from "./ingest";

const http = httpRouter();

// ─── Time Logs ────────────────────────────────────────────────────────────────
http.route({
  path: "/ingest/time-logs",
  method: "POST",
  handler: ingestTimeLogs,
});

// ─── Break Logs ───────────────────────────────────────────────────────────────
http.route({
  path: "/ingest/break-logs",
  method: "POST",
  handler: ingestBreakLogs,
});

// ─── Leaves ───────────────────────────────────────────────────────────────────
http.route({
  path: "/ingest/leaves",
  method: "POST",
  handler: ingestLeaves,
});

// ─── OT Requests ──────────────────────────────────────────────────────────────
http.route({
  path: "/ingest/ot-requests",
  method: "POST",
  handler: ingestOTRequests,
});

// ─── Schedules ────────────────────────────────────────────────────────────────
http.route({
  path: "/ingest/schedules",
  method: "POST",
  handler: ingestSchedules,
});

export default http;
