const axios = require('./backend/node_modules/axios');

const API_URL = 'http://localhost:5000/api';

// Test users to create
const users = [
  {
    name: 'Test Employee',
    email: 'employee@nrl.co.in',
    password: 'password123',
    role: 'employee',
    department: 'Admin',
    phone: '9876543210'
  },
  {
    name: 'Test Driver',
    email: 'driver@nrl.co.in',
    password: 'password123',
    role: 'driver',
    phone: '9876543220'
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@nrl.co.in',
    password: 'password123',
    role: 'employee',
    department: 'Mechanical Maintenance',
    phone: '9876543211'
  },
  {
    name: 'Ramesh Nath',
    email: 'ramesh@nrl.co.in',
    password: 'password123',
    role: 'driver',
    phone: '9876543221'
  }
];

async function createUsers() {
  console.log('Creating test users...\n');
  
  for (const user of users) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, user);
      console.log(`✅ Created ${user.role}: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${response.data.data.user._id}\n`);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log(`⚠️  ${user.email} already exists\n`);
      } else {
        console.log(`❌ Error creating ${user.email}:`);
        console.log(`   ${error.response?.data?.message || error.message}\n`);
      }
    }
  }
  
  console.log('\n✅ Test user creation completed!');
  console.log('\nYou can now login with:');
  console.log('  Employee: employee@nrl.co.in / password123');
  console.log('  Driver: driver@nrl.co.in / password123');
}

createUsers();
