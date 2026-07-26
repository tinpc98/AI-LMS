import Course from "../models/course.model.js";

class CourseService {
  async createCourse(data, createdBy) {
    const course = new Course({
      ...data,
      createdBy,
    });
    return await course.save();
  }

  async getCourses({ search, subject, grade, status, page = 1, limit = 10 }) {
    const query = {};
    if (search) {
      query.courseName = { $regex: search, $options: "i" };
    }
    if (subject) query.subject = subject;
    if (grade) query.grade = Number(grade);
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Course.find(query)
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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
    const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!course) {
      throw new Error("Khóa học không tồn tại!");
    }
    return course;
  }

  async deleteCourse(id) {
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      throw new Error("Khóa học không tồn tại!");
    }
    return true;
  }
}

export default new CourseService();
