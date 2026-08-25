import courseService from "./course.service.js";
import { sendSuccess } from "#shared/utils/response.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

export const createCourse = asyncHandler(async (req, res) => {
  const createdBy = req.user.id || req.user._id;
  const result = await courseService.createCourse(req.body, createdBy);
  return sendSuccess(res, "Tạo khóa học thành công", result, null, 201);
});

export const getCourses = asyncHandler(async (req, res) => {
  const { search, subjectId, grade, status, page, limit, sort, order } = req.query;
  const { items, pagination } = await courseService.getCourses({
    search,
    subjectId,
    grade,
    status,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    sort,
    order,
    userRole: req.user?.role,
  });
  return sendSuccess(res, "Lấy danh sách khóa học thành công", items, pagination);
});

export const getAvailableCourses = asyncHandler(async (req, res) => {
  const { items, pagination } = await courseService.getCourses({
    status: "PUBLISHED",
    page: 1,
    limit: 100, // Return a reasonable amount
    userRole: "Student",
  });
  
  // Filter private/admin info
  const safeItems = items.map(c => ({
    id: c._id,
    name: c.name,
    description: c.description,
    prices: c.prices,
  }));
  
  return sendSuccess(res, "Lấy danh sách khóa học thành công", safeItems, pagination);
});

export const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await courseService.getCourseById(id);
  return sendSuccess(res, "Lấy chi tiết khóa học thành công", result);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedBy = req.user.id || req.user._id;
  const result = await courseService.updateCourse(id, req.body, updatedBy);
  return sendSuccess(res, "Cập nhật khóa học thành công", result);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.user?._id;
  await courseService.deleteCourse(id, userId);
  return sendSuccess(res, "Xóa khóa học thành công");
});

export const getCourseTrash = asyncHandler(async (req, res) => {
  const { items, pagination } = await courseService.getCourseTrash(req.query);
  return sendSuccess(res, "Lấy danh sách thùng rác thành công", items, pagination);
});

export const restoreCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await courseService.restoreCourse(id);
  return sendSuccess(res, "Khôi phục khóa học thành công", result);
});

export const permanentDeleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await courseService.permanentDeleteCourse(id);
  return sendSuccess(res, "Xóa vĩnh viễn khóa học thành công");
});
