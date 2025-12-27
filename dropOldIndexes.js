require('dotenv').config();
const mongoose = require('mongoose');

async function dropOldIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('selections');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the old receiverUserId index
    try {
      await collection.dropIndex('receiverUserId_1');
      console.log('Successfully dropped receiverUserId_1 index');
    } catch (err) {
      console.log('receiverUserId_1 index does not exist or already dropped');
    }

    // Get updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', updatedIndexes);

    console.log('Done! You can now restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropOldIndexes();
