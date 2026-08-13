import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function queryCorrupted() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduspace_db');

    const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
    const msgs = await Message.find({ 'attachments.fileName': { $regex: /Ã|á»|Ä/ } }).lean();
    console.log('Corrupted files count (chat):', msgs.length);
    
    const Assignment = mongoose.model('Assignment', new mongoose.Schema({}, { strict: false }));
    const assignments = await Assignment.find({ 'attachments.name': { $regex: /Ã|á»|Ä/ } }).lean();
    console.log('Corrupted files count (assignments):', assignments.length);

    process.exit(0);
  } catch(e) {
    console.log(e);
    process.exit(1);
  }
}
queryCorrupted();
