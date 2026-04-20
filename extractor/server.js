require('dotenv').config();
const express = require('express');
const path = require('path');
const Zoho = require('./zoho');
const Poster = require('./poster');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuration
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const zoho = new Zoho(process.env.ZOHO_CLIENT_ID, process.env.ZOHO_CLIENT_SECRET, REDIRECT_URI);
const poster = new Poster(process.env.CONVEX_SITE_URL || 'http://localhost:3211');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Automated Sync Logic ─────────────────────────────────────────────────────

async function syncAllSectors() {
  console.log(`\n[${new Date().toISOString()}] 🚨 INITIATING DAILY SYSTEM SYNC...`);
  
  try {
    if (!zoho.isAuthenticated()) {
      console.log("[SKIP] System not authenticated. Skipping automated sync.");
      return;
    }

    // Broadcast SYNCING status
    await poster.pushToConvex('sync-status', { status: 'SYNCING' });

    const reports = ['time-logs', 'break-logs', 'leaves', 'ot-requests', 'schedules'];
    let count = 0;

    for (const report of reports) {
      console.log(`[SYNC] Pulling ${report}...`);
      const records = await zoho.fetchReport(report);
      const result = await poster.pushToConvex(report, records);
      count += result.count || 0;
    }

    // Calculate next sync (Midnight Tomorrow NYC)
    const now = new Date();
    const next = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    next.setHours(24, 0, 0, 0); 
    const nextSyncMs = next.getTime();

    await poster.pushToConvex('sync-status', {
      status: 'IDLE',
      lastSync: Date.now(),
      nextSync: nextSyncMs
    });

    console.log(`\n[SUCCESS] Daily Sync Complete. Total Records: ${count}`);
    console.log(`[NEXT SYNC] ${next.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST\n`);

  } catch (err) {
    console.error(`[CRITICAL] Automated Sync Failed:`, err.message);
    await poster.pushToConvex('sync-status', { 
      status: 'FAILED', 
      error: err.message,
      lastSync: Date.now()
    });
  }
}

// Schedule: Daily at Midnight America/New_York
cron.schedule('0 0 * * *', () => {
  syncAllSectors();
}, {
  scheduled: true,
  timezone: "America/New_York"
});

console.log('📅 Automation: Daily Sector Sync registered for 12 AM EST.');

// ── Auth Routes ──
app.get('/status', (req, res) => {
  res.json({ authenticated: zoho.isAuthenticated() });
});

app.get('/auth', (req, res) => {
  if(!zoho.isConfigured()) return res.send('ZOHO_CLIENT_ID missing in .env');
  res.redirect(zoho.getAuthUrl());
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if(!code) return res.send('No code provided by Zoho.');
  
  try {
    await zoho.authorize(code);
    res.send(`
      <h2>Authorization Successful!</h2>
      <p>Tokens saved locally. Auto-sync is now ACTIVE.</p>
      <script>setTimeout(() => window.location.href="/", 2000);</script>
    `);
    // Run an initial sync on first auth
    syncAllSectors();
  } catch (err) {
    res.send(`Authorization failed: ${err.message}`);
  }
});

// ── Extraction Trigger Routes ──
app.post('/extract/:type', async (req, res) => {
  const type = req.params.type;
  try {
    if(!zoho.isAuthenticated()) throw new Error('Not authenticated with Zoho');
    
    // Use the consolidated sync logic even for manual triggers
    const records = await zoho.fetchReport(type);
    await poster.pushToConvex(type, records);
    
    // Update last sync time since we just did one
    await poster.pushToConvex('sync-status', { 
      status: 'IDLE', 
      lastSync: Date.now() 
    });

    res.json({ success: true, count: records.length });
  } catch (err) {
    console.error(`[Error] /extract/${type}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Trigger a manual sync endpoint for all
app.post('/extract-all', async (req, res) => {
  syncAllSectors();
  res.json({ success: true, message: "Global sync initiated." });
});

// Trigger a database wipe
app.post('/clear-all', async (req, res) => {
  try {
    await poster.postDirect('/clear-all', {});
    res.json({ success: true, message: "Convex database wiped successfully." });
  } catch (err) {
    console.error(`[CRITICAL] DB Wipe Failed:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Heist Extractor Control Panel running on http://localhost:${PORT}`);
  console.log(`👉 Please open exactly http://localhost:${PORT} in your web browser.`);
});
