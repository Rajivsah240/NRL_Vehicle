const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const { getIO, getUserSockets } = require('../socket/socketHandler');

// @desc    Create trip request (Employee only)
exports.createTripRequest = async (req, res) => {
  try {
    const {
      vehicleId,
      pickupLocation,
      dropLocation,
      reason
    } = req.body;

    // Validate vehicle exists and is available
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if employee's department matches vehicle's department
    if (req.user.role === 'employee' && vehicle.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'You can only request vehicles from your department'
      });
    }

    if (vehicle.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Vehicle is currently ${vehicle.status.toLowerCase()}`
      });
    }

    if (!vehicle.currentDriver) {
      return res.status(400).json({
        success: false,
        message: 'No driver assigned to this vehicle'
      });
    }

    // Create trip
    const trip = await Trip.create({
      employeeId: req.user.id,
      driverId: vehicle.currentDriver,
      vehicleId: vehicleId,
      pickupLocation,
      dropLocation,
      reason: reason || '',
      status: 'Requested'
    });

    // Update vehicle status
    vehicle.status = 'Busy';
    await vehicle.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType');

    // Emit socket event to driver (server-side for reliability)
    try {
      const io = getIO();
      const userSockets = getUserSockets();
      const driverId = vehicle.currentDriver.toString();
      
      console.log('Server emitting new_trip_request to driver:', driverId);
      console.log('Available user sockets:', Array.from(userSockets.keys()));
      
      const tripData = {
        tripId: trip._id,
        driverId: driverId,
        employeeId: req.user.id,
        employeeName: req.user.name,
        vehicleNumber: populatedTrip.vehicleId?.vehicleNumber,
        pickupLocation: pickupLocation.address,
        dropLocation: dropLocation.address,
        department: req.user.department
      };

      const driverSocketId = userSockets.get(driverId);
      if (driverSocketId) {
        io.to(driverSocketId).emit('new_trip_request', tripData);
        console.log('Trip request sent to specific driver socket:', driverSocketId);
      } else {
        // Fallback: broadcast to all drivers room
        io.to('drivers').emit('new_trip_request', tripData);
        console.log('Trip request broadcast to drivers room');
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
      // Don't fail the request if socket emit fails
    }

    res.status(201).json({
      success: true,
      message: 'Trip request sent to driver',
      trip: populatedTrip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trips for employee
exports.getEmployeeTrips = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { employeeId: req.user.id };

    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query)
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trips for driver
exports.getDriverTrips = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { driverId: req.user.id };

    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query)
      .populate('employeeId', 'name phone department')
      .populate('vehicleId', 'vehicleNumber vehicleType')
      .populate('driverId', 'name phone')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trips for a specific vehicle
exports.getVehicleTrips = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status } = req.query;
    
    let query = { vehicleId };

    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single trip
exports.getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType department');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (
      trip.employeeId._id.toString() !== req.user.id &&
      (trip.driverId && trip.driverId._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this trip'
      });
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept trip (Driver only)
exports.acceptTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this trip'
      });
    }

    if (trip.status !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept trip with status: ${trip.status}`
      });
    }

    trip.status = 'Accepted';
    trip.acceptTime = Date.now();
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType');

    res.status(200).json({
      success: true,
      message: 'Trip accepted',
      trip: populatedTrip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject trip (Driver only)
exports.rejectTrip = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this trip'
      });
    }

    if (trip.status !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject trip with status: ${trip.status}`
      });
    }

    trip.status = 'Rejected';
    trip.rejectionReason = rejectionReason || 'Not specified';
    await trip.save();

    // Update vehicle status back to available
    await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'Available' });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType');

    res.status(200).json({
      success: true,
      message: 'Trip rejected',
      trip: populatedTrip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start trip (Driver only)
exports.startTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this trip'
      });
    }

    if (trip.status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: `Cannot start trip with status: ${trip.status}`
      });
    }

    trip.status = 'In Progress';
    trip.startTime = Date.now();
    await trip.save();

    // Update vehicle status and location to pickup point
    await Vehicle.findByIdAndUpdate(trip.vehicleId, { 
      status: 'In Transit',
      location: {
        type: 'Point',
        coordinates: trip.pickupLocation.coordinates || [0, 0],
        address: trip.pickupLocation.address || ''
      }
    });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType');

    res.status(200).json({
      success: true,
      message: 'Trip started',
      trip: populatedTrip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete trip (Driver only)
exports.completeTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this trip'
      });
    }

    if (trip.status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete trip with status: ${trip.status}`
      });
    }

    trip.status = 'Completed';
    trip.endTime = Date.now();
    await trip.save();

    // Update vehicle status to available and location to drop point
    await Vehicle.findByIdAndUpdate(trip.vehicleId, { 
      status: 'Available',
      location: {
        type: 'Point',
        coordinates: trip.dropLocation.coordinates || [0, 0],
        address: trip.dropLocation.address || ''
      }
    });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType');

    res.status(200).json({
      success: true,
      message: 'Trip completed',
      trip: populatedTrip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel trip (Employee only)
exports.cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.employeeId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this trip'
      });
    }

    if (!['Requested', 'Accepted'].includes(trip.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel trip with status: ${trip.status}`
      });
    }

    trip.status = 'Cancelled';
    await trip.save();

    // Update vehicle status back to available
    await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'Available' });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('employeeId', 'name phone department')
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber vehicleType');

    res.status(200).json({
      success: true,
      message: 'Trip cancelled',
      trip: populatedTrip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
