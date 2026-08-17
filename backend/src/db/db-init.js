const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

const stationsSeedData = [
  {
    id: "station-mlo-1",
    name: "Zeon Charging - Forum Fiza Mall",
    address: "Forum Fiza Mall, Pandeshwar Road, Mangalore, Karnataka 575001",
    latitude: 12.8624,
    longitude: 74.8427,
    operating_hours: "24/7",
    contact_number: "+91 95000 36565",
    chargers: [
      { id: "sm1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 50, status: "Available", pricePerKWh: 22.0 },
      { id: "sm1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 15.0 }
    ]
  },
  {
    id: "station-mlo-2",
    name: "Tata Power - Bharath Mall",
    address: "Bharath Mall, Bejai Main Road, Opp KSRTC Bus Stand, Mangalore, Karnataka 575004",
    latitude: 12.8872,
    longitude: 74.8436,
    operating_hours: "10:00 - 22:00",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "sm2-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 19.5 },
      { id: "sm2-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 13.0 }
    ]
  },
  {
    id: "station-mlo-3",
    name: "Statiq Charging Hub - Goldfinch Hotel",
    address: "Goldfinch Hotel, Bunts Hostel Rd, Mangalore, Karnataka 575003",
    latitude: 12.8763,
    longitude: 74.8420,
    operating_hours: "24/7",
    contact_number: "+91 80 6902 4300",
    chargers: [
      { id: "sm3-c1", type: "Fast DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 21.0 },
      { id: "sm3-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 14.0 }
    ]
  },
  {
    id: "station-blr-1",
    name: "Jio-bp Pulse - Shell Outer Ring Road",
    address: "Shell Petrol Pump, Outer Ring Road, Devarabisanahalli, Bangalore, Karnataka 560103",
    latitude: 12.9272,
    longitude: 77.6853,
    operating_hours: "24/7",
    contact_number: "+91 1800 891 9023",
    chargers: [
      { id: "sb1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 20.0 },
      { id: "sb1-c2", type: "Rapid DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 20.0 }
    ]
  },
  {
    id: "station-blr-2",
    name: "Zeon Charging - Nexus Mall Koramangala",
    address: "Nexus Mall Parking, Koramangala 2nd Block, Bangalore, Karnataka 560034",
    latitude: 12.9348,
    longitude: 77.6189,
    operating_hours: "24/7",
    contact_number: "+91 95000 36565",
    chargers: [
      { id: "sb2-c1", type: "Rapid DC", connector: "CCS2", powerKW: 150, status: "Available", pricePerKWh: 24.0 },
      { id: "sb2-c2", type: "Fast DC", connector: "CCS2", powerKW: 50, status: "Occupied", pricePerKWh: 20.0 },
      { id: "sb2-c3", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 15.0 }
    ]
  },
  {
    id: "station-blr-3",
    name: "Tata Power - MG Road Metro Station",
    address: "MG Road Metro Station Parking, Bangalore, Karnataka 560001",
    latitude: 12.9754,
    longitude: 77.6068,
    operating_hours: "06:00 - 23:00",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "sb3-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 18.0 },
      { id: "sb3-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 12.0 }
    ]
  },
  {
    id: "station-mum-1",
    name: "Magenta ChargeGrid - BKC",
    address: "G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
    latitude: 19.0607,
    longitude: 72.8634,
    operating_hours: "24/7",
    contact_number: "+91 96196 05050",
    chargers: [
      { id: "smum1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 50, status: "Available", pricePerKWh: 21.0 },
      { id: "smum1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 14.0 }
    ]
  },
  {
    id: "station-mum-2",
    name: "Tata Power - Palladium Mall Lower Parel",
    address: "Palladium Mall Parking, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013",
    latitude: 18.9942,
    longitude: 72.8273,
    operating_hours: "10:00 - 23:30",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "smum2-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 20.0 },
      { id: "smum2-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 13.5 }
    ]
  },
  {
    id: "station-mum-3",
    name: "Jio-bp Pulse - Jio World Drive BKC",
    address: "Jio World Drive, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
    latitude: 19.0625,
    longitude: 72.8652,
    operating_hours: "24/7",
    contact_number: "+91 1800 891 9023",
    chargers: [
      { id: "smum3-c1", type: "Rapid DC", connector: "CCS2", powerKW: 120, status: "Available", pricePerKWh: 22.0 },
      { id: "smum3-c2", type: "Fast DC", connector: "CCS2", powerKW: 60, status: "Occupied", pricePerKWh: 19.0 }
    ]
  },
  {
    id: "station-del-1",
    name: "Statiq Charging Hub - Connaught Place",
    address: "Janpath Rd, Connaught Place, New Delhi, Delhi 110001",
    latitude: 28.6272,
    longitude: 77.2184,
    operating_hours: "24/7",
    contact_number: "+91 80 6902 4300",
    chargers: [
      { id: "sdel1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 19.0 },
      { id: "sdel1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 13.0 }
    ]
  },
  {
    id: "station-del-2",
    name: "Tata Power - DLF Avenue Saket",
    address: "DLF Avenue Saket, Press Enclave Marg, Saket District Centre, New Delhi, Delhi 110017",
    latitude: 28.5284,
    longitude: 77.2195,
    operating_hours: "10:00 - 23:00",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "sdel2-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 18.5 },
      { id: "sdel2-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 12.5 }
    ]
  },
  {
    id: "station-del-3",
    name: "Ather Grid - Select Citywalk Saket",
    address: "Select Citywalk Parking, Saket District Centre, New Delhi, Delhi 110017",
    latitude: 28.5289,
    longitude: 77.2188,
    operating_hours: "10:00 - 23:00",
    contact_number: "+91 76766 00900",
    chargers: [
      { id: "sdel3-c1", type: "Fast DC", connector: "CCS2", powerKW: 22, status: "Available", pricePerKWh: 18.0 }
    ]
  },
  {
    id: "station-mys-1",
    name: "Tata Power - Mall of Mysore",
    address: "Mall of Mysore Parking, Indiranagar, Mysore, Karnataka 570010",
    latitude: 12.3018,
    longitude: 76.6652,
    operating_hours: "10:00 - 22:00",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "smys1-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 18.0 },
      { id: "smys1-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 12.0 }
    ]
  },
  {
    id: "station-udp-1",
    name: "Zeon Charging - Robosoft Technologies",
    address: "Robosoft Campus, NH 66, Santhekatte, Udupi, Karnataka 576105",
    latitude: 13.3512,
    longitude: 74.7924,
    operating_hours: "24/7",
    contact_number: "+91 95000 36565",
    chargers: [
      { id: "sudp1-c1", type: "Fast DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 20.0 },
      { id: "sudp1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 14.5 }
    ]
  },
  {
    id: "station-goa-1",
    name: "Statiq Charging - Vivanta Goa Panaji",
    address: "Vivanta Goa, D. Bandodkar Marg, Panaji, Goa 403001",
    latitude: 15.4909,
    longitude: 73.8090,
    operating_hours: "24/7",
    contact_number: "+91 80 6902 4300",
    chargers: [
      { id: "sgoa1-c1", type: "Fast DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 21.0 },
      { id: "sgoa1-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 14.0 }
    ]
  },
  {
    id: "station-goa-2",
    name: "Tata Power - Margao Residency",
    address: "Margao Residency, Near KTC Bus Stand, Margao, Goa 403601",
    latitude: 15.2736,
    longitude: 73.9580,
    operating_hours: "24/7",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "sgoa2-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 19.5 }
    ]
  },
  {
    id: "station-koc-1",
    name: "Zeon Charging - Lulu International Mall",
    address: "Lulu Mall, Edappally, Kochi, Kerala 682024",
    latitude: 10.0261,
    longitude: 76.3080,
    operating_hours: "10:00 - 22:30",
    contact_number: "+91 95000 36565",
    chargers: [
      { id: "skoc1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 20.0 },
      { id: "skoc1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 14.0 }
    ]
  },
  {
    id: "station-hyd-1",
    name: "Jio-bp Pulse - Forum Sujana Mall",
    address: "Forum Sujana Mall, Kukatpally, Hyderabad, Telangana 500072",
    latitude: 17.4842,
    longitude: 78.3889,
    operating_hours: "24/7",
    contact_number: "+91 1800 891 9023",
    chargers: [
      { id: "shyd1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 20.0 },
      { id: "shyd1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 14.5 }
    ]
  },
  {
    id: "station-hyd-2",
    name: "Tata Power - Gachibowli Stadium",
    address: "Gachibowli Indoor Stadium Road, Hyderabad, Telangana 500032",
    latitude: 17.4430,
    longitude: 78.3444,
    operating_hours: "06:00 - 22:00",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "shyd2-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 18.0 }
    ]
  },
  {
    id: "station-chn-1",
    name: "Statiq Charging - Phoenix Marketcity",
    address: "Velachery Rd, Velachery, Chennai, Tamil Nadu 600042",
    latitude: 12.9912,
    longitude: 80.2170,
    operating_hours: "10:00 - 22:00",
    contact_number: "+91 80 6902 4300",
    chargers: [
      { id: "schn1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 50, status: "Available", pricePerKWh: 21.0 },
      { id: "schn1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 14.0 }
    ]
  },
  {
    id: "station-chn-2",
    name: "Tata Power - Express Avenue Mall",
    address: "Express Avenue, Royapettah, Chennai, Tamil Nadu 600002",
    latitude: 13.0588,
    longitude: 80.2641,
    operating_hours: "10:00 - 22:00",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "schn2-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 19.5 },
      { id: "schn2-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 13.0 }
    ]
  },
  {
    id: "station-pun-1",
    name: "Magenta ChargeGrid - Hinjewadi IT Park",
    address: "Phase 1, Hinjewadi, Pune, Maharashtra 411057",
    latitude: 18.5912,
    longitude: 73.7400,
    operating_hours: "24/7",
    contact_number: "+91 96196 05050",
    chargers: [
      { id: "spun1-c1", type: "Rapid DC", connector: "CCS2", powerKW: 50, status: "Available", pricePerKWh: 21.0 },
      { id: "spun1-c2", type: "Fast AC", connector: "Type 2", powerKW: 22, status: "Available", pricePerKWh: 14.0 }
    ]
  },
  {
    id: "station-pun-2",
    name: "Tata Power - Seasons Mall Hadapsar",
    address: "Magarpatta City, Hadapsar, Pune, Maharashtra 411013",
    latitude: 18.5195,
    longitude: 73.9312,
    operating_hours: "10:00 - 23:00",
    contact_number: "+91 1800 209 5161",
    chargers: [
      { id: "spun2-c1", type: "Fast DC", connector: "CCS2", powerKW: 30, status: "Available", pricePerKWh: 20.0 },
      { id: "spun2-c2", type: "Slow AC", connector: "Type 2", powerKW: 7.4, status: "Available", pricePerKWh: 13.5 }
    ]
  },
  {
    id: "station-hub-1",
    name: "Statiq Charging - Hotel Naveen",
    address: "Hotel Naveen, Unkal Lake, Hubli, Karnataka 580025",
    latitude: 15.3412,
    longitude: 75.1245,
    operating_hours: "24/7",
    contact_number: "+91 80 6902 4300",
    chargers: [
      { id: "shub1-c1", type: "Fast DC", connector: "CCS2", powerKW: 60, status: "Available", pricePerKWh: 19.5 }
    ]
  },
  {
    id: "station-cbe-1",
    name: "Zeon Charging - Fun Republic Mall",
    address: "Fun Republic Mall, Avinashi Rd, Coimbatore, Tamil Nadu 641004",
    latitude: 11.0021,
    longitude: 77.0112,
    operating_hours: "24/7",
    contact_number: "+91 95000 36565",
    chargers: [
      { id: "scbe1-c1", type: "Fast DC", connector: "CCS2", powerKW: 50, status: "Available", pricePerKWh: 20.0 }
    ]
  }
];

function initDatabase(targetDb) {
  return new Promise((resolve, reject) => {
    let shouldClose = false;
    let dbInstance = targetDb;

    if (!dbInstance) {
      shouldClose = true;
      dbInstance = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          return reject(err);
        }
      });
    }

    dbInstance.serialize(() => {
      // 1. Create Stations Table
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS stations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          operating_hours TEXT NOT NULL,
          contact_number TEXT NOT NULL,
          chargers_json TEXT NOT NULL
        )
      `, (err) => {
        if (err) console.error("Error creating stations table:", err.message);
      });

      // 2. Create Bookings Table
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          station_id TEXT NOT NULL,
          station_name TEXT NOT NULL,
          charger_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_email TEXT NOT NULL,
          user_phone TEXT NOT NULL,
          vehicle_model TEXT NOT NULL,
          vehicle_number TEXT NOT NULL,
          booking_date TEXT NOT NULL,
          time_slot TEXT NOT NULL,
          status TEXT DEFAULT 'Active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(station_id) REFERENCES stations(id)
        )
      `, (err) => {
        if (err) console.error("Error creating bookings table:", err.message);
      });

      // 3. Seed Stations if empty
      dbInstance.get("SELECT COUNT(*) as count FROM stations", [], (err, row) => {
        if (err) {
          console.error("Error checking stations count:", err.message);
          if (shouldClose) dbInstance.close();
          return reject(err);
        }

        if (!row || row.count === 0) {
          console.log("Seeding charging stations data...");
          const stmt = dbInstance.prepare(`
            INSERT INTO stations (id, name, address, latitude, longitude, operating_hours, contact_number, chargers_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stationsSeedData.forEach((station) => {
            stmt.run(
              station.id,
              station.name,
              station.address,
              station.latitude,
              station.longitude,
              station.operating_hours,
              station.contact_number,
              JSON.stringify(station.chargers)
            );
          });
          stmt.finalize((stmtErr) => {
            if (stmtErr) {
              if (shouldClose) dbInstance.close();
              return reject(stmtErr);
            }
            console.log("Seeding complete. Created " + stationsSeedData.length + " stations.");
            if (shouldClose) dbInstance.close();
            resolve(dbInstance);
          });
        } else {
          console.log("Database already has station records. Skipping seed.");
          if (shouldClose) dbInstance.close();
          resolve(dbInstance);
        }
      });
    });
  });
}

if (require.main === module) {
  initDatabase().then((db) => {
    console.log("Database initialization finished.");
    if (db && typeof db.close === 'function') {
      db.close();
    }
  }).catch((err) => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
}

module.exports = {
  initDatabase,
  stationsSeedData
};
