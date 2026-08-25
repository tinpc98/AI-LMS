import mongoose from 'mongoose';

async function run() {
  try {
    await mongoose.connect('mongodb+srv://admin:admin123@cluster0.wissmyr.mongodb.net/AI-LMS?appName=Cluster0');
    console.log('Connected to DB');

    const db = mongoose.connection.db;

    const attendances = db.collection('attendances');
    const teacherAttendances = db.collection('teacherattendances');
    const classEnrollments = db.collection('classenrollments');
    const classSessions = db.collection('classsessions');
    
    const stats = await attendances.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Attendance Stats:', stats);

    const total = await attendances.countDocuments();
    console.log('Total Attendances:', total);

    const totalTeacher = await teacherAttendances.countDocuments();
    console.log('Total Teacher Attendances:', totalTeacher);

    // Orphan check: sessionId doesn't exist
    const orphanSessions = await attendances.aggregate([
      {
        $lookup: {
          from: 'classsessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      { $match: { session: { $size: 0 } } },
      { $count: 'count' }
    ]).toArray();
    console.log('Orphan Attendances (missing session):', orphanSessions);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
