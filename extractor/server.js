require('dotenv').config();
const express = require('express');
const path = require('path');
const Zoho = require('./zoho');
const Poster = require('./poster');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuration
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const zoho = new Zoho(process.env.ZOHO_CLIENT_ID, process.env.ZOHO_CLIENT_SECRET, REDIRECT_URI);
const poster = new Poster(process.env.CONVEX_SITE_URL || 'http://localhost:3211');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
      <p>Tokens saved locally. You can close this tab and return to the Extractor Dashboard.</p>
      <script>setTimeout(() => window.location.href="/", 2000);</script>
    `);
  } catch (err) {
    res.send(`Authorization failed: ${err.message}`);
  }
});

// ── Extraction Trigger Routes ──
app.post('/extract/:type', async (req, res) => {
  const type = req.params.type;
  try {
    if(!zoho.isAuthenticated()) throw new Error('Not authenticated with Zoho');
    
    // 1. Pull from Zoho
    console.log(`[Pulling] Zoho Report: ${type}...`);
    const records = await zoho.fetchReport(type);
    console.log(`[Done] Fetched ${records.length} records for ${type}.`);
    
    // 2. Push to Convex
    console.log(`[Pushing] To Convex /ingest/${type}...`);
    const pushResult = await poster.pushToConvex(type, records);
    console.log(`[Success] Pushed to Convex.`);
    
    res.json({ 
      success: true, 
      message: `Pushed ${records.length} records.`, 
      records: records.length 
    });
  } catch (err) {
    console.error(`[Error] /extract/${type}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Heist Extractor Control Panel running on http://localhost:${PORT}`);
  console.log(`👉 Please open exactly http://localhost:${PORT} in your web browser.`);
});
