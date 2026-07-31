import Lesson from "./lesson.model.js";
import cloudinary from "../../config/cloudinary.js";
import { checkClassTeacherOwnership } from "#modules/class";

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
          publicId: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
};
//============================================================\
// Quản lý Bài giảng
const lessonController = {
  // 1. TẠO BÀI GIẢNG
  createLesson: async (req, res) => {
    try {
      // Bổ sung lấy order, isPublished, duration từ body
      const { title, description, videoUrl, classId, order, isPublished, duration } = req.body;
      const teacherId = req.user.id || req.user._id;

      if (!title || !classId) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc: Tiêu đề hoặc ClassId" });
      }

      const isAuthorized = await checkClassTeacherOwnership(classId, teacherId, req.user?.role);
      if (!isAuthorized) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền tạo bài giảng cho lớp học này!" });
      }

      let attachments = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );
        attachments = await Promise.all(uploadPromises);
      }

      // Xử lý ép kiểu dữ liệu từ form-data (vì form-data gửi mọi thứ dưới dạng String)
      const parsedOrder = order ? Number(order) : 0;
      const parsedDuration = duration ? Number(duration) : 0;
      const parsedIsPublished = isPublished === "false" ? false : true; // Mặc định là true trừ khi gửi rõ chữ 'false'

      const newLesson = new Lesson({
        title,
        description,
        videoUrl,
        attachments,
        classId,
        teacherId,
        order: parsedOrder,
        isPublished: parsedIsPublished,
        duration: parsedDuration,
      });

      await newLesson.save();
      return res.status(201).json({ message: "Tạo bài giảng thành công", lesson: newLesson });
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

      // Khởi tạo query tìm kiếm
      const query = { classId };

      // [Thực chiến] Phân quyền hiển thị: Học sinh chỉ thấy bài đã Publish
      if (req.user && req.user.role !== "teacher" && req.user.role !== "admin") {
        query.isPublished = true;
      }

      // Cập nhật sắp xếp: Ưu tiên xếp theo trường order trước, trùng order thì xếp theo ngày tạo
      const lessons = await Lesson.find(query).sort({ order: 1, createdAt: 1 });

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
      const { title, description, videoUrl, order, isPublished, duration } = req.body;
      const userId = req.user.id || req.user._id;

      const lesson = await Lesson.findById(id);
      if (!lesson) {
        return res.status(404).json({ message: "Bài giảng không tồn tại" });
      }

      const isAuthorized = await checkClassTeacherOwnership(lesson.classId, userId, req.user?.role);
      if (!isAuthorized) {
        return res.status(403).json({
          message: "Bạn không có quyền sửa bài giảng này!",
        });
      }

      // Cập nhật các trường cơ bản
      if (title) lesson.title = title;
      if (description) lesson.description = description;
      if (videoUrl !== undefined) lesson.videoUrl = videoUrl;

      // Cập nhật và ép kiểu các trường nâng cấp
      if (order !== undefined) lesson.order = Number(order);
      if (duration !== undefined) lesson.duration = Number(duration);
      if (isPublished !== undefined) {
        lesson.isPublished = isPublished === "false" ? false : Boolean(isPublished);
      }

      // Xử lý upload file mới (nếu có)
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );
        const newAttachments = await Promise.all(uploadPromises);
        lesson.attachments.push(...newAttachments);
      }

      await lesson.save();
      return res.status(200).json({ message: "Cập nhật bài giảng thành công", lesson });
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
      const userId = req.user.id || req.user._id;

      const lesson = await Lesson.findById(id);
      if (!lesson) {
        return res.status(404).json({ message: "Bài giảng không tồn tại" });
      }

      const isAuthorized = await checkClassTeacherOwnership(lesson.classId, userId, req.user?.role);
      if (!isAuthorized) {
        return res.status(403).json({
          message: "Bạn không có quyền xóa bài giảng này!",
        });
      }

      if (lesson.attachments && lesson.attachments.length > 0) {
        const deletePromises = lesson.attachments.map((file) =>
          cloudinary.uploader.destroy(file.publicId)
        );
        await Promise.all(deletePromises);
      }

      await lesson.softDelete(userId);
      return res.status(200).json({ message: "Xóa bài giảng và tài liệu liên quan thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server khi xóa bài giảng",
        error: error.message,
      });
    }
  },
};

export default lessonController;
