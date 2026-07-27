import mongoose from "mongoose";

/**
 * Service xử lý các logic tái sử dụng cho Class module.
 * Áp dụng chuẩn DRY và giải quyết vấn đề Fat Controller.
 */
class ClassService {
  /**
   * Xây dựng bộ điều kiện query (Query Builder) cho danh sách lớp học.
   * Hỗ trợ search, filter, advanced filters (teacherId, learningMode, dateRange), 
   * phân quyền dữ liệu, phân trang và sắp xếp an toàn.
   * 
   * @param {Object} query - Object req.query từ client
   * @param {Boolean} isTrash - Cờ hiệu (true = lấy thùng rác, false = lấy danh sách bình thường)
   * @param {String} userRole - Vai trò của user (admin/teacher/student)
   * @param {String} userId - ID của user
   * @returns {Object} - { finalQuery, skip, limitNum, pageNum, sortOption }
   */
  buildClassQueryOptions(query, isTrash = false, userRole = "", userId = "") {
    const { 
      search, 
      courseId, 
      status, 
      teacherId, 
      learningMode, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10, 
      sort 
    } = query;

    const filterConditions = [{ isDeleted: isTrash }];

    // 1. Phân quyền dữ liệu theo vai trò (Role-based data scoping)
    if (userRole === "teacher") {
      filterConditions.push({ teacherId: userId });
    } else if (userRole === "student") {
      filterConditions.push({ "students.studentId": userId });
    }
    // Vai trò 'admin' sẽ xem được toàn bộ danh sách lớp học

    // 2. Tìm kiếm theo Tên lớp hoặc Mã lớp
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.push({
        $or: [{ className: searchRegex }, { classCode: searchRegex }],
      });
    }

    // 3. Lọc theo Khóa học liên kết
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filterConditions.push({ courseId });
    }

    // 4. Lọc theo Trạng thái lớp học
    if (status && status !== "ALL") {
      filterConditions.push({ status });
    }

    // 5. Lọc nâng cao: Giáo viên phụ trách
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) {
      filterConditions.push({ teacherId });
    }

    // 6. Lọc nâng cao: Hình thức học
    if (learningMode && ["Offline", "Online", "Hybrid"].includes(learningMode)) {
      filterConditions.push({ learningMode });
    }

    // 7. Lọc nâng cao: Date Range (startDate & endDate)
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      filterConditions.push({ startDate: dateFilter });
    }

    // Tổng hợp điều kiện truy vấn Mongoose
    const finalQuery = filterConditions.length === 1 ? filterConditions[0] : { $and: filterConditions };

    // Xử lý Pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Xử lý Sorting (Whitelist - Ngăn ngừa sort injection)
    const SORT_WHITELIST = ["createdAt", "className", "startDate", "endDate", "maxStudents", "status"];
    let sortOption = { createdAt: -1 }; // Mặc định
    if (sort && sort.trim()) {
      const parts = sort.split(",").map((s) => s.trim()).filter(Boolean);
      const sortObj = {};
      parts.forEach((part) => {
        const desc = part.startsWith("-");
        const field = desc ? part.slice(1) : part;
        if (SORT_WHITELIST.includes(field)) {
          sortObj[field] = desc ? -1 : 1;
        }
      });
      if (Object.keys(sortObj).length > 0) sortOption = sortObj;
    }

    return {
      finalQuery,
      skip,
      limitNum,
      pageNum,
      sortOption,
    };
  }
}

export default new ClassService();
