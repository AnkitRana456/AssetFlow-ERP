import mongoose from 'mongoose';

/**
 * Initialize MongoDB connection pool.
 */
export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow';

  try {
    // Set Mongoose debugging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      autoIndex: true, // Auto-build indexes in dev (can be disabled in production)
    });

    console.log('✅ Connected to MongoDB database successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB active connection error:', err);
});
