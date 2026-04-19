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

    // DIAGNOSTIC: Print the first raw record to verify field names
    console.log(`\n[DIAGNOSTIC] First ${reportType} record keys: ${Object.keys(data[0]).join(', ')}`);
    if (reportType === 'leaves' || reportType === 'break-logs') {
      console.log(`[DIAGNOSTIC] First ${reportType} sample:`);
      console.log(JSON.stringify(data[0], null, 2));
    }
    console.log(`[DIAGNOSTIC] --------------------------------------------------\n`);

    // ── Helpers ──

    // Extract "HH:mm:ss" from Zoho datetime "18 Apr 2026 09:59:17"
    const sliceTime = (val) => {
      if (!val || typeof val !== 'string') return "";
      const trimmed = val.trim();
      const parts = trimmed.split(' ');
      // Full datetime: "18 Apr 2026 09:59:17" → take the 4th part
      if (parts.length >= 4) return parts[3];
      // Already just time: "09:59:17"
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
      // Employee ID: Zoho stores it in a dot-notation field
      const employeeId = row['Employee.Employee_Number'] || row['Employee_Number'] || row['Employee_ID'] || "Unknown";
      
      // Employee Name: Zoho lookup fields have .display_value
      const employeeName = row.Employee?.display_value || row['Employee_Name'] || row['Name'] || "Unknown";
      
      // Account: lookup field
      const account = row.Account?.display_value || row['Account'] || "Unknown";
      
      // Site
      const site = row['Account.Site'] || row['Employee.Site'] || row['Site'] || "Unknown";

      switch (reportType) {
        case 'time-logs':
          return {
            employeeId, employeeName, account, site,
            date: row.T_Date || row.Date,
            loginTime: sliceTime(row.Log_In),
            logoutTime: sliceTime(row.Log_Out),
            status: row.Status || row.Employment_Status,
            lateHours: num(row.L),
            undertimeHours: num(row.UT),
            billableHours: num(row.Working_Hrs),
            errorCount: num(row.Error_Checking)
          };

        case 'break-logs':
          return {
            employeeId, employeeName, account,
            date: row.B_Date || row.Date,
            breakType: row.Type || "Break",
            startTime: sliceTime(row.Start),
            endTime: sliceTime(row.End),
            durationHours: num(row.Tracked_Time_Hours || row.Hours),
            overBreakHours: num(row.OB)
          };

        case 'leaves':
          return {
            employeeId, employeeName, account,
            leaveDate: row.A_Date || row.From || row.Date,
            leaveType: row.Leave_Type || row.Type,
            status: row.Status || row.ApprovalStatus,
            dayType: row.Day_Type || row.Leave_Duration
          };

        case 'ot-requests':
          return {
            employeeId, employeeName, account,
            otDate: row.O_Date || row.Date_of_committed_OT || row.Date,
            requestedHours: num(row.Requested_Hours || row.OT_Hours),
            status: row.Status
          };

        case 'schedules':
          const schedDate = row.S_Date || row.Date;
          return {
            employeeId, employeeName, account,
            weekStartDate: schedDate,
            weekEndDate: row.End_Date || schedDate,
            scheduledHours: num(row.Scheduled_Hours || row.Hours)
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
      return { success: true, count: data.length, message: "Batch successful" };
    } catch (err) {
      const serverMessage = err.response?.data?.error || err.message;
      throw new Error(`Convex POST Error: ${serverMessage}`);
    }
  }
}

module.exports = Poster;
