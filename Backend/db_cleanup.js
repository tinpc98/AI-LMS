import mongoose from 'mongoose';

async function run() {
  try {
    await mongoose.connect('mongodb+srv://admin:admin123@cluster0.wissmyr.mongodb.net/AI-LMS?appName=Cluster0');
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const attendances = db.collection('attendances');

    // Delete records that don't have a sessionId
    const result = await attendances.deleteMany({ sessionId: { $exists: false } });
    console.log(`Deleted ${result.deletedCount} legacy records missing sessionId.`);
    
    // Check remaining total
    const remaining = await attendances.countDocuments();
    console.log(`Remaining attendances: ${remaining}`);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
