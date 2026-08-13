import dotenv from 'dotenv';
dotenv.config();

// Sử dụng Axios thay vì native fetch nếu có yêu cầu
async function run() {
  const loginTeacher = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'teacher1@school.edu.vn', password: '123456'})
  }).then(r => r.json());
  
  const loginStudent = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'student1@student.edu.vn', password: '123456'})
  }).then(r => r.json());

  console.log("Teacher login:", loginTeacher.success);
  console.log("Student login:", loginStudent.success);

  const tToken = loginTeacher.data.accessToken;
  const sToken = loginStudent.data.accessToken;

  const classId = '6a6c66402ca66ee1f5f5e452';

  console.log("\n=== 1. TẢI LỊCH SỬ TIN NHẮN (Student) ===");
  const history = await fetch(`http://localhost:5000/api/classes/${classId}/messages?limit=5`, {
    headers: { Authorization: `Bearer ${sToken}` }
  }).then(r => r.json());
  console.log("Status:", history.success, "| Messages Count:", history.data?.length);

  console.log("\n=== 2. GỬI TIN NHẮN MỚI (Student) ===");
  const sendRes = await fetch(`http://localhost:5000/api/classes/${classId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: "Xác nhận API chat đã gọi đúng đường dẫn qua Node Script!", type: "text" })
  }).then(r => r.json());
  console.log("Status:", sendRes.success, "| Message ID:", sendRes.data?._id);

  const msgId = sendRes.data?._id;

  console.log("\n=== 3. THẢ REACTION (Student) ===");
  const reactRes = await fetch(`http://localhost:5000/api/classes/${classId}/messages/${msgId}/reactions`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji: "❤️" })
  }).then(r => r.json());
  console.log("Status:", reactRes.success, "| Reactions Summary:", reactRes.data?.reactionsSummary);

  console.log("\n=== 4. XEM TIN TỪ TEACHER (Teacher) ===");
  const tHistory = await fetch(`http://localhost:5000/api/classes/${classId}/messages?limit=5`, {
    headers: { Authorization: `Bearer ${tToken}` }
  }).then(r => r.json());
  console.log("Teacher read message:", tHistory.data[0].content, "| By:", tHistory.data[0].senderId.fullName);

  process.exit(0);
}

run();
