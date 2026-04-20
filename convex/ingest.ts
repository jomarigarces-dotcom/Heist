import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ─── Helper: CORS headers for preflight ───────────────────────────────────────
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// ─── Ingest Time Logs ─────────────────────────────────────────────────────────
export const ingestTimeLogs = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const body = await request.json();
    const { batchId, records } = body as {
      batchId: string;
      records: Array<{
        employeeId: string;
        employeeName: string;
        account?: string;
        site?: string;
        date: string;
        loginTime?: string;
        logoutTime?: string;
        status?: string;
        lateHours?: number;
        undertimeHours?: number;
        billableHours?: number;
        errorCount?: number;
      }>;
    };
    if (!batchId || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    await ctx.runMutation(internal.mutations.bulkInsertTimeLogs, {
      batchId,
      records,
    });
    // Trigger the analyzer after ingestion
    await ctx.runMutation(internal.mutations.runAnalyzer, { batchId });
    return new Response(
      JSON.stringify({ ok: true, inserted: records.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});

// ─── Ingest Break Logs ────────────────────────────────────────────────────────
export const ingestBreakLogs = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const body = await request.json();
    const { batchId, records } = body as {
      batchId: string;
      records: Array<{
        employeeId: string;
        employeeName: string;
        account?: string;
        date: string;
        breakType?: string;
        startTime?: string;
        endTime?: string;
        durationHours?: number;
        overBreakHours?: number;
      }>;
    };
    if (!batchId || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    await ctx.runMutation(internal.mutations.bulkInsertBreakLogs, {
      batchId,
      records,
    });
    return new Response(
      JSON.stringify({ ok: true, inserted: records.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});

// ─── Ingest Leaves ────────────────────────────────────────────────────────────
export const ingestLeaves = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const body = await request.json();
    const { batchId, records } = body as {
      batchId: string;
      records: Array<{
        employeeId: string;
        employeeName: string;
        account?: string;
        leaveDate: string;
        leaveType?: string;
        status?: string;
        dayType?: string;
      }>;
    };
    if (!batchId || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    await ctx.runMutation(internal.mutations.bulkInsertLeaves, {
      batchId,
      records,
    });
    return new Response(
      JSON.stringify({ ok: true, inserted: records.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});

// ─── Ingest OT Requests ───────────────────────────────────────────────────────
export const ingestOTRequests = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const body = await request.json();
    const { batchId, records } = body as {
      batchId: string;
      records: Array<{
        employeeId: string;
        employeeName: string;
        account?: string;
        otDate: string;
        requestedHours?: number;
        status?: string;
      }>;
    };
    if (!batchId || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    await ctx.runMutation(internal.mutations.bulkInsertOTRequests, {
      batchId,
      records,
    });
    return new Response(
      JSON.stringify({ ok: true, inserted: records.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});

// ─── Ingest Schedules ─────────────────────────────────────────────────────────
export const ingestSchedules = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const body = await request.json();
    const { batchId, records } = body as {
      batchId: string;
      records: Array<{
        employeeId: string;
        employeeName: string;
        account?: string;
        weekStartDate: string;
        weekEndDate: string;
        scheduledHours?: number;
      }>;
    };
    if (!batchId || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    await ctx.runMutation(internal.mutations.bulkInsertSchedules, {
      batchId,
      records,
    });
    return new Response(
      JSON.stringify({ ok: true, inserted: records.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});

// ─── Ingest Sync Status ───────────────────────────────────────────────────────
export const ingestSyncStatus = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const { status, lastSync, nextSync, error } = await request.json();
    await ctx.runMutation(internal.mutations.updateSyncStatus, {
      status,
      lastSync,
      nextSync,
      error,
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});

// ─── Clear All Data ───────────────────────────────────────────────────────────
export const clearAllData = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const result = await ctx.runMutation(internal.mutations.clearAllData, {});
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});
