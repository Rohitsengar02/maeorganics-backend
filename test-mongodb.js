// Test script to verify MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoDBConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@')); // Hide password in logs

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      sslValidate: true,
      maxPoolSize: 50,
      family: 4
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);

    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log('✅ Available collections:', collections.map(c => c.collectionName));

    await mongoose.disconnect();
    console.log('✅ MongoDB connection test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);

    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Check username and password in MONGODB_URI');
      console.log('2. Verify database user permissions in MongoDB Atlas');
      console.log('3. Ensure IP whitelist includes your IP address');
    } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 SSL/TLS solutions:');
      console.log('1. Check if your MongoDB Atlas cluster supports SSL');
      console.log('2. Try disabling sslValidate temporarily: sslValidate: false');
      console.log('3. Check your network firewall settings');
    }

    process.exit(1);
  }
}

testMongoDBConnection();
