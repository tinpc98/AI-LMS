import Subject from "./subject.model.js";
import { Course } from "#modules/course";

/**
 * Tạo Subject mới
 */
const createSubject = async (data, adminId) => {
  const { name, code, description, status = "DRAFT" } = data;

  const normalizedCode = code.trim().toUpperCase();

  const existingSubject = await Subject.findOne({ code: normalizedCode });
  if (existingSubject) {
    const err = new Error(`Mã môn học ${normalizedCode} đã tồn tại`);
    err.status = 409;
    throw err;
  }

  const subject = await Subject.create({
    name: name.trim(),
    code: normalizedCode,
    description: description?.trim() || "",
    status,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return subject;
};

/**
 * Lấy danh sách Subject (hỗ trợ filter, search, pagination)
 */
const getSubjects = async ({ search, status, code, page = 1, limit = 10 }) => {
  const query = {};

  if (status) query.status = status;
  if (code) query.code = code.trim().toUpperCase();
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const [items, total] = await Promise.all([
    Subject.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .lean(),
    Subject.countDocuments(query),
  ]);

  // Lấy thêm số lượng Course cho mỗi Subject (Dành cho Admin)
  const subjectIds = items.map((i) => i._id);
  const courseCounts = await Course.aggregate([
    { $match: { subjectId: { $in: subjectIds } } },
    { $group: { _id: "$subjectId", count: { $sum: 1 } } },
  ]);

  const countMap = courseCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const itemsWithCount = items.map((item) => ({
    ...item,
    courseCount: countMap[item._id.toString()] || 0,
  }));

  return {
    items: itemsWithCount,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy Subject theo ID
 */
const getSubjectById = async (id) => {
  const subject = await Subject.findById(id)
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email")
    .lean();

  if (!subject) {
    const err = new Error("Không tìm thấy môn học");
    err.status = 404;
    throw err;
  }

  const courseCount = await Course.countDocuments({ subjectId: id });

  return { ...subject, courseCount };
};

/**
 * Cập nhật Subject
 */
const updateSubject = async (id, data, adminId) => {
  const subject = await Subject.findById(id);
  if (!subject) {
    const err = new Error("Không tìm thấy môn học");
    err.status = 404;
    throw err;
  }

  if (data.code) {
    const normalizedCode = data.code.trim().toUpperCase();
    if (normalizedCode !== subject.code) {
      const existing = await Subject.findOne({ code: normalizedCode });
      if (existing) {
        const err = new Error(`Mã môn học ${normalizedCode} đã tồn tại`);
        err.status = 409;
        throw err;
      }
      subject.code = normalizedCode;
    }
  }

  if (data.name) subject.name = data.name.trim();
  if (data.description !== undefined) subject.description = data.description.trim();

  subject.updatedBy = adminId;
  await subject.save();

  return subject;
};

/**
 * Chuyển trạng thái sang ACTIVE
 */
const activateSubject = async (id, adminId) => {
  const subject = await Subject.findById(id);
  if (!subject) {
    const err = new Error("Không tìm thấy môn học");
    err.status = 404;
    throw err;
  }

  if (subject.status === "ARCHIVED") {
    const err = new Error("Không thể activate môn học đã bị ARCHIVED");
    err.status = 400;
    throw err;
  }

  if (subject.status === "ACTIVE") return subject;

  subject.status = "ACTIVE";
  subject.updatedBy = adminId;
  await subject.save();

  return subject;
};

/**
 * Chuyển trạng thái sang ARCHIVED
 */
const archiveSubject = async (id, adminId) => {
  const subject = await Subject.findById(id);
  if (!subject) {
    const err = new Error("Không tìm thấy môn học");
    err.status = 404;
    throw err;
  }

  if (subject.status === "ARCHIVED") return subject;

  subject.status = "ARCHIVED";
  subject.updatedBy = adminId;
  await subject.save();

  return subject;
};

export default {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  activateSubject,
  archiveSubject,
};
