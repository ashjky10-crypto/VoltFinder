# VoltFinder - EV Charging Station Discovery & Booking System

VoltFinder is a modern, premium web application built to help Electric Vehicle (EV) drivers find charging stations in Bangalore, check live charger availability, and book time slots without double-booking.

---

## 🚀 Key Features

1. **Interactive OpenStreetMap**: Integrates Leaflet.js and OpenStreetMap (100% open-source & free, no API keys required) with custom-styled green/amber/red status pins.
2. **Visual Scheduler Grid**: Provides an interactive scheduling board. It queries the Express & SQLite backend to block out and lock already-booked slots (🔒) in real-time, preventing double booking at the UI level.
3. **Auto-Fill EV Profile**: Integrates a "Driver Settings" panel that saves vehicle configuration (e.g., Tata Nexon, registration plates) to the browser's `localStorage` and automatically pre-populates bookings.
4. **Live Status Ticker**: The Express backend runs a simulator that occasionally toggles chargers between "Available" and "Occupied". The frontend polls this status every 15 seconds, creating a "live" dynamic ecosystem.
5. **Success Micro-Animations**: A custom CSS battery-charging animation and checkmark pop-in trigger upon successful booking.
6. **API Collections**: Includes a pre-configured Postman JSON Collection for immediate endpoint testing and validation.

---

## 🛠️ Tech Stack

*   **Frontend**: Vanilla HTML5, Modern CSS3 (Grid, Flexbox, variables, glassmorphism), Vanilla JavaScript (ES6+ modular structure, native fetch).
*   **Backend**: Node.js, Express.
*   **Database**: SQLite (`database.sqlite` file managed via parameter-bound raw SQL queries).
*   **APIs Testing**: Postman Collection (VS Code Extension).

---

## 📂 Project Structure

```text
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js       # SQLite connection and promise wrapper
│   │   │   └── db-init.js          # DB tables setup and seed mock stations
│   │   └── routes/
│   │       ├── bookings.js         # REST endpoints for CRUD bookings and check availability
│   │       └── stations.js         # REST endpoints for fetching & filtering stations
│   ├── database.sqlite             # Generated SQLite database file
│   ├── ev_booking_postman_collection.json # Ready-to-import Postman test collection
│   ├── package.json
│   └── server.js                   # Express server entry point & live simulator
└── frontend/
    ├── css/
    │   └── style.css               # Design system, glassmorphism cards, charging animation
    ├── js/
    │   ├── components/
    │   │   ├── bookingCard.js      # Booking card renderer for dashboard
    │   │   ├── bookingModal.js     # Form validator & hourly scheduler grid
    │   │   ├── profileModal.js     # localstorage user profile settings manager
    │   │   ├── stationCard.js      # Sidebar list card component
    │   │   └── stationDetails.js   # Side detail drawer & Google Maps deep link
    │   └── app.js                  # Main JS coordinator (Leaflet initialization, polling)
    └── index.html                  # Core HTML structure & Leaflet script CDNs
```

---

## ⚙️ How to Run & Test

The project has been fully configured and seeded. Follow these simple steps:

### 1. Start the Server
Navigate to the `backend/` directory in your terminal and start the Express server:
```bash
cd backend
npm install   # Already installed
npm start     # Starts server on http://localhost:5000
```

### 2. View the Web App
Open your browser and navigate to:
**[http://localhost:5000](http://localhost:5000)**

*The Express server automatically serves the `frontend/` directory static files on the root port!*

### 3. API Testing in VS Code (Postman)
1. Install the official **Postman** extension in VS Code.
2. Click the Postman astronaut icon on the left bar and sign in.
3. Hover over the **Collections** panel, click **Import** (or `+` -> Import), and select the file:
   `backend/ev_booking_postman_collection.json`
4. Expand the collection to test GET, POST (Bookings), PUT (Update), and DELETE (Cancel) endpoints.
5. *Note: The POST booking request contains a test script that automatically saves the returned booking ID as a collection variable, so you can test GET details, Update, and Cancel immediately without copying/pasting IDs!*
