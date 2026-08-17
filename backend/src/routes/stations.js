const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// @route   GET /api/stations
// @desc    Get all charging stations with optional search and filters
router.get('/', async (req, res) => {
  try {
    const { search, chargerType, connectorType, status } = req.query;
    
    // Fetch all stations from DB
    const sql = 'SELECT * FROM stations';
    const stations = await db.query(sql);
    
    // Format and parse chargers JSON
    let formattedStations = stations.map(station => ({
      ...station,
      chargers: JSON.parse(station.chargers_json)
    }));

    // Filter in-memory for flexibility
    if (search) {
      const searchTerm = search.toLowerCase();
      formattedStations = formattedStations.filter(station => 
        station.name.toLowerCase().includes(searchTerm) || 
        station.address.toLowerCase().includes(searchTerm)
      );
    }

    if (chargerType) {
      formattedStations = formattedStations.filter(station => 
        station.chargers.some(c => c.type.toLowerCase() === chargerType.toLowerCase())
      );
    }

    if (connectorType) {
      formattedStations = formattedStations.filter(station => 
        station.chargers.some(c => c.connector.toLowerCase() === connectorType.toLowerCase())
      );
    }

    if (status) {
      formattedStations = formattedStations.filter(station => 
        station.chargers.some(c => c.status.toLowerCase() === status.toLowerCase())
      );
    }

    res.json({
      success: true,
      count: formattedStations.length,
      data: formattedStations
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch charging stations.'
    });
  }
});

// @route   GET /api/stations/:id
// @desc    Get a single charging station by ID
router.get('/:id', async (req, res) => {
  try {
    const station = await db.get('SELECT * FROM stations WHERE id = ?', [req.params.id]);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Station with ID '${req.params.id}' does not exist.`
      });
    }

    const formattedStation = {
      ...station,
      chargers: JSON.parse(station.chargers_json)
    };

    res.json({
      success: true,
      data: formattedStation
    });
  } catch (error) {
    console.error(`Error fetching station ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve station details.'
    });
  }
});

// @route   POST /api/stations
// @desc    Add a new charging station (Admin API)
router.post('/', async (req, res) => {
  try {
    const { name, address, latitude, longitude, operating_hours, contact_number, chargers } = req.body;

    // Simple validation
    if (!name || !address || latitude === undefined || longitude === undefined || !operating_hours || !contact_number || !chargers) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Please provide all required fields: name, address, latitude, longitude, operating_hours, contact_number, and chargers.'
      });
    }

    // Generate a clean ID from the name (e.g. "Zeon Charging" -> "station-zeon-charging")
    const stationId = 'station-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const chargersJson = JSON.stringify(chargers);

    await db.run(
      `INSERT INTO stations (id, name, address, latitude, longitude, operating_hours, contact_number, chargers_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [stationId, name, address, parseFloat(latitude), parseFloat(longitude), operating_hours, contact_number, chargersJson]
    );

    res.status(201).json({
      success: true,
      message: 'Charging station registered successfully.',
      data: {
        id: stationId,
        name,
        address,
        latitude,
        longitude,
        operating_hours,
        contact_number,
        chargers
      }
    });
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to create charging station.'
    });
  }
});

module.exports = router;
