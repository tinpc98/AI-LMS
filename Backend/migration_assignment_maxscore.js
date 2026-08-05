import mongoose from "mongoose";
import dotenv from "dotenv";
import AssignmentModel from "./src/modules/assignment/assignment.model.js";
import SubmissionModel from "./src/modules/assignment/submission.model.js";

dotenv.config();

const runMigration = async () => {
  try {
    console.log("Đang kết nối MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Đã kết nối MongoDB.");

    const assignments = await AssignmentModel.find({});
    console.log(`Tìm thấy ${assignments.length} bài tập trong hệ thống.`);

    let updatedCount100 = 0;
    let updatedCount10 = 0;

    for (const assignment of assignments) {
      // Tìm tất cả các bài nộp đã được chấm của bài tập này
      const submissions = await SubmissionModel.find({
        assignmentId: assignment._id,
        grade: { $ne: null },
      });

      let requires100Scale = false;

      // Nếu có bất kỳ bài nộp nào có điểm > 10, bài tập này chắc chắn dùng thang 100
      for (const sub of submissions) {
        if (sub.grade > 10) {
          requires100Scale = true;
          break;
        }
      }

      const targetMaxScore = requires100Scale ? 100 : 10;

      // Chỉ cập nhật nếu maxScore chưa đúng
      if (assignment.maxScore !== targetMaxScore) {
        assignment.maxScore = targetMaxScore;
        await assignment.save();
        
        if (targetMaxScore === 100) updatedCount100++;
        else updatedCount10++;
      }
    }

    console.log("--- HOÀN TẤT MIGRATION ---");
    console.log(`Đã cập nhật ${updatedCount100} bài tập sang thang điểm 100.`);
    console.log(`Đã cập nhật ${updatedCount10} bài tập sang thang điểm 10.`);
    console.log("Lưu ý: Các bài tập mới tạo sau này sẽ mặc định dùng thang 10 theo schema.");

  } catch (error) {
    console.error("Lỗi Migration:", error);
  } finally {
    mongoose.connection.close();
  }
};

runMigration();
