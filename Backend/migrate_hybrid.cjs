const mongoose = require('mongoose');

const uri = 'mongodb+srv://admin:admin123@cluster0.wissmyr.mongodb.net/AI-LMS?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const classes = db.collection('classes');

    const result = await classes.updateMany(
      { learningMode: 'Hybrid' },
      { $set: { learningMode: 'Offline' } }
    );
    console.log(`Modified ${result.modifiedCount} classes from Hybrid to Offline.`);

  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.dir);
