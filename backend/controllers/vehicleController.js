const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Get all vehicles (filtered by department for employees)
exports.getVehicles = async (req, res) => {
  try {
    const { department } = req.query;
    let query = { isActive: true };

    // If user is employee or admin, filter by department
    if (req.user.role === 'employee' || req.user.role === 'admin') {
      query.department = req.user.department;
    } else if (department) {
      // Driver can filter by department
      query.department = department;
    }

    const vehicles = await Vehicle.find(query)
      .populate('currentDriver', 'name phone')
      .sort('-lastUpdated');

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single vehicle
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('currentDriver', 'name phone email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if employee or admin can access this vehicle (same department)
    if ((req.user.role === 'employee' || req.user.role === 'admin') && vehicle.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this vehicle'
      });
    }

    res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create vehicle (Admin only - for now open)
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
      success: true,
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vehicle location (Driver only)
exports.updateVehicleLocation = async (req, res) => {
  try {
    const { vehicleId, latitude, longitude, address } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if current user is the driver of this vehicle
    if (!vehicle.currentDriver || vehicle.currentDriver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle location'
      });
    }

    vehicle.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address: address || vehicle.location.address
    };

    await vehicle.save();

    res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vehicle status (Driver only)
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { vehicleId, status } = req.body;

    // Drivers can only set Available, Busy, or In Transit
    // 'Not Available' is admin-controlled only
    const allowedDriverStatuses = ['Available', 'Busy', 'In Transit'];
    if (!allowedDriverStatuses.includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'You can only set status to Available, Busy, or In Transit. "Not Available" is controlled by admin.'
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if vehicle is marked as 'Not Available' by admin
    if (vehicle.status === 'Not Available') {
      return res.status(403).json({
        success: false,
        message: 'This vehicle is marked as Not Available by admin. Please contact your department admin.'
      });
    }

    // Check if current user is the driver of this vehicle
    if (!vehicle.currentDriver || vehicle.currentDriver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle status'
      });
    }

    vehicle.status = status;
    await vehicle.save();

    res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign vehicle to driver
exports.assignVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    // Check if driver already has a vehicle assigned
    const existingAssignment = await Vehicle.findOne({
      currentDriver: req.user.id,
      isActive: true
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'You already have a vehicle assigned. Please unassign first.'
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.currentDriver) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already assigned to another driver'
      });
    }

    vehicle.currentDriver = req.user.id;
    vehicle.status = 'Available';
    await vehicle.save();

    const updatedVehicle = await Vehicle.findById(vehicleId)
      .populate('currentDriver', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Vehicle assigned successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unassign vehicle from driver
exports.unassignVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if current user is the driver of this vehicle
    if (!vehicle.currentDriver || vehicle.currentDriver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unassign this vehicle'
      });
    }

    vehicle.currentDriver = null;
    // Set to 'Available' when driver releases - 'Not Available' is admin-controlled only
    vehicle.status = 'Available';
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle unassigned successfully',
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get driver's assigned vehicle
exports.getDriverVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      currentDriver: req.user.id,
      isActive: true
    }).populate('currentDriver', 'name phone');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle assigned to you'
      });
    }

    res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin update vehicle status (Admin only)
exports.adminUpdateVehicleStatus = async (req, res) => {
  try {
    const { vehicleId, status } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if admin belongs to the same department as the vehicle
    if (vehicle.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage vehicles in your department'
      });
    }

    // Admin can set any status including 'Not Available'
    const allowedStatuses = ['Available', 'Busy', 'In Transit', 'Not Available'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    vehicle.status = status;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: `Vehicle status updated to ${status}`,
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin update vehicle details (Admin only)
exports.adminUpdateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const updates = req.body;

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if admin belongs to the same department as the vehicle
    if (vehicle.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage vehicles in your department'
      });
    }

    // Update allowed fields
    const allowedFields = ['vehicleNumber', 'vehicleType', 'capacity', 'status', 'isActive'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        vehicle[field] = updates[field];
      }
    });

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get department statistics (Admin only)
exports.getDepartmentStats = async (req, res) => {
  try {
    const department = req.user.department;

    const vehicles = await Vehicle.find({ department, isActive: true })
      .populate('currentDriver', 'name phone');

    const stats = {
      totalVehicles: vehicles.length,
      available: vehicles.filter(v => v.status === 'Available').length,
      busy: vehicles.filter(v => v.status === 'Busy').length,
      inTransit: vehicles.filter(v => v.status === 'In Transit').length,
      notAvailable: vehicles.filter(v => v.status === 'Not Available').length,
      withDriver: vehicles.filter(v => v.currentDriver).length,
      withoutDriver: vehicles.filter(v => !v.currentDriver).length
    };

    res.status(200).json({
      success: true,
      stats,
      vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
