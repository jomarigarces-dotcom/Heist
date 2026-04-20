require('dotenv').config();
const Zoho = require('./zoho');
const axios = require('axios');

async function testLeaves() {
  const zoho = new Zoho(process.env.ZOHO_CLIENT_ID, process.env.ZOHO_CLIENT_SECRET, "http://localhost:4000/callback");
  const token = await zoho.getValidToken();
  const config = { linkName: 'Leaves_For_Approval_All_Statuses', app: 'ece-attendance-manila' };
  
  let allRecords = [];
  let startIndex = 1;
  const maxLoops = 20; // limit loops for testing
  let loopCount = 0;
  
  console.log("Starting test fetch for leaves...");
  while(loopCount < maxLoops) {
    let url = `https://creator.zoho.com/api/v2/ececonsultinggroup/${config.app}/report/${config.linkName}?from=${startIndex}&limit=200`;
    console.log(`[Loop ${loopCount+1}] Fetching startIndex ${startIndex}...`);
    try {
      const startMs = Date.now();
      const res = await axios.get(url, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` } });
      const records = res.data.data || [];
      console.log(`   - Fetched ${records.length} records in ${Date.now() - startMs}ms`);
      allRecords = allRecords.concat(records);
      
      if(records.length < 200) {
        console.log("   - Less than 200 records received, exiting loop.");
        break;
      }
      startIndex += 200;
    } catch (err) {
      console.error(`   - Error:`, err.response?.data || err.message);
      break;
    }
    loopCount++;
  }
  
  console.log(`Total records fetched in ${loopCount} loops: ${allRecords.length}`);
}

testLeaves().catch(console.error);
