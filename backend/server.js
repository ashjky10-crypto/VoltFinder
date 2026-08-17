require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./src/db/db-init');
const db = require('./src/db/connection');

// Auto-initialize SQLite database on startup if database.sqlite does not exist or requires seeding
const dbPath = path.join(__dirname, 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  console.log('database.sqlite not found. Auto-initializing database and seeding stations...');
}
initDatabase(db.db)
  .then(() => {
    console.log('SQLite database verified and ready.');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the frontend (which might be run on another port or via file scheme) can connect
app.use(cors());

// Body parser middleware
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Mount Routes
app.use('/api/stations', require('./src/routes/stations'));
app.use('/api/bookings', require('./src/routes/bookings'));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'EV Booking System API is running smoothly.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong on the server.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test server health at: http://localhost:${PORT}/health`);
  
  // Start the live station status simulator
  startLiveStatusSimulator();
});

/**
 * Premium Feature 5: Live Status Simulator
 * Periodically changes statuses of random chargers in the SQLite database
 * to simulate vehicles plugging in / leaving in real-time.
 */
function startLiveStatusSimulator() {
  console.log('Live Station Status Simulator initialized (running every 30s)...');
  
  setInterval(async () => {
    try {
      // 1. Fetch all stations
      const sql = 'SELECT id, name, chargers_json FROM stations';
      const stations = await db.query(sql);
      
      if (!stations || stations.length === 0) return;
      
      // Pick a random station to update
      const randomStationIndex = Math.floor(Math.random() * stations.length);
      const station = stations[randomStationIndex];
      const chargers = JSON.parse(station.chargers_json);
      
      if (!chargers || chargers.length === 0) return;
      
      // Pick a random charger in that station
      const randomChargerIndex = Math.floor(Math.random() * chargers.length);
      const charger = chargers[randomChargerIndex];
      
      // Skip if charger is in Maintenance
      if (charger.status === 'Maintenance') return;
      
      // Toggle status between Available and Occupied
      const oldStatus = charger.status;
      const newStatus = oldStatus === 'Available' ? 'Occupied' : 'Available';
      
      chargers[randomChargerIndex].status = newStatus;
      
      // Update database
      const updateSql = 'UPDATE stations SET chargers_json = ? WHERE id = ?';
      await db.run(updateSql, [JSON.stringify(chargers), station.id]);
      
      console.log(`[Simulator] Station "${station.name}", Charger "${charger.id}" status toggled from ${oldStatus} -> ${newStatus}`);
    } catch (err) {
      console.error('[Simulator Error] Failed to simulate live status change:', err.message);
    }
  }, 30000); // Trigger every 30 seconds
}
