import('mongoose').then(async ({ default: mongoose }) => {
  await mongoose.connect('mongodb://127.0.0.1:27017/eduspace_db');
  
  const classObj = await mongoose.connection.collection('classes').findOne({});
  if (!classObj) throw new Error('No class found');
  const classId = classObj._id.toString();

  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student1@student.edu.vn', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  const formData = new FormData();
  const blob = new Blob(['Test content'], { type: 'application/pdf' });
  formData.append('file', blob, 'Đề cương ôn tập chương 1.pdf');

  console.log('Sending upload request for class:', classId);

  const uploadRes = await fetch('http://localhost:5000/api/classes/' + classId + '/messages/attachments', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });
  
  const uploadData = await uploadRes.json();
  console.log('Upload Result:', JSON.stringify(uploadData, null, 2));

  // Find corrupted files in chat
  const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
  const msgs = await Message.find({ 'attachments.fileName': { $regex: /Ã|á»|Ä/ } }).lean();
  console.log('Corrupted files count (chat):', msgs.length);
  
  // Find corrupted files in assignment
  const Assignment = mongoose.model('Assignment', new mongoose.Schema({}, { strict: false }));
  const assignments = await Assignment.find({ 'attachments.name': { $regex: /Ã|á»|Ä/ } }).lean();
  console.log('Corrupted files count (assignments):', assignments.length);

  process.exit(0);
}).catch(console.log);
