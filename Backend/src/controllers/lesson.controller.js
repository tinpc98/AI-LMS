import Lesson from "../models/lesson.model.js";
import cloudinary from "../config/cloudinary.js";

// Helper function: Đẩy Buffer từ RAM lên Cloudinary bằng Stream
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "AI_LMS_Materials",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          name: originalName,
          url: result.secure_url,
          publicId: result.public_id, // Đã sửa lại thành snake_case chuẩn của Cloudinary
        });
      },
    );
    stream.end(fileBuffer);
  });
};
//============================================================\
//Tạo bài giảng
const lessonController = {
  // 1. TẠO BÀI GIẢNG (Giáo viên điền text + dán link YouTube + đính kèm file)
  createLesson: async (req, res) => {
    try {
      const { title, description, videoUrl, classId } = req.body;
      const teacherId = req.user.id;

      if (!title || !classId) {
        return res
          .status(400)
          .json({ message: "Thiếu thông tin bắt buộc: Tiêu đề hoặc ClassId" });
      }
      let attachments = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname),
        );
        attachments = await Promise.all(uploadPromises);
      }
      const newLesson = new Lesson({
        title,
        description,
        videoUrl,
        attachments,
        classId,
        teacherId,
      });
      await newLesson.save();
      return res
        .status(201)
        .json({ message: "Tạo bài giảng thành công", lesson: newLesson });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server khi tạo bài giảng",
        error: error.message,
      });
    }
  },
  // 2. LẤY DANH SÁCH BÀI GIẢNG THEO LỚP
  getLessonsByClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const lessons = await Lesson.find({ classId }).sort({ createdAt: 1 });
      return res.status(200).json({ lessons });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server khi lấy danh sách bài giảng",
        error: error.message,
      });
    }
  },
  // 3. CẬP NHẬT BÀI GIẢNG
  updateLesson: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, videoUrl } = req.body;
      const teacherId = req.user.id;

      const lesson = await Lesson.findOne({ _id: id, teacherId });
      if (!lesson) {
        return res.status(403).json({
          message:
            "Bạn không có quyền sửa bài giảng này hoặc bài giảng không tồn tại",
        });
      }

      if (title) lesson.title = title;
      if (description) lesson.description = description;
      if (videoUrl !== undefined) lesson.videoUrl = videoUrl;

      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname),
        );
        const newAttachments = await Promise.all(uploadPromises);
        lesson.attachments.push(...newAttachments);
      }

      await lesson.save();
      return res
        .status(200)
        .json({ message: "Cập nhật bài giảng thành công", lesson });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server khi sửa bài giảng",
        error: error.message,
      });
    }
  },

  // 4. XÓA BÀI GIẢNG (Dọn rác Cloudinary và xóa DB)
  deleteLesson: async (req, res) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;

      const lesson = await Lesson.findOne({ _id: id, teacherId });
      if (!lesson) {
        return res.status(403).json({
          message:
            "Bạn không có quyền xóa bài giảng này hoặc bài giảng không tồn tại",
        });
      }

      if (lesson.attachments && lesson.attachments.length > 0) {
        const deletePromises = lesson.attachments.map((file) =>
          cloudinary.uploader.destroy(file.publicId),
        );
        await Promise.all(deletePromises);
      }

      await Lesson.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ message: "Xóa bài giảng và tài liệu liên quan thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server khi xóa bài giảng",
        error: error.message,
      });
    }
  },
};
export default lessonController;
