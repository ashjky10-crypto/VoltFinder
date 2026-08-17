const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

// Helper to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper to validate 10-digit phone format
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// @route   GET /api/bookings
// @desc    Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await db.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve bookings.'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get a single booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Booking with ID '${req.params.id}' does not exist.`
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error(`Error fetching booking ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve booking details.'
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      stationId,
      chargerId,
      userName,
      userEmail,
      userPhone,
      vehicleModel,
      vehicleNumber,
      date,
      timeSlot
    } = req.body;

    // 1. Validation
    if (!stationId || !chargerId || !userName || !userEmail || !userPhone || !vehicleModel || !vehicleNumber || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'All fields are required to make a booking.'
      });
    }

    if (!isValidEmail(userEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide a valid email address.'
      });
    }

    if (!isValidPhone(userPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide a valid 10-digit phone number.'
      });
    }

    // 2. Check if station exists
    const station = await db.get('SELECT * FROM stations WHERE id = ?', [stationId]);
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Station with ID '${stationId}' does not exist.`
      });
    }

    const chargers = JSON.parse(station.chargers_json);
    const charger = chargers.find(c => c.id === chargerId);

    // 3. Check if charger exists
    if (!charger) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Charger with ID '${chargerId}' does not exist at station '${station.name}'.`
      });
    }

    // 4. Check if charger is under maintenance
    if (charger.status === 'Maintenance') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'This charger is currently under maintenance and cannot be booked.'
      });
    }

    // 5. Conflict Check: Check if charger is already booked for this date and time slot
    const conflictSql = `
      SELECT * FROM bookings 
      WHERE station_id = ? 
        AND charger_id = ? 
        AND booking_date = ? 
        AND time_slot = ? 
        AND status != 'Cancelled'
    `;
    const conflict = await db.get(conflictSql, [stationId, chargerId, date, timeSlot]);
    
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'This charger is already booked for the selected date and time slot.'
      });
    }

    // 6. Insert new booking
    const bookingId = uuidv4();
    const insertSql = `
      INSERT INTO bookings (id, station_id, station_name, charger_id, user_name, user_email, user_phone, vehicle_model, vehicle_number, booking_date, time_slot, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `;
    
    await db.run(insertSql, [
      bookingId,
      stationId,
      station.name,
      chargerId,
      userName,
      userEmail,
      userPhone,
      vehicleModel,
      vehicleNumber,
      date,
      timeSlot
    ]);

    // Retrieve the created booking to return it
    const newBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: newBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to create booking due to a database error.'
    });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update an existing booking
router.put('/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const {
      userName,
      userEmail,
      userPhone,
      vehicleModel,
      vehicleNumber,
      date,
      timeSlot
    } = req.body;

    // 1. Check if booking exists
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Booking with ID '${bookingId}' does not exist.`
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot update a cancelled booking.'
      });
    }

    // 2. Validate fields if present
    if (userEmail && !isValidEmail(userEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide a valid email address.'
      });
    }

    if (userPhone && !isValidPhone(userPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide a valid 10-digit phone number.'
      });
    }

    // 3. Conflict Check if Date or TimeSlot is changing
    const newDate = date || booking.booking_date;
    const newTimeSlot = timeSlot || booking.time_slot;
    
    if (newDate !== booking.booking_date || newTimeSlot !== booking.time_slot) {
      const conflictSql = `
        SELECT * FROM bookings 
        WHERE station_id = ? 
          AND charger_id = ? 
          AND booking_date = ? 
          AND time_slot = ? 
          AND id != ? 
          AND status != 'Cancelled'
      `;
      const conflict = await db.get(conflictSql, [
        booking.station_id,
        booking.charger_id,
        newDate,
        newTimeSlot,
        bookingId
      ]);

      if (conflict) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'The selected charger is already booked by another user for this date and time slot.'
        });
      }
    }

    // 4. Update fields
    const updatedFields = {
      user_name: userName || booking.user_name,
      user_email: userEmail || booking.user_email,
      user_phone: userPhone || booking.user_phone,
      vehicle_model: vehicleModel || booking.vehicle_model,
      vehicle_number: vehicleNumber || booking.vehicle_number,
      booking_date: newDate,
      time_slot: newTimeSlot
    };

    const updateSql = `
      UPDATE bookings 
      SET user_name = ?, user_email = ?, user_phone = ?, vehicle_model = ?, vehicle_number = ?, booking_date = ?, time_slot = ?
      WHERE id = ?
    `;

    await db.run(updateSql, [
      updatedFields.user_name,
      updatedFields.user_email,
      updatedFields.user_phone,
      updatedFields.vehicle_model,
      updatedFields.vehicle_number,
      updatedFields.booking_date,
      updatedFields.time_slot,
      bookingId
    ]);

    const updatedBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);

    res.json({
      success: true,
      message: 'Booking updated successfully.',
      data: updatedBooking
    });
  } catch (error) {
    console.error(`Error updating booking ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to update booking details.'
    });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking (soft delete/status update)
router.delete('/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Check if booking exists
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Booking with ID '${bookingId}' does not exist.`
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'This booking is already cancelled.'
      });
    }

    // Update status to 'Cancelled'
    await db.run("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [bookingId]);

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: { id: bookingId, status: 'Cancelled' }
    });
  } catch (error) {
    console.error(`Error cancelling booking ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to cancel the booking.'
    });
  }
});

// @route   GET /api/bookings/check-availability
// @desc    Get booked time slots for a specific charger and date (used for frontend time-slot grid locking)
router.get('/check/availability', async (req, res) => {
  try {
    const { stationId, chargerId, date } = req.query;

    if (!stationId || !chargerId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'stationId, chargerId, and date query parameters are required.'
      });
    }

    const sql = `
      SELECT time_slot FROM bookings 
      WHERE station_id = ? AND charger_id = ? AND booking_date = ? AND status != 'Cancelled'
    `;
    const bookings = await db.query(sql, [stationId, chargerId, date]);
    const bookedSlots = bookings.map(b => b.time_slot);

    res.json({
      success: true,
      date,
      stationId,
      chargerId,
      bookedSlots
    });
  } catch (error) {
    console.error('Error checking slot availability:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to check slot availability.'
    });
  }
});

module.exports = router;
