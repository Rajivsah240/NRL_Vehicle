#!/usr/bin/env node

/**
 * Database Initialization Script
 * Creates fresh database with proper schema and indexes
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Trip = require('./models/Trip');

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    const dbName = mongoose.connection.db?.getName?.() || 'nrl_vehicle_dispatch';
    console.log(`📊 Database: ${dbName}`);

    // Drop existing collections
    console.log('\n🗑️  Dropping existing collections...');
    const collections = ['users', 'vehicles', 'trips'];
    for (const collection of collections) {
      try {
        await mongoose.connection.db.dropCollection(collection);
        console.log(`   ✅ Dropped ${collection} collection`);
      } catch (err) {
        if (err.code !== 26) { // 26 = collection not found
          throw err;
        }
      }
    }

    // Create collections with indexes
    console.log('\n📝 Collections and indexes ready...');

    // Create test users
    console.log('\n👥 Creating test users...');
    const testUsers = [
      // Admins for all departments
      {
        name: 'Admin - Mechanical Maintenance',
        email: 'admin.mm@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Mechanical Maintenance',
        phone: '9876540001'
      },
      {
        name: 'Admin - Civil Maintenance',
        email: 'admin.civil@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Civil Maintenance',
        phone: '9876540002'
      },
      {
        name: 'Admin - Electrical Maintenance',
        email: 'admin.electrical@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Electrical Maintenance',
        phone: '9876540003'
      },
      {
        name: 'Admin - Instrumentation',
        email: 'admin.instrumentation@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Instrumentation',
        phone: '9876540004'
      },
      {
        name: 'Admin - Production',
        email: 'admin.production@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Production',
        phone: '9876540005'
      },
      {
        name: 'Admin - Safety',
        email: 'admin.safety@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Safety',
        phone: '9876540006'
      },
      {
        name: 'Admin - HR',
        email: 'admin.hr@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'HR',
        phone: '9876540007'
      },
      {
        name: 'Admin - Admin Department',
        email: 'admin.admin@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Admin',
        phone: '9876540008'
      },
      {
        name: 'Admin - Finance',
        email: 'admin.finance@nrl.co.in',
        password: 'admin123',
        role: 'admin',
        department: 'Finance',
        phone: '9876540009'
      },
      // Test Employees
      {
        name: 'Test Employee',
        email: 'employee@nrl.co.in',
        password: 'password123',
        role: 'employee',
        department: 'Admin',
        phone: '9876543210'
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@nrl.co.in',
        password: 'password123',
        role: 'employee',
        department: 'Mechanical Maintenance',
        phone: '9876543211'
      },
      // Test Drivers
      {
        name: 'Test Driver',
        email: 'driver@nrl.co.in',
        password: 'password123',
        role: 'driver',
        phone: '9876543220'
      },
      {
        name: 'Ramesh Nath',
        email: 'ramesh@nrl.co.in',
        password: 'password123',
        role: 'driver',
        phone: '9876543221'
      }
    ];

    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`   ✅ Created ${userData.role}: ${userData.email}`);
    }

    // Create test vehicles
    console.log('\n🚗 Creating test vehicles...');
    const testVehicles = [
      {
        vehicleNumber: 'NRL-MM-001',
        vehicleType: 'Sedan',
        department: 'Admin',
        status: 'Available',
        capacity: 4,
        location: {
          type: 'Point',
          coordinates: [93.7822, 26.5743],
          address: 'Main Gate'
        }
      },
      {
        vehicleNumber: 'NRL-MM-002',
        vehicleType: 'SUV',
        department: 'Mechanical Maintenance',
        status: 'Available',
        capacity: 5,
        location: {
          type: 'Point',
          coordinates: [93.7848, 26.5759],
          address: 'Admin Block'
        }
      },
      {
        vehicleNumber: 'NRL-CIVIL-001',
        vehicleType: 'Van',
        department: 'Civil Maintenance',
        status: 'Available',
        capacity: 3,
        location: {
          type: 'Point',
          coordinates: [93.7976, 26.5766],
          address: 'Workshop Area'
        }
      }
    ];

    for (const vehicleData of testVehicles) {
      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();
      console.log(`   ✅ Created vehicle: ${vehicleData.vehicleNumber}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE INITIALIZATION COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📌 Test Credentials:');
    console.log('   Employee: employee@nrl.co.in / password123');
    console.log('   Driver: driver@nrl.co.in / password123');
    console.log('\n📊 Database: nrl_vehicle_dispatch');
    console.log('📍 MongoDB Atlas Collection');
    console.log('\n✨ Ready to use! Start the application with:');
    console.log('   Backend: npm run dev (in backend folder)');
    console.log('   Frontend: npm start (in frontend folder)');
    console.log('='.repeat(50) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

initializeDatabase();
