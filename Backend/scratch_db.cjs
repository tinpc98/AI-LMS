const mongoose = require('mongoose');

const uri = 'mongodb+srv://admin:admin123@cluster0.wissmyr.mongodb.net/AI-LMS?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const classes = db.collection('classes');

    // 1. Get schedule format of a real class
    const sampleClass = await classes.findOne({ "schedule.days": { $exists: true, $not: { $size: 0 } } });
    console.log("--- SAMPLE CLASS SCHEDULE ---");
    console.log(JSON.stringify(sampleClass?.schedule, null, 2));

    // 2. Count Hybrid classes
    const hybridCount = await classes.countDocuments({ learningMode: 'Hybrid' });
    console.log("\n--- HYBRID CLASS COUNT ---");
    console.log("Count:", hybridCount);

    // 3. Students vs currentStudents
    console.log("\n--- STUDENT COUNT CHECK ---");
    const classWithStudents = await classes.findOne({ students: { $exists: true, $not: { $size: 0 } } });
    if (classWithStudents) {
      console.log("Class ID:", classWithStudents._id);
      console.log("Students array length:", classWithStudents.students ? classWithStudents.students.length : 0);
      console.log("currentStudents field:", classWithStudents.currentStudents);
      console.log("Total students from the doc:", Object.keys(classWithStudents).filter(k => k.toLowerCase().includes('student')));
    } else {
      console.log("No class with students array > 0 found");
    }

  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.dir);
