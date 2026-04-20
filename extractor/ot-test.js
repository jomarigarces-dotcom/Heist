require('dotenv').config();
const Zoho = require('./zoho');
const zoho = new Zoho(process.env.ZOHO_CLIENT_ID, process.env.ZOHO_CLIENT_SECRET, "http://localhost:4000/callback");

async function check() {
  console.log("Fetching OT using zoho.fetchReport()...");
  const records = await zoho.fetchReport('ot-requests');
  console.log(`Fetched ${records.length} OT records.`);
  
  if(records.length > 0) {
     const testDates = records.map(r => r.O_Date);
     console.log("Includes '19-Apr-2026'?: ", testDates.includes("19-Apr-2026"));
     console.log("Includes '18-Apr-2026'?: ", testDates.includes("18-Apr-2026"));
     
     // Check space notation too just in case ZOHO UI returned that
     console.log("Includes '19 Apr 2026'?: ", testDates.includes("19 Apr 2026"));
     
     console.log("Last 5 rows dates:");
     console.log(testDates.slice(-5));
  }
}

check().catch(console.error);
