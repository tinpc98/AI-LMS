/**
 * Abstraction/Boundary để kiểm tra việc đăng ký khóa học của học sinh.
 * Domain 02.2 (Enrollment) đã được triển khai — query DB thực tế.
 */
import enrollmentService from "#modules/enrollment/enrollment.service.js";

export const EnrollmentEligibilityProvider = {
  hasValidEnrollment: async (studentId) => {
    return await enrollmentService.hasActiveEnrollment(studentId);
  },
};

/**
 * Service đánh giá vòng đời tài khoản Student.
 * Xác định xem học sinh có nên bị chuyển sang trạng thái Expired hay không.
 *
 * @param {Object} student - Bản ghi học sinh cần kiểm tra
 * @param {Date} [now] - Truyền vào ngày cố định để tiện test
 * @returns {Promise<boolean>} true nếu học sinh cần bị expire
 */
export const shouldExpireStudent = async (student, now = new Date()) => {
  if (!student || student.role !== "Student" || student.status !== "Active") {
    return false;
  }

  // 15 days threshold
  const expiryThreshold = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  
  // Define activation time (fallback to createdAt if accountActivatedAt is missing for old users)
  const activationTime = student.accountActivatedAt 
    ? new Date(student.accountActivatedAt) 
    : new Date(student.createdAt);

  if (activationTime > expiryThreshold) {
    // Under 15 days
    return false;
  }

  // Over 15 days. If they have ANY enrollment activity (firstEnrollmentAt is set), they don't expire.
  if (student.firstEnrollmentAt) {
    return false;
  }

  // For fallback, if firstEnrollmentAt is not set (e.g. legacy data), check hasValidEnrollment
  const hasEnrollment = await EnrollmentEligibilityProvider.hasValidEnrollment(student._id);

  return !hasEnrollment;
};
