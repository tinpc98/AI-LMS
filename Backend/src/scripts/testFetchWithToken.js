import jwt from "jsonwebtoken";

const token = jwt.sign(
  { id: "6a66480f400b0d54163e6a89", role: "teacher" },
  process.env.JWT_SECRET || "123456",
  { expiresIn: "1h" }
);
console.log("Token:", token);

async function test() {
  const res = await fetch("http://localhost:5000/api/exams/generate-from-examset", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      classId: "6a66480f400b0d54163e6a89",
      examSetId: "6a68d9b88f091e31d29799fc",
      title: "Đề kiểm tra Sprint 4 sau sửa route",
      durationMinutes: 10,
      totalQuestions: 1,
      totalPoints: 10,
      questionTypeDistribution: {
        multiple_choice: 1,
        true_false: 0,
        short_answer: 0,
        essay: 0,
      },
      difficultyDistribution: {
        easy: 1,
        medium: 0,
        hard: 0,
      },
      shuffleQuestions: true,
      shuffleOptions: true,
    }),
  });
  const data = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", data);
}
test();
