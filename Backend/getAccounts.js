import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGO_URI || process.env.MONGODB_URI;
await mongoose.connect(url);

const classObj = await mongoose.connection.collection('classes').findOne({});
console.log('ClassId:', classObj._id.toString());

const studentId = classObj.students[0].studentId || classObj.students[0];
const student = await mongoose.connection.collection('users').findOne({_id: studentId});
console.log('Student:', student.email);

const teacherId = classObj.teacherId;
const teacher = await mongoose.connection.collection('users').findOne({_id: teacherId});
console.log('Teacher:', teacher.email);

process.exit(0);
