import mongoose from "mongoose";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";

// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 5) — bảng xếp hạng giờ đọc THẲNG từ sổ cái XP thật
// (LearningActivity.xpAwarded, được ghi bởi xp.service.js#awardXpService khi có kết quả đã xác
// minh), thay cho cách tính cũ: cộng LessonProgress.progress (0-100 mỗi bài, không giới hạn) +
// đếm Attendance PRESENT * 10 + đếm LearningActivity (luôn = 0 vì trước đây KHÔNG AI ghi vào
// bảng này) + tổng Grade.score — một phép tính không phản ánh nghiệp vụ thật nào.
//
// Leaderboard SCOPE THEO TUẦN (không phải trọn đời) theo đúng đặc tả — tránh học sinh vào lớp
// muộn không bao giờ đuổi kịp học sinh cũ, và khuyến khích duy trì hoạt động đều mỗi tuần thay
// vì chỉ dựa vào thành tích tích lũy 1 lần. Level (xem xp.service.js#getLifetimeXpService) mới
// là chỉ số trọn đời, tách biệt với leaderboard.
const LESSON_XP_TYPES = new Set(["Lesson Completed", "Practice Quiz Passed", "Course Completed"]);
const ATTENDANCE_XP_TYPES = new Set(["Attendance Present"]);
const GRADE_XP_TYPES = new Set(["Assignment Submitted", "Exam Finished"]);

const startOfIsoWeek = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=CN, 1=Thứ 2, ... 6=Thứ 7
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
};

/** Gộp các dòng {_id: activityType, totalXP} thành 3 nhóm hiển thị cho giáo viên (lessonXP/attendanceXP/gradeXP). */
const bucketizeXpByType = (xpByType = []) => {
  let lessonXP = 0;
  let attendanceXP = 0;
  let gradeXP = 0;

  for (const stat of xpByType) {
    if (LESSON_XP_TYPES.has(stat._id)) lessonXP += stat.totalXP;
    else if (ATTENDANCE_XP_TYPES.has(stat._id)) attendanceXP += stat.totalXP;
    else if (GRADE_XP_TYPES.has(stat._id)) gradeXP += stat.totalXP;
  }

  return { lessonXP, attendanceXP, gradeXP };
};

class LearningRankingService {
  /**
   * Lấy Bảng xếp hạng của lớp học (tuần hiện tại, theo giờ UTC)
   */
  async getClassRanking(classId, queryOptions = {}) {
    const cid = new mongoose.Types.ObjectId(classId);
    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 20, 10)));
    const weekStart = startOfIsoWeek();

    const pipeline = [
      { $match: { classId: cid, status: "ACTIVE" } },

      {
        $lookup: {
          from: "learningactivities",
          let: { sid: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$classId", cid] },
                    { $eq: ["$studentId", "$$sid"] },
                    { $gte: ["$createdAt", weekStart] },
                  ],
                },
              },
            },
            { $group: { _id: "$activityType", totalXP: { $sum: "$xpAwarded" } } },
          ],
          as: "xpByType",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          studentId: 1,
          fullName: "$userInfo.fullName",
          email: "$userInfo.email",
          avatar: "$userInfo.avatar",
          xpByType: 1,
        },
      },
    ];

    const rawRanking = await ClassEnrollment.aggregate(pipeline);

    const ranking = rawRanking.map(({ xpByType, ...rest }) => {
      const { lessonXP, attendanceXP, gradeXP } = bucketizeXpByType(xpByType);
      return {
        ...rest,
        lessonXP,
        attendanceXP,
        gradeXP,
        totalXP: lessonXP + attendanceXP + gradeXP,
      };
    });

    ranking.sort((a, b) => b.totalXP - a.totalXP || a.fullName.localeCompare(b.fullName));

    // Xử lý đồng hạng: cùng totalXP -> cùng rank; totalXP=0 -> chưa có thứ hạng thi đua.
    let currentRank = 1;
    for (let i = 0; i < ranking.length; i++) {
      const item = ranking[i];
      if (!item.totalXP) {
        item.rank = null;
      } else {
        if (i > 0 && ranking[i - 1].totalXP && item.totalXP < ranking[i - 1].totalXP) {
          currentRank = i + 1;
        }
        item.rank = currentRank;
      }
    }

    const totalItems = ranking.length;
    const items = ranking.slice((page - 1) * limit, page * limit);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Lấy Rank của một học sinh cụ thể
   */
  async getStudentRanking(classId, studentId) {
    const fullRanking = await this.getClassRanking(classId, { page: 1, limit: 10000 });
    const studentRank = fullRanking.items.find(
      (r) => r.studentId.toString() === studentId.toString()
    );
    return studentRank || null;
  }
}

export default new LearningRankingService();
