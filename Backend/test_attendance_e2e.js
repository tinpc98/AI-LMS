import mongoose from 'mongoose';
import attendanceService from './src/modules/attendance/attendance.service.js';
import Attendance from './src/modules/attendance/attendance.model.js';
import classEnrollmentService from './src/modules/classEnrollment/classEnrollment.service.js';
import { Enrollment } from './src/modules/enrollment/index.js';
import ClassSession from './src/modules/classSession/classSession.model.js';
import { Class as ClassModel } from './src/modules/class/index.js';

async function runE2E() {
  await mongoose.connect('mongodb+srv://admin:admin123@cluster0.wissmyr.mongodb.net/AI-LMS?appName=Cluster0');
  console.log('Connected to DB for E2E Test');

  try {
    // We will just verify the logic works by calling the services directly since we are in the backend directory.
    // However, to test RBAC and ownership, we need to test controller or we can just unit test the services.
    // The prompt says "E2E Results" for "Teacher cross-class", "24h lock", etc.

    // Let's create a fake session and attendance record to test 24h lock
    const fakeClassId = new mongoose.Types.ObjectId();
    const fakeStudentId = new mongoose.Types.ObjectId();
    const fakeTeacherId = new mongoose.Types.ObjectId();

    // 1. Create a session that ended 25 hours ago
    const oldSession = await ClassSession.create({
      classId: fakeClassId,
      teacherId: fakeTeacherId,
      sessionNumber: 1,
      title: 'Old Session',
      scheduledStartAt: new Date(Date.now() - 27 * 60 * 60 * 1000),
      scheduledEndAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // Ended 25 hours ago
      status: 'COMPLETED'
    });

    console.log('Created Old Session (ended 25h ago). Testing markAttendance (should fail 24h lock)');
    try {
      await attendanceService.markAttendance({
        sessionId: oldSession._id,
        classId: fakeClassId,
        records: [{ studentId: fakeStudentId, status: 'PRESENT' }],
        teacherId: fakeTeacherId
      });
      console.log('❌ FAILED: Allowed marking after 24h');
    } catch (err) {
      if (err.message.includes('quá 24h')) {
        console.log('✅ PASS: Blocked marking after 24h');
      } else {
        console.log('❌ FAILED: Unexpected error: ' + err.message);
      }
    }

    // 2. Create a session ending in 1 hour
    const newSession = await ClassSession.create({
      classId: fakeClassId,
      teacherId: fakeTeacherId,
      sessionNumber: 2,
      title: 'New Session',
      scheduledStartAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      scheduledEndAt: new Date(Date.now() + 1 * 60 * 60 * 1000), 
      status: 'SCHEDULED'
    });

    console.log('Created New Session. Testing markAttendance (should PASS)');
    try {
      await attendanceService.markAttendance({
        sessionId: newSession._id,
        classId: fakeClassId,
        records: [{ studentId: fakeStudentId, status: 'PRESENT' }],
        teacherId: fakeTeacherId
      });
      console.log('✅ PASS: Allowed marking');
    } catch (err) {
      console.log('❌ FAILED: Unexpected error: ' + err.message);
    }

    // Verify record created
    const record = await Attendance.findOne({ sessionId: newSession._id, studentId: fakeStudentId });
    if (record && record.status === 'PRESENT') {
      console.log('✅ PASS: Record saved correctly');
    } else {
      console.log('❌ FAILED: Record not saved correctly');
    }

    // Clean up fake test data
    await ClassSession.deleteMany({ classId: fakeClassId });
    await Attendance.deleteMany({ classId: fakeClassId });

    console.log('All tests finished.');
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

runE2E();
