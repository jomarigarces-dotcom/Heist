require('dotenv').config();
const Zoho = require('./zoho');
const axios = require('axios');

async function testFetchEnd() {
  const zoho = new Zoho(process.env.ZOHO_CLIENT_ID, process.env.ZOHO_CLIENT_SECRET, "http://localhost:4000/callback");
  const token = await zoho.getValidToken();
  
  const startIndex = 500000;
  let url = `https://creator.zoho.com/api/v2/ececonsultinggroup/ece-attendance-manila/report/Leaves_For_Approval_All_Statuses?from=${startIndex}&limit=200`;
  
  try {
    const res = await axios.get(url, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` } });
    console.log("Records length:", res.data?.data?.length);
  } catch (err) {
    console.error("Error code:", err.response?.data?.code);
  }
}

testFetchEnd().catch(console.error);
