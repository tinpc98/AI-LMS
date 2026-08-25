import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

/**
 * Script này dùng để migrate dữ liệu cũ của collection `questions` sang chuẩn Domain 03.1
 * Chạy script thủ công thông qua CLI hoặc CI/CD pipeline.
 */
export const migrateQuestions = async () => {
  try {
    const db = mongoose.connection.db;
    const questionsCol = db.collection("questions");
    const topicsCol = db.collection("topics");
    const coursesCol = db.collection("courses"); // Lấy tạm một Course để tạo Topic

    console.log("🚀 Bắt đầu quá trình Migration Domain 03.1 - ContentBlock...");

    // TÌM HOẶC TẠO MỘT DEFAULT TOPIC CHO LEGACY QUESTIONS
    let defaultTopicId = null;
    const existingTopic = await topicsCol.findOne({ name: "Legacy Topic (Migrated)" });
    if (existingTopic) {
      defaultTopicId = existingTopic._id;
    } else {
      // Create a default topic
      const anyCourse = await coursesCol.findOne({});
      const result = await topicsCol.insertOne({
        name: "Legacy Topic (Migrated)",
        courseId: anyCourse ? anyCourse._id : new mongoose.Types.ObjectId(),
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      });
      defaultTopicId = result.insertedId;
      console.log(`✅ Đã tạo Default Topic: ${defaultTopicId}`);
    }

    // TÌM TOÀN BỘ CÂU HỎI
    const allQuestions = await questionsCol.find({}).toArray();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const q of allQuestions) {
      const updateDoc = { $set: {}, $unset: {} };
      let needsUpdate = false;

      // 1. Migrate content (từ String sang Array of ContentBlocks)
      if (typeof q.content === "string") {
        updateDoc.$set.content = [
          {
            id: uuidv4(),
            type: "TEXT",
            order: 0,
            text: q.content,
          }
        ];
        needsUpdate = true;
      }

      // 2. Migrate topicId
      if (!q.topicId) {
        updateDoc.$set.topicId = defaultTopicId;
        needsUpdate = true;
      }

      // 3. Migrate type (chuyển sang uppercase nếu cần, hoặc map MCQ)
      if (q.type === "multiple_choice" || q.type === "MCQ") {
        updateDoc.$set.type = "MCQ";
        // Giả sử legacy là SINGLE mode (vì correctAnswer là 1 string)
        if (!q.selectionMode) {
          updateDoc.$set.selectionMode = "SINGLE";
        }
        needsUpdate = true;
      } else if (q.type === "essay" || q.type === "ESSAY") {
        updateDoc.$set.type = "ESSAY";
        needsUpdate = true;
      }

      // 4. Migrate options
      if (q.options && q.options.length > 0 && typeof q.options[0] === 'string') {
        const newOptions = q.options.map((optText, index) => ({
          id: uuidv4(),
          order: index,
          isCorrect: q.correctAnswer === optText,
          content: [
            {
              id: uuidv4(),
              type: "TEXT",
              order: 0,
              text: optText,
            }
          ]
        }));
        updateDoc.$set.options = newOptions;
        // Bỏ correctAnswer cũ đi
        updateDoc.$unset.correctAnswer = "";
        needsUpdate = true;
      }

      if (needsUpdate) {
        if (Object.keys(updateDoc.$set).length === 0) delete updateDoc.$set;
        if (Object.keys(updateDoc.$unset).length === 0) delete updateDoc.$unset;
        
        await questionsCol.updateOne({ _id: q._id }, updateDoc);
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Đã migrate thành công: ${migratedCount} câu hỏi.`);
    console.log(`⏭️  Đã skip (đã chuẩn): ${skippedCount} câu hỏi.`);
    console.log("🎉 Hoàn tất Migration!");

  } catch (error) {
    console.error("❌ Lỗi trong quá trình Migration:", error);
  }
};
