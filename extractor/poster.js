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
    
    try {
      const res = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/json' }
      });
      return { success: true, count: data.length, message: res.data };
    } catch (err) {
      throw new Error(`Convex POST Error: ${err.message}`);
    }
  }
}

module.exports = Poster;
