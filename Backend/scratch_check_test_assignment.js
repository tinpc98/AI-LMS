import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Assignment = mongoose.connection.collection('assignments');
    
    // Tìm các bài tập có tiêu đề chứa chữ "test"
    const assignments = await Assignment.find({ title: { $regex: /test/i } }).toArray();
    
    console.log("Tổng số bài tập tên chứa 'test':", assignments.length);
    assignments.forEach(a => {
      console.log(`- ID: ${a._id}`);
      console.log(`  Title: ${a.title}`);
      console.log(`  Deadline: ${a.deadline}`);
      console.log(`  Description: ${a.description}`);
      console.log(`  Attachments count: ${a.attachments ? a.attachments.length : 0}`);
    });
    
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

run();
