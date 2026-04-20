const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, '.tokens.json');

const ZOHO_OWNER = 'ececonsultinggroup';
const APP_TIME = 'ece-time-tracker';
const APP_ATTENDANCE = 'ece-attendance-manila';

const REPORTS = {
  'time-logs': { linkName: 'View_Time_Logs_All1', app: APP_TIME },
  'break-logs': { linkName: 'View_Break_Logs_All', app: APP_TIME },
  'leaves': { linkName: 'Leaves_For_Approval_All_Statuses', app: APP_ATTENDANCE },
  'ot-requests': { linkName: 'View_OT_Requests', app: APP_TIME },
  'schedules': { linkName: 'All_Daily_Schedules_View_Only', app: APP_TIME }
};

class Zoho {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  isConfigured() {
    return this.clientId && this.clientId !== 'YOUR_CLIENT_ID_HERE';
  }

  isAuthenticated() {
    return fs.existsSync(TOKENS_FILE);
  }

  getAuthUrl() {
    return `https://accounts.zoho.com/oauth/v2/auth?client_id=${this.clientId}&response_type=code&prompt=consent&access_type=offline&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=ZohoCreator.report.READ`;
  }

  async authorize(code) {
    const url = 'https://accounts.zoho.com/oauth/v2/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('redirect_uri', this.redirectUri);
    params.append('code', code);

    const res = await axios.post(url, params);
    if(res.data.error) throw new Error(res.data.error);

    fs.writeFileSync(TOKENS_FILE, JSON.stringify({
      access_token: res.data.access_token,
      refresh_token: res.data.refresh_token,
      expires_at: Date.now() + (res.data.expires_in * 1000)
    }));
  }

  async refreshToken() {
    const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE));
    if(!tokens.refresh_token) throw new Error('No refresh token available');

    const url = 'https://accounts.zoho.com/oauth/v2/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('refresh_token', tokens.refresh_token);

    const res = await axios.post(url, params);
    if(res.data.error) throw new Error(res.data.error);

    fs.writeFileSync(TOKENS_FILE, JSON.stringify({
      ...tokens,
      access_token: res.data.access_token,
      expires_at: Date.now() + (res.data.expires_in * 1000)
    }));
    return res.data.access_token;
  }

  async getValidToken() {
    if(!this.isAuthenticated()) throw new Error('Not authenticated');
    const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE));
    if(Date.now() >= tokens.expires_at - 60000) { // refresh if expiring in 1 min
      return await this.refreshToken();
    }
    return tokens.access_token;
  }

  async fetchReport(reportType) {
    const config = REPORTS[reportType];
    if(!config) throw new Error(`Unknown report type: ${reportType}`);
    
    // Dynamic Date Filters from legacy logic
    let criteria = '';
    const now = new Date();
    const formatter = (d) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };

    if(reportType === 'time-logs') {
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      criteria = `((T_Date == "${formatter(now)}" || T_Date == "${formatter(yesterday)}") && Log_In != null && Log_Out == null)`;
    } else if(reportType === 'break-logs') {
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      criteria = `(B_Date == "${formatter(now)}" || B_Date == "${formatter(yesterday)}")`;
    } else if (reportType === 'schedules') {
      const diffToMonday = now.getDay() === 0 ? -6 : 1 - now.getDay();
      const start = new Date(new Date().setDate(now.getDate() + diffToMonday));
      const end = new Date(new Date(start).setDate(start.getDate() + 13));
      criteria = `(S_Date >= "${formatter(start)}" && S_Date <= "${formatter(end)}")`;
    } else if (reportType === 'leaves') {
      // Fetch full table. Zoho string-date `>=` operator drops recent records due to alphabetical sorting.
      criteria = '';
    } else if (reportType === 'ot-requests') {
      // Fetch full table. Zoho string-date `>=` operator drops recent records due to alphabetical sorting.
      criteria = '';
    }

    const token = await this.getValidToken();
    let allRecords = [];
    let startIndex = 1;
    
    while(true) {
      let url = `https://creator.zoho.com/api/v2/${ZOHO_OWNER}/${config.app}/report/${config.linkName}?from=${startIndex}&limit=200`;
      if(criteria) url += `&criteria=${encodeURIComponent(criteria)}`;

      try {
        const res = await axios.get(url, {
          headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
        });
        
        const records = res.data.data || [];
        allRecords = allRecords.concat(records);
        
        if(records.length < 200) break;
        startIndex += 200;
        
        // Add a 250ms delay to prevent Zoho Creator API from violently rate 
        // limiting us or forcefully dropping the connection during massive 130+ page requests.
        await new Promise(r => setTimeout(r, 250));
      } catch (err) {
        if(err.response?.data?.code === 3100) break; // "No Data Available" is 3100 in Zoho
        throw new Error(`Zoho API Error: ${err.message}`);
      }
    }
    
    return allRecords;
  }
}

module.exports = Zoho;
