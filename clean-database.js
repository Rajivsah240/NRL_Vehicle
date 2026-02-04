const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: './backend/.env' });

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Drop the users collection to remove old indexes
    await mongoose.connection.db.dropCollection('users').catch(() => {
      console.log('Users collection does not exist, creating fresh...');
    });
    
    console.log('✅ Database cleaned successfully!');
    console.log('\nNow run: node create-test-users.js');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
