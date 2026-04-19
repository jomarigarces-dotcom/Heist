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
    
    // Map Zoho raw API keys to Convex schema keys
    const mappedData = data.map(row => {
      // Safely extract nested Zoho lookups / dot-notation fields
      const employeeId = row['Employee.Employee_Number'] || row['Employee_ID'] || row.Employee?.Employee_Number || row.Employee_Number || row.Agent_ID || "Unknown";
      const employeeName = row.Employee?.display_value || row.Employee || row.Employee_Name || row.Name || row.Agent_Name || "Unknown";
      const account = row.Account?.display_value || row.Account || row.LOB?.display_value || "Unknown";
      const site = row['Account.Site'] || row.Site || "Unknown";

      // Parse float safely
      const num = (val) => val ? parseFloat(val) : 0;

      switch(reportType) {
        case 'time-logs':
          return {
            employeeId, employeeName, account, site,
            date: row.T_Date || row.Date || row.Log_Date,
            loginTime: row.Log_In || row.Check_In, 
            logoutTime: row.Log_Out || row.Check_Out, 
            status: row.Status || row.Employment_Status || row.Current_Status,
            lateHours: num(row.Late_Hours || row.Late || row.Late_Time), 
            undertimeHours: num(row.Undertime || row.Undertime_Hours || row.Short_Time),
            billableHours: num(row.Total_Billable_Hours || row.Billable_Hours || row.Hours_Worked),
            errorCount: num(row.Error_Checking || row.Errors || row.Flag_Count)
          };
        case 'break-logs':
          return {
            employeeId, employeeName, account,
            date: row.B_Date || row.Date,
            breakType: row.Break_Type || row.Break_Type1 || row.Break_Name || row.Type, 
            startTime: row.Start_Time || row.Start_Break || row.Break_Start, 
            endTime: row.End_Time || row.End_Break || row.Break_End,
            durationHours: num(row.Duration || row.Break_Duration || row.Duration_Hours), 
            overBreakHours: num(row.Over_Break || row.Over_Break_Hours || row.Excess_Break)
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
