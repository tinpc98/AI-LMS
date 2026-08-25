import Course from "./course.model.js";
import Subject from "../subject/subject.model.js";
import ClassModel from "../class/class.model.js";
import { softDeleteClass } from "../class/class.repository.js";

class CourseService {
  async createCourse(data, createdBy) {
    if (data.subjectId) {
      const subject = await Subject.findById(data.subjectId);
      if (!subject) {
        const error = new Error("Môn học không tồn tại");
        error.status = 404;
        throw error;
      }
      if (subject.status !== "ACTIVE") {
        const error = new Error("Không thể sử dụng môn học chưa ACTIVE");
        error.status = 400;
        throw error;
      }
    }
    const course = new Course({
      ...data,
      createdBy,
    });
    return await course.save();
  }

  async getCourses({
    search,
    subjectId,
    grade,
    status,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
    userRole,
  }) {
    const query = {};
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: safeSearch, $options: "i" };
    }
    if (subjectId) query.subjectId = subjectId;
    if (grade) query.grade = Number(grade);
    
    if (status) {
      query.status = status;
    }
    
    if (userRole !== "Admin") {
      query.status = "PUBLISHED";
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = order === "asc" ? 1 : -1;
    const sortQuery = { [sort]: sortDirection };

    const [items, total] = await Promise.all([
      Course.find(query)
        .populate("subjectId", "name code")
        .populate("createdBy", "fullName email")
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseById(id) {
    const course = await Course.findById(id)
      .populate("subjectId", "name code")
      .populate("createdBy", "fullName email");
    if (!course) {
      throw new Error("Khóa học không tồn tại!");
    }
    return course;
  }

  async updateCourse(id, data, updatedBy) {
    const {
      name,
      code,
      subjectId,
      grade,
      description,
      thumbnail,
      prices,
      duration,
      status,
    } = data;
    const update = {};
    if (name !== undefined) update.name = name;
    if (code !== undefined) update.code = code;
    if (subjectId !== undefined) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        const error = new Error("Môn học không tồn tại");
        error.status = 404;
        throw error;
      }
      if (subject.status !== "ACTIVE") {
        const error = new Error("Không thể sử dụng môn học chưa ACTIVE");
        error.status = 400;
        throw error;
      }
      update.subjectId = subjectId;
    }
    if (grade !== undefined) update.grade = grade;
    if (description !== undefined) update.description = description;
    if (thumbnail !== undefined) update.thumbnail = thumbnail;
    if (prices !== undefined) update.prices = prices;
    if (duration !== undefined) update.duration = duration;
    if (status !== undefined) update.status = status;
    if (updatedBy !== undefined) update.updatedBy = updatedBy;

    const course = await Course.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!course) {
      const error = new Error("Khóa học không tồn tại!");
      error.status = 404;
      throw error;
    }
    return course;
  }

  async deleteCourse(id, userId = null) {
    // Modify status to ARCHIVED alongside soft delete
    const course = await Course.findByIdAndUpdate(
      id,
      { status: "ARCHIVED", updatedBy: userId },
      { new: true }
    );
    if (!course) {
      const error = new Error("Khóa học không tồn tại!");
      error.status = 404;
      throw error;
    }
    await Course.softDelete(id, userId);

    // Cascade soft delete all classes belonging to this course
    const classes = await ClassModel.find({ courseId: id, isDeleted: false });
    for (const cls of classes) {
      await softDeleteClass(cls._id, userId);
    }

    return true;
  }

  async getCourseTrash(queryParams) {
    const {
      search,
      subjectId,
      grade,
      status,
      page = 1,
      limit = 10,
      sort = "deletedAt",
      order = "desc",
    } = queryParams;
    const query = { isDeleted: true };

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: safeSearch, $options: "i" };
    }
    if (subjectId) query.subjectId = subjectId;
    if (grade) query.grade = Number(grade);
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = order === "asc" ? 1 : -1;
    const sortQuery = { [sort]: sortDirection };

    const [items, total] = await Promise.all([
      Course.find(query)
        .populate("subjectId", "name code")
        .populate("createdBy", "fullName email")
        .withDeleted()
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(query).withDeleted(),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  async restoreCourse(id) {
    const course = await Course.findOne({ _id: id }).withDeleted();
    if (!course) {
      const error = new Error("Khóa học không tồn tại");
      error.status = 404;
      throw error;
    }

    if (!course.isDeleted) {
      const error = new Error("Khóa học chưa bị xóa, không thể khôi phục!");
      error.status = 400;
      throw error;
    }

    return await course.restore();
  }

  async permanentDeleteCourse(id) {
    const course = await Course.findOne({ _id: id }).withDeleted();
    if (!course) {
      const error = new Error("Khóa học không tồn tại");
      error.status = 404;
      throw error;
    }

    if (!course.isDeleted) {
      const error = new Error("Không thể xóa vĩnh viễn khóa học đang hoạt động!");
      error.status = 400;
      throw error;
    }

    return await Course.findByIdAndDelete(id).withDeleted();
  }
}

export default new CourseService();
