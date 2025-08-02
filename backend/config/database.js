const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicflow';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain a minimum of 5 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📱 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Function to create indexes
const createIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes...');
    
    // Import models to ensure indexes are created
    require('../models/User');
    require('../models/Issue');
    require('../models/StatusLog');
    require('../models/Flag');

    // Wait for indexes to be built
    await mongoose.connection.db.admin().command({ listIndexes: 'users' });
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
};

// Function to seed initial admin user
const seedAdminUser = async () => {
  try {
    const User = require('../models/User');
    
    // Check if admin user already exists
    const adminExists = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@civicflow.com' 
    });

    if (!adminExists) {
      const adminUser = new User({
        name: 'System Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@civicflow.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Default admin user created');
      console.log(`📧 Admin email: ${adminUser.email}`);
      console.log('🔑 Please change the default password after first login');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// Function to check database health
const checkDatabaseHealth = async () => {
  try {
    // Simple ping to check connection
    await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
};

// Function to get database statistics
const getDatabaseStats = async () => {
  try {
    const User = require('../models/User');
    const Issue = require('../models/Issue');
    const StatusLog = require('../models/StatusLog');
    const Flag = require('../models/Flag');

    const [userCount, issueCount, statusLogCount, flagCount] = await Promise.all([
      User.countDocuments(),
      Issue.countDocuments(),
      StatusLog.countDocuments(),
      Flag.countDocuments()
    ]);

    return {
      collections: {
        users: userCount,
        issues: issueCount,
        statusLogs: statusLogCount,
        flags: flagCount
      },
      totalDocuments: userCount + issueCount + statusLogCount + flagCount
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

module.exports = {
  connectDatabase,
  createIndexes,
  seedAdminUser,
  checkDatabaseHealth,
  getDatabaseStats
};