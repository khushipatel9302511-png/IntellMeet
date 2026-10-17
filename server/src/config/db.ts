import mongoose from 'mongoose';
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is missing');
    }
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[MongoDB] Connected successfully');
  } catch (error: any) {
    console.error('[MongoDB] Connection failed:', error.message);
    throw error;
  }
};