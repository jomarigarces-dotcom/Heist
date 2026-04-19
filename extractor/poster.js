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
            date: row.T_Date || row.Date,
            loginTime: row.Log_In, logoutTime: row.Log_Out, status: row.Status || row.Employment_Status,
            lateHours: num(row.Late_Hours), undertimeHours: num(row.Undertime),
            billableHours: num(row.Total_Billable_Hours || row.Billable_Hours),
            errorCount: num(row.Error_Checking)
          };
        case 'break-logs':
          return {
            employeeId, employeeName, account,
            date: row.B_Date || row.Date,
            breakType: row.Break_Type, startTime: row.Start_Time, endTime: row.End_Time,
            durationHours: num(row.Duration), overBreakHours: num(row.Over_Break)
          };
        case 'leaves':
          return {
            employeeId, employeeName, account,
            leaveDate: row.A_Date || row.Date,
            leaveType: row.Leave_Type, status: row.Status, dayType: row.Day_Type
          };
        case 'ot-requests':
          return {
            employeeId, employeeName, account,
            otDate: row.O_Date || row.Date_of_committed_OT || row.Date,
            requestedHours: num(row.Requested_Hours), status: row.Status
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
