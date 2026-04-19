const axios = require('axios');

class Poster {
  constructor(convexUrl) {
    this.convexUrl = convexUrl.replace(/\/$/, "");
  }

  async pushToConvex(reportType, data) {
    if(!data || data.length === 0) {
      return { success: true, count: 0, message: "No data to push" };
    }
    
    // Convex automatically configured endpoints from WF Heist http router
    const url = `${this.convexUrl}/ingest/${reportType}`;
    
    // DIAGNOSTIC PROBE: Print the first raw record from Zoho to find the 'parts'
    console.log(`\n[DIAGNOSTIC] First ${reportType} record structure from Zoho:`);
    console.log(JSON.stringify(data[0], null, 2));
    console.log(`[DIAGNOSTIC] --------------------------------------------------\n`);

    // Map Zoho raw API keys to Convex schema keys
    const mappedData = data.map(row => {
      // Helper: Fuzzy find Zoho keys (case-insensitive, ignores underscores)
      const getFuzzy = (target) => {
        const normalizedTarget = target.toLowerCase().replace(/_/g, '');
        const actualKey = Object.keys(row).find(k => k.toLowerCase().replace(/_/g, '') === normalizedTarget);
        return actualKey ? row[actualKey] : undefined;
      };

      // Helper: Parse Zoho Duration string (HH:mm:ss or mm:ss) to decimal hours
      const parseDuration = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const parts = String(val).split(':').map(Number);
        if (parts.length === 3) return parts[0] + parts[1]/60 + parts[2]/3600;
        if (parts.length === 2) return parts[0]/60 + parts[1]/3600;
        return parseFloat(val) || 0;
      };

      // Handle simple numeric conversions
      const num = (val) => val ? parseFloat(val) : 0;

      const employeeId = getFuzzy('Employee_Number') || getFuzzy('Employee_ID') || row['Employee.Employee_Number'] || "Unknown";
      const employeeName = row.Employee?.display_value || getFuzzy('Employee_Name') || getFuzzy('Name') || "Unknown";
      const account = row.Account?.display_value || getFuzzy('Account') || getFuzzy('LOB') || "Unknown";
      const site = getFuzzy('Site') || "Unknown";

      switch(reportType) {
        case 'time-logs':
          return {
            employeeId, employeeName, account, site,
            date: row.T_Date || row.Date || row.Log_Date,
            loginTime: sliceTime(row.Log_In), 
            logoutTime: sliceTime(row.Log_Out), 
            status: row.Status || row.Employment_Status || row.Current_Status,
            lateHours: num(row.L || row.Late_Hours || row.Late || row.Late_Time), 
            undertimeHours: num(row.UT || row.Undertime || row.Undertime_Hours || row.Short_Time),
            billableHours: num(row.Working_Hrs || row.Total_Billable_Hours || row.Billable_Hours || row.Hours_Worked),
            errorCount: num(row.Error_Checking || row.Errors || row.Flag_Count)
          };
        case 'break-logs':
          return {
            employeeId, employeeName, account,
            date: row.B_Date || row.Date,
            breakType: row.Type || row.Break_Type || row.Break_Name || "Break", 
            startTime: sliceTime(row.Start || row.Start_Time || row.Break_Start), 
            endTime: sliceTime(row.End || row.End_Time || row.Break_End),
            durationHours: num(row.Tracked_Time_Hours || row.Duration || row.Break_Duration || row.Duration_Hours), 
            overBreakHours: num(row.OB || row.Over_Break || row.Over_Break_Hours || row.Excess_Break)
          };
        case 'leaves':
          return {
            employeeId, employeeName, account,
            leaveDate: row.A_Date || row.Date || row.From || row.Leave_Date,
            leaveType: row.Leave_Type || row.Type_of_Leave || row.Category, 
            status: row.Status || row.Approval_Status, 
            dayType: row.Day_Type || row.Leave_Duration || row.Absence_Duration
          };
        case 'ot-requests':
          return {
            employeeId, employeeName, account,
            otDate: row.O_Date || row.Date_of_committed_OT || row.Date || row.OT_Date,
            requestedHours: num(row.Requested_Hours || row.OT_Hours || row.Duration), 
            status: row.Status || row.Approval_Status
          };
        case 'schedules':
          const schedDate = row.S_Date || row.Start_Date || row.Date;
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
      // Chunk arrays to prevent passing Convex's hard limit of 8192 records per request
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
