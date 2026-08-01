import Course from "./course.model.js";

class CourseService {
  async createCourse(data, createdBy) {
    const course = new Course({
      ...data,
      createdBy,
    });
    return await course.save();
  }

  async getCourses({
    search,
    subject,
    grade,
    status,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
  }) {
    const query = {};
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.courseName = { $regex: safeSearch, $options: "i" };
    }
    if (subject) query.subject = subject;
    if (grade) query.grade = Number(grade);
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = order === "asc" ? 1 : -1;
    const sortQuery = { [sort]: sortDirection };

    const [items, total] = await Promise.all([
      Course.find(query)
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
    const course = await Course.findById(id).populate("createdBy", "fullName email");
    if (!course) {
      throw new Error("Khóa học không tồn tại!");
    }
    return course;
  }

  async updateCourse(id, data) {
    // Whitelist rõ ràng: findByIdAndUpdate(id, data, ...) trước đây nhận nguyên req.body, cho
    // phép client tự đặt isDeleted/deletedAt/deletedBy/createdBy — bỏ qua hẳn flow soft-delete
    // chính thức (DELETE /:id) và để lại bản ghi ở trạng thái không nhất quán.
    const {
      courseName,
      subject,
      grade,
      description,
      thumbnail,
      tuitionFee,
      durationWeeks,
      totalLessons,
      target,
      status,
    } = data;
    const update = {};
    if (courseName !== undefined) update.courseName = courseName;
    if (subject !== undefined) update.subject = subject;
    if (grade !== undefined) update.grade = grade;
    if (description !== undefined) update.description = description;
    if (thumbnail !== undefined) update.thumbnail = thumbnail;
    if (tuitionFee !== undefined) update.tuitionFee = tuitionFee;
    if (durationWeeks !== undefined) update.durationWeeks = durationWeeks;
    if (totalLessons !== undefined) update.totalLessons = totalLessons;
    if (target !== undefined) update.target = target;
    if (status !== undefined) update.status = status;

    const course = await Course.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!course) {
      const error = new Error("Khóa học không tồn tại!");
      error.status = 404;
      throw error;
    }
    return course;
  }

  async deleteCourse(id, userId = null) {
    const course = await Course.softDelete(id, userId);
    if (!course) {
      const error = new Error("Khóa học không tồn tại!");
      error.status = 404;
      throw error;
    }
    return true;
  }

  async getCourseTrash(queryParams) {
    const {
      search,
      subject,
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
      query.courseName = { $regex: safeSearch, $options: "i" };
    }
    if (subject) query.subject = subject;
    if (grade) query.grade = Number(grade);
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = order === "asc" ? 1 : -1;
    const sortQuery = { [sort]: sortDirection };

    const [items, total] = await Promise.all([
      Course.find(query)
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
