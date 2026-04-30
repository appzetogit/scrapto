import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dropIndex = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scrapto';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('chats');

    console.log('Current indexes:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    const orderIdIndex = indexes.find(idx => idx.name === 'orderId_1');
    if (orderIdIndex && orderIdIndex.unique) {
      console.log('Found unique orderId_1 index. Dropping it...');
      await collection.dropIndex('orderId_1');
      console.log('Index dropped successfully');
    } else {
      console.log('No unique orderId_1 index found or it is not unique.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error);
    process.exit(1);
  }
};

dropIndex();
