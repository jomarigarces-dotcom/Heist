const axios = require('axios');

class Poster {
  constructor(convexUrl) {
    this.convexUrl = convexUrl.replace(/\/$/, "");
  }

  // ── Direct POST (for non-report payloads like sync-status) ──
  async postDirect(path, payload) {
    const url = `${this.convexUrl}${path}`;
    await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async pushToConvex(reportType, data) {
    // Handle sync-status separately — it's NOT a Zoho report
    if (reportType === 'sync-status') {
      await this.postDirect('/ingest/sync-status', data);
      return { success: true, message: "Sync status updated" };
    }

    if (!data || data.length === 0) {
      return { success: true, count: 0, message: "No data to push" };
    }

    const url = `${this.convexUrl}/ingest/${reportType}`;

    // ── Helpers ──

    // Extract "HH:mm:ss" from Zoho datetime "18 Apr 2026 09:59:17" or "02/19/2026 12:16:03"
    const sliceTime = (val) => {
      if (!val || typeof val !== 'string' || val.trim() === '') return "";
      const trimmed = val.trim();
      const parts = trimmed.split(' ');
      if (parts.length >= 2) return parts[parts.length - 1]; // last part is always time
      if (trimmed.includes(':')) return trimmed;
      return "";
    };

    // Safe number parse
    const num = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    };

    // Map Zoho raw API keys to Convex schema keys
    const mappedData = data.map(row => {

      switch (reportType) {
        // ─────────────────────────────────────────────────────────────────────
        // TIME LOGS — from ece-time-tracker / View_Time_Logs_All1
        // Keys: Employee.Employee_Number, Employee.display_value, Account.display_value,
        //        T_Date, Log_In, Log_Out, Status, L, UT, Working_Hrs, Error_Checking, Account.Site
        // ─────────────────────────────────────────────────────────────────────
        case 'time-logs':
          return {
            employeeId: row['Employee.Employee_Number'] || "Unknown",
            employeeName: row.Employee?.display_value || "Unknown",
            account: row.Account?.display_value || "Unknown",
            site: row['Account.Site'] || "Unknown",
            date: row.T_Date || "",
            loginTime: sliceTime(row.Log_In),
            logoutTime: sliceTime(row.Log_Out),
            status: row.Status || "",
            lateHours: num(row.L),
            undertimeHours: num(row.UT),
            billableHours: num(row.Working_Hrs),
            errorCount: num(row.Error_Checking)
          };

        // ─────────────────────────────────────────────────────────────────────
        // BREAK LOGS — from ece-time-tracker / View_Break_Logs_All
        // Keys: Employee.Employee_Number, Employee.display_value, Account.display_value,
        //        B_Date, Type, Start, End, Tracked_Time_Hours, OB
        // ─────────────────────────────────────────────────────────────────────
        case 'break-logs':
          return {
            employeeId: row['Employee.Employee_Number'] || "Unknown",
            employeeName: row.Employee?.display_value || "Unknown",
            account: row.Account?.display_value || "Unknown",
            date: row.B_Date || "",
            breakType: row.Type || "Break",
            startTime: sliceTime(row.Start),
            endTime: sliceTime(row.End),
            durationHours: num(row.Tracked_Time_Hours),
            overBreakHours: num(row.OB)
          };

        // ─────────────────────────────────────────────────────────────────────
        // LEAVES — from ece-attendance-manila / Leaves_For_Approval_All_Statuses
        // Keys: Employee.Employee_ID, Employee.display_value, Employee.AccountHR,
        //        A_Date, Leave_Type, Request_Status, Half
        // NOTE: No "Account" lookup field! Uses Employee.AccountHR instead.
        //       Status field is "Request_Status" NOT "Status".
        //       Employee ID is "Employee.Employee_ID" NOT "Employee.Employee_Number".
        // ─────────────────────────────────────────────────────────────────────
        case 'leaves':
          return {
            employeeId: row['Employee.Employee_ID'] || "Unknown",
            employeeName: row.Employee?.display_value || "Unknown",
            account: row['Employee.AccountHR'] || "Unknown",
            leaveDate: row.A_Date || "",
            leaveType: row.Leave_Type || "",
            status: row.Request_Status || "",
            dayType: row.Half || ""
          };

        // ─────────────────────────────────────────────────────────────────────
        // OT REQUESTS — from ece-time-tracker / View_OT_Requests
        // Keys: Employee.Employee_Number, Employee.display_value, Employee.AccountHR,
        //        O_Date, OT_Hours, Status
        // NOTE: No "Account" lookup field! Uses Employee.AccountHR instead.
        // ─────────────────────────────────────────────────────────────────────
        case 'ot-requests':
          return {
            employeeId: row['Employee.Employee_Number'] || "Unknown",
            employeeName: row.Employee?.display_value || "Unknown",
            account: row['Employee.AccountHR'] || row.Account?.display_value || "Unknown",
            otDate: row.O_Date || "",
            requestedHours: num(row.OT_Hours),
            status: row.Status || ""
          };

        // ─────────────────────────────────────────────────────────────────────
        // SCHEDULES — from ece-time-tracker / All_Daily_Schedules_View_Only
        // Keys: Employee.Employee_Number, Employee.display_value, Account.display_value,
        //        S_Date, WHPD, Schedule_Start, Schedule_End, Week_Day
        // NOTE: WHPD = Working Hours Per Day (daily, not weekly)
        // ─────────────────────────────────────────────────────────────────────
        case 'schedules':
          return {
            employeeId: row['Employee.Employee_Number'] || "Unknown",
            employeeName: row.Employee?.display_value || "Unknown",
            account: row.Account?.display_value || "Unknown",
            weekStartDate: row.S_Date || "",
            weekEndDate: row.S_Date || "",
            scheduledHours: num(row.WHPD)
          };

        default:
          return row;
      }
    });

    const batchId = Date.now().toString();
    const CHUNK_SIZE = 5000;

    try {
      for (let i = 0; i < mappedData.length; i += CHUNK_SIZE) {
        const chunk = mappedData.slice(i, i + CHUNK_SIZE);
        const payload = { batchId, records: chunk };
        await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      console.log(`[OK] Pushed ${data.length} ${reportType} records.`);
      return { success: true, count: data.length };
    } catch (err) {
      const serverMessage = err.response?.data?.error || err.message;
      throw new Error(`Convex POST Error (${reportType}): ${serverMessage}`);
    }
  }
}

module.exports = Poster;
