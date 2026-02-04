const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const userSockets = new Map(); // Map of userId -> socketId

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userDepartment = user.department;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);
    
    // Store user socket mapping
    userSockets.set(socket.userId, socket.id);

    // Join department room for employees and admins
    if ((socket.userRole === 'employee' || socket.userRole === 'admin') && socket.userDepartment) {
      socket.join(`department:${socket.userDepartment}`);
      console.log(`${socket.userRole} joined department room: ${socket.userDepartment}`);
    }

    // Join driver room
    if (socket.userRole === 'driver') {
      socket.join('drivers');
      console.log('Driver joined drivers room');
    }

    // Handle vehicle location updates from driver
    socket.on('update_vehicle_location', (data) => {
      console.log('Vehicle location update:', data);
      
      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('vehicle_location_updated', data);
      }
    });

    // Handle vehicle assignment
    socket.on('vehicle_assigned', (data) => {
      console.log('Vehicle assigned:', data);
      
      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('vehicle_driver_updated', {
          vehicleId: data.vehicleId,
          currentDriver: {
            _id: data.driverId,
            name: data.driverName,
            phone: data.driverPhone
          }
        });
      }
    });

    // Handle vehicle unassignment
    socket.on('vehicle_unassigned', (data) => {
      console.log('Vehicle unassigned:', data);
      
      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('vehicle_driver_updated', {
          vehicleId: data.vehicleId,
          currentDriver: null
        });
      }
    });

    // Handle trip request from employee
    socket.on('send_trip_request', (data) => {
      console.log('Trip request received:', data);
      console.log('Looking for driver socket. Driver ID:', data.driverId);
      console.log('Available user sockets:', Array.from(userSockets.keys()));
      
      // Send to specific driver
      if (data.driverId) {
        const driverSocketId = userSockets.get(data.driverId);
        console.log('Driver socket ID found:', driverSocketId);
        
        if (driverSocketId) {
          io.to(driverSocketId).emit('new_trip_request', data);
          console.log(`Trip request sent to driver: ${data.driverId}`);
        } else {
          // Fallback: broadcast to all drivers
          console.log('Driver socket not found, broadcasting to drivers room');
          io.to('drivers').emit('new_trip_request', data);
        }
      }
    });

    // Handle trip acceptance from driver
    socket.on('driver_accept', (data) => {
      console.log('Driver accepted trip:', data);
      
      // Send to employee
      const employeeSocketId = userSockets.get(data.employeeId);
      if (employeeSocketId) {
        io.to(employeeSocketId).emit('trip_accepted', data);
      }

      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('trip_status_updated', {
          tripId: data.tripId,
          status: 'Accepted'
        });
      }
    });

    // Handle trip rejection from driver
    socket.on('driver_reject', (data) => {
      console.log('Driver rejected trip:', data);
      
      // Send to employee
      const employeeSocketId = userSockets.get(data.employeeId);
      if (employeeSocketId) {
        io.to(employeeSocketId).emit('trip_rejected', data);
      }

      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('trip_status_updated', {
          tripId: data.tripId,
          status: 'Rejected',
          reason: data.rejectionReason
        });
      }
    });

    // Handle trip start from driver
    socket.on('trip_started', (data) => {
      console.log('Trip started:', data);
      
      // Send to employee
      const employeeSocketId = userSockets.get(data.employeeId);
      if (employeeSocketId) {
        io.to(employeeSocketId).emit('trip_started', data);
      }

      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('trip_status_updated', {
          tripId: data.tripId,
          status: 'In Progress'
        });
      }
    });

    // Handle trip completion from driver
    socket.on('trip_completed', (data) => {
      console.log('Trip completed:', data);
      
      // Send to employee
      const employeeSocketId = userSockets.get(data.employeeId);
      if (employeeSocketId) {
        io.to(employeeSocketId).emit('trip_completed', data);
      }

      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('trip_status_updated', {
          tripId: data.tripId,
          status: 'Completed'
        });
      }
    });

    // Handle vehicle status updates from driver
    socket.on('update_vehicle_status', (data) => {
      console.log('Vehicle status update:', data);
      
      // Broadcast to department
      if (data.department) {
        io.to(`department:${data.department}`).emit('vehicle_status_updated', data);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      userSockets.delete(socket.userId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const getUserSockets = () => {
  return userSockets;
};

const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

const emitToDepartment = (department, event, data) => {
  if (io) {
    io.to(`department:${department}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  getUserSockets,
  emitToUser,
  emitToDepartment
};
