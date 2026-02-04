const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/vehicles
// @desc    Get all vehicles (filtered by department for employees)
// @access  Private
router.get('/', vehicleController.getVehicles);

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle
// @access  Private
router.get('/:id', vehicleController.getVehicle);

// @route   POST /api/vehicles
// @desc    Create vehicle (Admin - for now open to all)
// @access  Private
router.post('/', vehicleController.createVehicle);

// @route   PUT /api/vehicles/location
// @desc    Update vehicle location
// @access  Private - Driver only
router.put('/location', authorize('driver'), vehicleController.updateVehicleLocation);

// @route   PUT /api/vehicles/status
// @desc    Update vehicle status
// @access  Private - Driver only
router.put('/status', authorize('driver'), vehicleController.updateVehicleStatus);

// @route   POST /api/vehicles/assign
// @desc    Assign vehicle to driver
// @access  Private - Driver only
router.post('/assign', authorize('driver'), vehicleController.assignVehicle);

// @route   POST /api/vehicles/unassign
// @desc    Unassign vehicle from driver
// @access  Private - Driver only
router.post('/unassign', authorize('driver'), vehicleController.unassignVehicle);

// @route   GET /api/vehicles/driver/my-vehicle
// @desc    Get driver's assigned vehicle
// @access  Private - Driver only
router.get('/driver/my-vehicle', authorize('driver'), vehicleController.getDriverVehicle);

// @route   GET /api/vehicles/admin/department-stats
// @desc    Get department vehicle statistics
// @access  Private - Admin only
router.get('/admin/department-stats', authorize('admin'), vehicleController.getDepartmentStats);

// @route   PUT /api/vehicles/admin/status
// @desc    Update vehicle status (Admin can set any status)
// @access  Private - Admin only
router.put('/admin/status', authorize('admin'), vehicleController.adminUpdateVehicleStatus);

// @route   PUT /api/vehicles/admin/:vehicleId
// @desc    Update vehicle details
// @access  Private - Admin only
router.put('/admin/:vehicleId', authorize('admin'), vehicleController.adminUpdateVehicle);

module.exports = router;
