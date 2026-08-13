import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testUpload() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduspace_db');
    
    const classObj = await mongoose.connection.collection('classes').findOne({});
    const classId = classObj._id.toString();

    const teacherId = classObj.teacherId;
    const user = await mongoose.connection.collection('users').findOne({ _id: teacherId });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const formData = new FormData();
    // Valid minimal PDF to pass magic bytes
    const pdfMagicBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]);
    const blob = new Blob([pdfMagicBytes, 'test content'], { type: 'application/pdf' });
    formData.append('file', blob, 'Đề cương ôn tập chương 1.pdf');

    console.log('Sending upload request for class:', classId, 'as', user.email);

    const uploadRes = await fetch('http://localhost:5000/api/classes/' + classId + '/messages/attachments', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    
    const uploadData = await uploadRes.json();
    console.log('Upload Result:', JSON.stringify(uploadData, null, 2));

    process.exit(0);
  } catch(e) {
    console.log(e);
    process.exit(1);
  }
}
testUpload();
