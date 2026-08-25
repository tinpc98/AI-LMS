import StudentPerformance from "./studentPerformance.model.js";
import Weakness from "./weakness.model.js";
import AIRecommendation from "./aiRecommendation.model.js";
import { generateRecommendationService } from "./recommendation.service.js";
import { rebuildStudentPerformanceService } from "./adminRebuild.service.js";
import mongoose from "mongoose";
import { ClassEnrollment } from "#modules/classEnrollment/index.js";
import { Class as ClassModel } from "#modules/class/index.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { AuthorizationError, ValidationError } from "#shared/utils/appError.js";

const checkTeacherStudentAccessService = async (teacherId, studentId) => {
  const enrollments = await ClassEnrollment.find({ studentId, status: "ACTIVE" }).select("classId").lean();
  if (!enrollments.length) return false;

  const classIds = enrollments.map(e => e.classId);
  const isTeacher = await ClassModel.exists({
    _id: { $in: classIds },
    teacherId: teacherId,
    isDeleted: { $ne: true }
  });

  return !!isTeacher;
};

// ================= STUDENT endpoints =================

export const getMyPerformance = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.query;

  const filter = { studentId };
  if (courseId) filter.courseId = courseId;

  const performances = await StudentPerformance.find(filter)
    .populate("topicId", "name order")
    .lean();

  res.status(200).json({ success: true, data: performances });
});

export const getMyWeaknesses = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.query;

  const filter = { studentId };
  if (courseId) filter.courseId = courseId;

  const weaknesses = await Weakness.find(filter)
    .populate("topicId", "name order")
    .lean();

  res.status(200).json({ success: true, data: weaknesses });
});

export const getMyRecommendations = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.query;

  const filter = { studentId };
  if (courseId) filter.courseId = courseId;

  const recommendations = await AIRecommendation.find(filter)
    .sort({ generatedAt: -1 })
    .populate("recommendedTopics", "name")
    .lean();

  res.status(200).json({ success: true, data: recommendations });
});

export const generateMyRecommendation = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.body;

  if (!courseId) {
    throw new ValidationError("courseId is required");
  }

  const rec = await generateRecommendationService(studentId, courseId);
  res.status(201).json({ success: true, data: rec });
});

// ================= TEACHER endpoints =================

export const getStudentPerformanceByTeacher = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const teacherId = req.user?.id || req.user?._id;
  
  const isAuthorized = await checkTeacherStudentAccessService(teacherId, studentId);
  if (!isAuthorized) {
    throw new AuthorizationError("Bạn không có quyền xem dữ liệu của học sinh này");
  }
  
  const { courseId } = req.query;
  const filter = { studentId };
  if (courseId) filter.courseId = courseId;

  const performances = await StudentPerformance.find(filter)
    .populate("topicId", "name order")
    .lean();

  res.status(200).json({ success: true, data: performances });
});

export const getStudentWeaknessesByTeacher = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const teacherId = req.user?.id || req.user?._id;

  const isAuthorized = await checkTeacherStudentAccessService(teacherId, studentId);
  if (!isAuthorized) {
    throw new AuthorizationError("Bạn không có quyền xem dữ liệu của học sinh này");
  }

  const { courseId } = req.query;
  const filter = { studentId };
  if (courseId) filter.courseId = courseId;

  const weaknesses = await Weakness.find(filter)
    .populate("topicId", "name order")
    .lean();

  res.status(200).json({ success: true, data: weaknesses });
});

// ================= ADMIN endpoints =================

export const adminRebuildStudentPerformance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const result = await rebuildStudentPerformanceService(studentId);
  res.status(200).json({ success: true, data: result, message: "Rebuild completed successfully." });
});
