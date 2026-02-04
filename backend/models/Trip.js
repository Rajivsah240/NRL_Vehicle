const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required']
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  dropLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Requested', 'Accepted', 'Rejected', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Requested'
  },
  requestTime: {
    type: Date,
    default: Date.now
  },
  acceptTime: {
    type: Date,
    default: null
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },
  distance: {
    type: Number, // in kilometers
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
tripSchema.index({ employeeId: 1, createdAt: -1 });
tripSchema.index({ driverId: 1, createdAt: -1 });
tripSchema.index({ vehicleId: 1, createdAt: -1 });
tripSchema.index({ status: 1 });

// Calculate actual duration before saving if trip is completed
tripSchema.pre('save', function(next) {
  if (this.status === 'Completed' && this.startTime && this.endTime) {
    this.actualDuration = Math.round((this.endTime - this.startTime) / 60000); // Convert to minutes
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
