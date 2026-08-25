import { config } from 'dotenv';
config();
import axios from 'axios';
import mongoose from 'mongoose';
import { generateToken } from './src/modules/auth/auth.service.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI, {tls:true});
  const user = await mongoose.connection.db.collection('users').findOne({email: 'khoia@lms.edu.vn'});
  const token = generateToken({ id: user._id, role: user.role, status: user.status });
  
  const classObj = await mongoose.connection.db.collection('classenrollments').findOne({ studentId: user._id, status: 'ACTIVE' });
  const classId = classObj.classId.toString();

  try {
    const res = await axios.get('http://localhost:5000/api/classes/' + classId, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('ClassDetail Status:', res.status);
    console.log('ClassDetail Data Name:', res.data.data.name || res.data.data.className);
    
    const resList = await axios.get('http://localhost:5000/api/classes', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('ClassList Length:', resList.data.data.length);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
  await mongoose.disconnect();
}
test();
