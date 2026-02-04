const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/trips
// @desc    Create trip request
// @access  Private - Employee only
router.post('/', authorize('employee'), tripController.createTripRequest);

// @route   GET /api/trips/employee/my-trips
// @desc    Get trips for employee
// @access  Private - Employee only
router.get('/employee/my-trips', authorize('employee'), tripController.getEmployeeTrips);

// @route   GET /api/trips/driver/my-trips
// @desc    Get trips for driver
// @access  Private - Driver only
router.get('/driver/my-trips', authorize('driver'), tripController.getDriverTrips);

// @route   GET /api/trips/vehicle/:vehicleId
// @desc    Get trips for a specific vehicle
// @access  Private - Driver only
router.get('/vehicle/:vehicleId', authorize('driver'), tripController.getVehicleTrips);

// @route   GET /api/trips/:id
// @desc    Get single trip
// @access  Private
router.get('/:id', tripController.getTrip);

// @route   PUT /api/trips/:id/accept
// @desc    Accept trip
// @access  Private - Driver only
router.put('/:id/accept', authorize('driver'), tripController.acceptTrip);

// @route   PUT /api/trips/:id/reject
// @desc    Reject trip
// @access  Private - Driver only
router.put('/:id/reject', authorize('driver'), tripController.rejectTrip);

// @route   PUT /api/trips/:id/start
// @desc    Start trip
// @access  Private - Driver only
router.put('/:id/start', authorize('driver'), tripController.startTrip);

// @route   PUT /api/trips/:id/complete
// @desc    Complete trip
// @access  Private - Driver only
router.put('/:id/complete', authorize('driver'), tripController.completeTrip);

// @route   PUT /api/trips/:id/cancel
// @desc    Cancel trip
// @access  Private - Employee only
router.put('/:id/cancel', authorize('employee'), tripController.cancelTrip);

module.exports = router;
