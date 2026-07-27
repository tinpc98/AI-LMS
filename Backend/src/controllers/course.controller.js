import courseService from "../services/course.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const createCourse = async (req, res) => {
  try {
    const createdBy = req.user.id;
    const result = await courseService.createCourse(req.body, createdBy);
    return sendSuccess(res, "Tạo khóa học thành công", result, null, 201);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi tạo khóa học", 400);
  }
};

export const getCourses = async (req, res) => {
  try {
    const { search, subject, grade, status, page, limit } = req.query;
    const { items, pagination } = await courseService.getCourses({
      search,
      subject,
      grade,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return sendSuccess(res, "Lấy danh sách khóa học thành công", items, pagination);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy danh sách khóa học", 500);
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await courseService.getCourseById(id);
    return sendSuccess(res, "Lấy chi tiết khóa học thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy chi tiết khóa học", 404);
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await courseService.updateCourse(id, req.body);
    return sendSuccess(res, "Cập nhật khóa học thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi cập nhật khóa học", 400);
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    await courseService.deleteCourse(id, userId);
    return sendSuccess(res, "Xóa khóa học thành công");
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi xóa khóa học", 400);
  }
};
