const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['Sedan', 'SUV', 'Van', 'Bus', 'Pickup Truck'],
    required: [true, 'Vehicle type is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Mechanical Maintenance',
      'Civil Maintenance',
      'Electrical Maintenance',
      'Instrumentation',
      'Production',
      'Safety',
      'HR',
      'Admin',
      'Finance'
    ]
  },
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['Available', 'Busy', 'In Transit', 'Not Available'],
    default: 'Not Available'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      // Default: NRL Refinery coordinates (Numaligarh, Assam)
      default: [93.8457, 26.7557]
    },
    address: {
      type: String,
      default: 'NRL Refinery, Numaligarh, Assam'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  capacity: {
    type: Number,
    default: 4
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index
vehicleSchema.index({ location: '2dsphere' });

// Update lastUpdated on location change
vehicleSchema.pre('save', function(next) {
  if (this.isModified('location')) {
    this.lastUpdated = Date.now();
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
