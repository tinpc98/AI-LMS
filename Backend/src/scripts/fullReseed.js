// RESEED TOÀN BỘ DATABASE — xóa sạch mọi collection và tạo lại dữ liệu MASTER (tài khoản, khóa
// học, lớp, chủ đề, kỹ năng, câu hỏi, bài giảng, bài tập, đề thi) đúng chuẩn nghiệp vụ hiện tại,
// theo yêu cầu người dùng 2026-08-27 ("vì là mới là dữ liệu test, ... xóa đi và ghi lại chuẩn dữ
// liệu theo nghiệp vụ bây giờ").
//
// CỐ Ý ĐỂ TRỐNG các collection "lịch sử hoạt động" (ExamAttempt/AssignmentAttempt/Attendance/
// LearningActivity(XP)/StudentBadge/Notification/Grade/Message/AIUsage/Payment/Payroll/...) —
// đây là dữ liệu PHẢI phát sinh từ hành vi thật của người dùng để đúng nghiệp vụ (VD StudentBadge
// chỉ nên tồn tại vì logic trao huy hiệu thật sự chạy), bịa sẵn sẽ lại tạo ra đúng loại dữ liệu
// sai lệch mà cả phiên làm việc trước đó đã dọn dẹp. Cũng DROP hẳn các collection không còn model
// nào quản lý (submissions/products/categories/livesessions/progresses/quizsubmissions/ailogs/
// lectureais/submissionaifeedbacks) — rác từ tính năng đã gỡ bỏ từ lâu.
//
// AN TOÀN: đã backup TOÀN BỘ 63 collection (2165 document) vào
// scratchpad/db_backup_full/*.json trước khi chạy file này. Bắt buộc cờ --confirm, từ chối chạy
// khi NODE_ENV=production, chỉ chạy khi gọi trực tiếp — xem feedback-destructive-script-incident.
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import { v4 as uuidv4 } from "uuid";
import { pathToFileURL } from "node:url";

import User from "../modules/auth/user.model.js";
import Subject from "../modules/subject/subject.model.js";
import Course from "../modules/course/course.model.js";
import Topic from "../modules/topic/topic.model.js";
import Skill from "../modules/skill/skill.model.js";
import Class from "../modules/class/class.model.js";
import Enrollment from "../modules/enrollment/enrollment.model.js";
import ClassEnrollment from "../modules/classEnrollment/classEnrollment.model.js";
import Question from "../modules/question/question.model.js";
import Lesson from "../modules/lesson/lesson.model.js";
import PracticeQuiz from "../modules/lesson/practiceQuiz.model.js";
import Assignment from "../modules/assignment/assignment.model.js";
import Exam from "../modules/exam/exam.model.js";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const DEMO_PASSWORD = "Demo@123456";

const DEAD_COLLECTIONS = [
  "submissions",
  "products",
  "categories",
  "livesessions",
  "progresses",
  "quizsubmissions",
  "ailogs",
  "lectureais",
  "submissionaifeedbacks",
];

const wrap = (text) => [{ id: uuidv4(), type: "TEXT", order: 0, text }];

// ─────────────────────────────────────────────────────────────────────────────
// NỘI DUNG NGHIỆP VỤ THẬT theo 6 môn học của dự án
// ─────────────────────────────────────────────────────────────────────────────
const CURRICULUM = [
  {
    subject: "Lập trình Web nâng cao",
    code: "WEB202",
    grade: 12,
    topics: [
      {
        name: "React Hooks & State Management",
        skills: ["useState & useEffect", "Context API & Custom Hooks"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Hook nào dùng để thêm state vào một function component trong React?",
            options: [
              ["useState", true],
              ["useRender", false],
              ["useClass", false],
              ["useProps", false],
            ],
          },
          {
            type: "MCQ",
            skill: 0,
            difficulty: "MEDIUM",
            q: "useEffect với mảng dependency rỗng ([]) sẽ chạy khi nào?",
            options: [
              ["Chỉ 1 lần sau lần render đầu tiên", true],
              ["Sau mỗi lần render", false],
              ["Không bao giờ chạy", false],
              ["Chỉ khi component unmount", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "EASY",
            q: "Context API giúp truyền dữ liệu qua nhiều cấp component mà không cần prop drilling.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: 'Custom Hook bắt buộc phải bắt đầu bằng tiền tố "use" để React nhận diện đúng quy tắc Hook.',
            correct: true,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết tên Hook dùng để ghi nhớ (memo hóa) kết quả tính toán tốn kém giữa các lần render.",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Trình bày khi nào nên tách logic ra thành Custom Hook thay vì viết trực tiếp trong component, cho ví dụ minh họa.",
          },
        ],
      },
      {
        name: "REST API & Node.js Backend",
        skills: ["Thiết kế REST API", "Middleware & Xác thực (JWT)"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Phương thức HTTP nào phù hợp nhất để cập nhật TOÀN BỘ 1 resource đã tồn tại?",
            options: [
              ["PUT", true],
              ["GET", false],
              ["OPTIONS", false],
              ["HEAD", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Trong Express.js, middleware xác thực JWT thường được gắn ở đâu để bảo vệ 1 route?",
            options: [
              ["Trước handler chính của route, dùng router.use() hoặc tham số thứ 2", true],
              ["Trong file package.json", false],
              ["Chỉ ở tầng database", false],
              ["Không cần middleware, xác thực ở frontend là đủ", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: "Mã trạng thái HTTP 201 nghĩa là resource đã được tạo thành công.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "JWT (JSON Web Token) nên được lưu vĩnh viễn không hết hạn để tránh phiền người dùng đăng nhập lại.",
            correct: false,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết mã trạng thái HTTP chuẩn khi client gửi request nhưng không có quyền truy cập resource (đã xác thực nhưng không đủ quyền).",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "So sánh ưu và nhược điểm giữa xác thực bằng Session (cookie) và xác thực bằng JWT (stateless) cho 1 hệ thống API quy mô lớn.",
          },
        ],
      },
    ],
  },
  {
    subject: "Cơ sở dữ liệu NoSQL",
    code: "DB301",
    grade: 12,
    topics: [
      {
        name: "Thiết kế Schema MongoDB",
        skills: ["Embed vs Reference", "Chỉ mục (Index)"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "MongoDB là loại cơ sở dữ liệu nào?",
            options: [
              ["Document-oriented (NoSQL)", true],
              ["Quan hệ (SQL)", false],
              ["Đồ thị (Graph)", false],
              ["Key-Value thuần túy", false],
            ],
          },
          {
            type: "MCQ",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Khi nào nên EMBED một document con thay vì REFERENCE?",
            options: [
              ["Khi dữ liệu con luôn được đọc cùng document cha và ít khi cập nhật riêng lẻ", true],
              ["Khi dữ liệu con rất lớn và tăng trưởng không giới hạn", false],
              ["Khi nhiều document cha cùng chia sẻ 1 document con", false],
              ["Khi cần transaction phức tạp giữa nhiều collection", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "EASY",
            q: "Index giúp tăng tốc truy vấn nhưng làm chậm thao tác ghi (insert/update).",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Unique index cho phép nhiều document có cùng giá trị ở field được đánh index.",
            correct: false,
          },
          {
            type: "SHORT_ANSWER",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Viết tên lệnh Mongoose dùng để tạo lại toàn bộ index đã khai báo trong schema.",
          },
          {
            type: "ESSAY",
            skill: 0,
            difficulty: "HARD",
            q: "So sánh ưu/nhược điểm của việc EMBED và REFERENCE khi thiết kế schema cho hệ thống blog (Post - Comment).",
          },
        ],
      },
      {
        name: "Aggregation Pipeline",
        skills: ["Các stage cơ bản ($match/$group)", "$lookup & Join dữ liệu"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Stage nào dùng để lọc document trước khi xử lý tiếp trong Aggregation Pipeline?",
            options: [
              ["$match", true],
              ["$project", false],
              ["$sort", false],
              ["$limit", false],
            ],
          },
          {
            type: "MCQ",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Stage $group thường dùng kèm toán tử nào để tính tổng?",
            options: [
              ["$sum", true],
              ["$concat", false],
              ["$type", false],
              ["$slice", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: "Stage $match nên đặt càng sớm càng tốt trong pipeline để giảm số document xử lý ở các stage sau.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "$lookup dùng để JOIN dữ liệu giữa 2 collection, tương tự JOIN trong SQL.",
            correct: true,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết tên stage Aggregation dùng để nhóm document theo 1 field và tính tổng.",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Giải thích vì sao $lookup có thể ảnh hưởng hiệu năng khi dùng trên collection lớn, và cách giảm thiểu (gợi ý: index, giới hạn dữ liệu trước khi lookup).",
          },
        ],
      },
    ],
  },
  {
    subject: "Trí tuệ nhân tạo",
    code: "AI401",
    grade: 12,
    topics: [
      {
        name: "Nhập môn Machine Learning",
        skills: ["Học có giám sát (Supervised)", "Overfitting & Underfitting"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Học có giám sát (Supervised Learning) cần loại dữ liệu nào để huấn luyện?",
            options: [
              ["Dữ liệu đã có nhãn (label)", true],
              ["Dữ liệu hoàn toàn không có nhãn", false],
              ["Chỉ cần dữ liệu hình ảnh", false],
              ["Không cần dữ liệu, chỉ cần luật cố định", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Overfitting xảy ra khi nào?",
            options: [
              ["Mô hình học quá khớp với dữ liệu huấn luyện, dự đoán kém trên dữ liệu mới", true],
              ["Mô hình quá đơn giản để học được pattern", false],
              ["Mô hình có quá ít tham số", false],
              ["Dữ liệu huấn luyện quá nhiều", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: "Hồi quy tuyến tính (Linear Regression) là một thuật toán học có giám sát.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Tăng độ phức tạp của mô hình luôn giúp giảm cả sai số huấn luyện lẫn sai số kiểm tra.",
            correct: false,
          },
          {
            type: "SHORT_ANSWER",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Viết tên kỹ thuật chia dữ liệu thành train/validation/test để đánh giá mô hình khách quan.",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Trình bày 2 kỹ thuật cụ thể để giảm overfitting khi huấn luyện mô hình học máy.",
          },
        ],
      },
      {
        name: "Xử lý ngôn ngữ tự nhiên (NLP) cơ bản",
        skills: ["Tokenization & Tiền xử lý", "Word Embedding"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Tokenization trong NLP là gì?",
            options: [
              ["Tách văn bản thành các đơn vị nhỏ hơn (từ/câu)", true],
              ["Mã hóa file thành định dạng nhị phân", false],
              ["Xóa toàn bộ dấu câu", false],
              ["Dịch văn bản sang ngôn ngữ khác", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Word Embedding (như Word2Vec) biểu diễn từ dưới dạng gì?",
            options: [
              ["Vector số thực trong không gian nhiều chiều", true],
              ["Chuỗi ký tự ASCII", false],
              ["Số nguyên đếm tần suất xuất hiện", false],
              ["Ảnh bitmap của từ", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: 'Stop words (từ dừng như "và", "the", "là") thường bị loại bỏ trong bước tiền xử lý văn bản.',
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Các từ có nghĩa gần nhau thường có vector embedding gần nhau trong không gian vector.",
            correct: true,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: 'Viết tên kỹ thuật đưa từ về dạng gốc (VD: "running" -> "run") trong tiền xử lý văn bản.',
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Giải thích vì sao Word Embedding lại hiệu quả hơn phương pháp one-hot encoding truyền thống khi biểu diễn từ vựng lớn.",
          },
        ],
      },
    ],
  },
  {
    subject: "Kiểm thử phần mềm",
    code: "TEST302",
    grade: 12,
    topics: [
      {
        name: "Kiểm thử hộp đen & hộp trắng",
        skills: ["Black-box Testing", "White-box Testing"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Kiểm thử hộp đen (Black-box Testing) tập trung vào điều gì?",
            options: [
              ["Chức năng đầu vào/đầu ra, không quan tâm cấu trúc code bên trong", true],
              ["Từng dòng code và luồng thực thi bên trong", false],
              ["Chỉ kiểm tra hiệu năng server", false],
              ["Chỉ kiểm tra giao diện đồ họa", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Kỹ thuật nào thuộc White-box Testing?",
            options: [
              ["Kiểm thử độ phủ nhánh (Branch Coverage)", true],
              ["Equivalence Partitioning", false],
              ["Boundary Value Analysis", false],
              ["Kiểm thử dựa trên đặc tả yêu cầu", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: "Equivalence Partitioning là kỹ thuật thiết kế test case thuộc Black-box Testing.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "White-box Testing yêu cầu tester phải biết cấu trúc mã nguồn bên trong hệ thống.",
            correct: true,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết tên kỹ thuật kiểm thử tập trung vào các giá trị biên (min/max) của 1 khoảng dữ liệu hợp lệ.",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "So sánh chi phí và mục tiêu sử dụng giữa Black-box Testing và White-box Testing trong 1 dự án thực tế.",
          },
        ],
      },
      {
        name: "Kiểm thử tự động (Automation Testing)",
        skills: ["Unit Testing", "CI/CD & Regression Testing"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Unit Testing kiểm thử ở mức độ nào của hệ thống?",
            options: [
              ["Từng đơn vị code nhỏ nhất (hàm/method) một cách độc lập", true],
              ["Toàn bộ hệ thống end-to-end", false],
              ["Chỉ giao diện người dùng", false],
              ["Chỉ cơ sở dữ liệu", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Regression Testing được thực hiện khi nào?",
            options: [
              ["Sau khi code thay đổi, để đảm bảo chức năng cũ không bị hỏng", true],
              ["Chỉ khi phát hành sản phẩm lần đầu", false],
              ["Chỉ khi có lỗi bảo mật", false],
              ["Không cần thực hiện nếu đã có Unit Test", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: "Unit Test tốt nên độc lập, không phụ thuộc vào thứ tự chạy của các test khác.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "CI/CD Pipeline thường tự động chạy bộ test khi có code mới được push lên.",
            correct: true,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết tên kỹ thuật thay thế 1 dependency thật bằng đối tượng giả để cô lập Unit Test.",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Trình bày lợi ích của việc tích hợp Automation Testing vào pipeline CI/CD so với kiểm thử thủ công.",
          },
        ],
      },
    ],
  },
  {
    subject: "Tiếng Anh chuyên ngành",
    code: "ENG102",
    grade: 12,
    topics: [
      {
        name: "Từ vựng CNTT cơ bản",
        skills: ["Thuật ngữ phần cứng/phần mềm", "Đọc hiểu tài liệu kỹ thuật"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: '"Debugging" trong tiếng Anh chuyên ngành CNTT nghĩa là gì?',
            options: [
              ["Tìm và sửa lỗi trong chương trình", true],
              ["Viết tài liệu hướng dẫn", false],
              ["Cài đặt phần mềm mới", false],
              ["Sao lưu dữ liệu", false],
            ],
          },
          {
            type: "MCQ",
            skill: 0,
            difficulty: "MEDIUM",
            q: 'Từ nào đồng nghĩa gần nhất với "repository" trong ngữ cảnh lập trình?',
            options: [
              ["Kho lưu trữ mã nguồn", true],
              ["Trình duyệt web", false],
              ["Bộ nhớ đệm (cache)", false],
              ["Giao diện người dùng", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "EASY",
            q: '"Deprecated" nghĩa là một tính năng vẫn được khuyến khích sử dụng lâu dài.',
            correct: false,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Đọc tài liệu kỹ thuật (technical documentation) tiếng Anh là kỹ năng cần thiết cho lập trình viên.",
            correct: true,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết từ tiếng Anh chỉ hành động triển khai ứng dụng lên môi trường thực tế (đưa vào sử dụng).",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Viết đoạn văn ngắn (3-5 câu) bằng tiếng Anh mô tả 1 lỗi phần mềm (bug) bạn gặp phải và cách bạn xử lý nó.",
          },
        ],
      },
      {
        name: "Giao tiếp trong môi trường IT",
        skills: ["Email & báo cáo công việc", "Thuyết trình kỹ thuật"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "Cụm từ nào phù hợp để mở đầu 1 email công việc trang trọng?",
            options: [
              ["Dear Mr./Ms. [Tên]", true],
              ["Hey dude", false],
              ["Yo!", false],
              ["Whatever", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Trong thuyết trình kỹ thuật, phần nào nên xuất hiện đầu tiên để người nghe nắm được bối cảnh?",
            options: [
              ["Giới thiệu vấn đề/mục tiêu (Introduction/Objective)", true],
              ["Kết luận chi tiết", false],
              ["Câu hỏi & trả lời", false],
              ["Phần cảm ơn", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: '"Best regards" là cách kết thúc email trang trọng phổ biến.',
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Slide thuyết trình kỹ thuật nên chứa toàn bộ văn bản chi tiết để người nghe tự đọc thay vì nghe trình bày.",
            correct: false,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết cụm từ tiếng Anh thường dùng để xin phản hồi (feedback) từ đồng nghiệp trong email.",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Viết 1 email ngắn (bằng tiếng Anh) báo cáo tiến độ 1 dự án phần mềm cho quản lý, nêu rõ việc đã hoàn thành và khó khăn gặp phải.",
          },
        ],
      },
    ],
  },
  {
    subject: "Phát triển ứng dụng Di động",
    code: "MOB201",
    grade: 12,
    topics: [
      {
        name: "React Native cơ bản",
        skills: ["Component & Layout (Flexbox)", "Navigation giữa các màn hình"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "React Native dùng hệ thống layout nào để bố trí giao diện?",
            options: [
              ["Flexbox", true],
              ["CSS Grid thuần", false],
              ["Table layout", false],
              ["Absolute positioning bắt buộc", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Thư viện phổ biến nào dùng để điều hướng giữa các màn hình trong React Native?",
            options: [
              ["React Navigation", true],
              ["React Router DOM", false],
              ["Express Router", false],
              ["Vue Router", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: "Component <View> trong React Native tương đương với <div> trong web.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Stack Navigator hiển thị các màn hình theo dạng chồng lên nhau, có thể quay lại (back) màn hình trước.",
            correct: true,
          },
          {
            type: "SHORT_ANSWER",
            skill: 0,
            difficulty: "MEDIUM",
            q: "Viết tên thuộc tính Flexbox dùng để căn giữa các phần tử con theo trục chính (main axis).",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "So sánh Stack Navigator và Tab Navigator trong React Navigation, cho ví dụ tình huống phù hợp với mỗi loại.",
          },
        ],
      },
      {
        name: "Lưu trữ dữ liệu cục bộ & API",
        skills: ["AsyncStorage & Lưu trữ local", "Gọi API & xử lý bất đồng bộ"],
        questions: [
          {
            type: "MCQ",
            skill: 0,
            difficulty: "EASY",
            q: "AsyncStorage trong React Native dùng để làm gì?",
            options: [
              ["Lưu trữ dữ liệu dạng key-value không đồng bộ trên thiết bị", true],
              ["Truy vấn cơ sở dữ liệu SQL từ xa", false],
              ["Hiển thị hình ảnh", false],
              ["Quản lý animation", false],
            ],
          },
          {
            type: "MCQ",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Cú pháp nào dùng để xử lý bất đồng bộ khi gọi API trong JavaScript hiện đại?",
            options: [
              ["async/await", true],
              ["for...in", false],
              ["switch...case", false],
              ["try...finally (một mình, không kèm gì)", false],
            ],
          },
          {
            type: "TRUE_FALSE",
            skill: 0,
            difficulty: "EASY",
            q: "Dữ liệu lưu trong AsyncStorage vẫn còn sau khi tắt và mở lại ứng dụng.",
            correct: true,
          },
          {
            type: "TRUE_FALSE",
            skill: 1,
            difficulty: "MEDIUM",
            q: "fetch() trả về ngay lập tức dữ liệu JSON mà không cần xử lý Promise.",
            correct: false,
          },
          {
            type: "SHORT_ANSWER",
            skill: 1,
            difficulty: "MEDIUM",
            q: "Viết tên đối tượng JavaScript đại diện cho một giá trị sẽ có trong tương lai (kết quả của thao tác bất đồng bộ).",
          },
          {
            type: "ESSAY",
            skill: 1,
            difficulty: "HARD",
            q: "Trình bày cách xử lý lỗi (error handling) hợp lý khi gọi API bị mất kết nối mạng trong ứng dụng di động.",
          },
        ],
      },
    ],
  },
];

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes("--confirm")) {
    console.error("❌ Thiếu cờ --confirm. Chạy: node fullReseed.js --confirm");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Từ chối chạy khi NODE_ENV=production.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000, family: 4 });
  const db = mongoose.connection.db;
  console.log("Đã kết nối MongoDB.\n");

  console.log("=".repeat(70));
  console.log("XÓA TOÀN BỘ COLLECTION");
  console.log("=".repeat(70));
  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    await db.collection(name).deleteMany({});
  }
  for (const name of DEAD_COLLECTIONS) {
    await db
      .collection(name)
      .drop()
      .catch(() => {});
  }
  console.log(
    `Đã xóa sạch ${collections.length} collection, drop ${DEAD_COLLECTIONS.length} collection rác không còn model quản lý.`
  );

  console.log("\n" + "=".repeat(70));
  console.log("TẠO DỮ LIỆU MASTER");
  console.log("=".repeat(70));

  // --- Users ---
  const admin = await User.create({
    fullName: "Quản trị viên",
    email: "admin@system.com",
    password: DEMO_PASSWORD,
    role: "Admin",
  });
  console.log(`[User] Admin: ${admin.email}`);

  const teachers = [];
  for (const c of CURRICULUM) {
    const t = await User.create({
      fullName: `GV. ${c.subject}`,
      email: `teacher.${c.code.toLowerCase()}@eduspace.vn`,
      password: DEMO_PASSWORD,
      role: "Teacher",
    });
    teachers.push(t);
  }
  console.log(`[User] ${teachers.length} giáo viên (1 mỗi môn học).`);

  const students = [];
  for (let i = 1; i <= 18; i++) {
    const s = await User.create({
      fullName: `Học sinh ${String(i).padStart(2, "0")}`,
      email: `student${String(i).padStart(2, "0")}@eduspace.vn`,
      password: DEMO_PASSWORD,
      role: "Student",
    });
    students.push(s);
  }
  console.log(`[User] ${students.length} học sinh.`);

  let studentCursor = 0;
  const nextStudents = (n) => {
    const picked = [];
    for (let i = 0; i < n; i++) {
      picked.push(students[studentCursor % students.length]);
      studentCursor++;
    }
    return picked;
  };

  // --- Subject / Course / Class / Topic / Skill / Question / Lesson / PracticeQuiz / Assignment / Exam ---
  let totalTopics = 0,
    totalSkills = 0,
    totalQuestions = 0,
    totalLessons = 0,
    totalQuizzes = 0,
    totalAssignments = 0,
    totalExams = 0;

  for (let ci = 0; ci < CURRICULUM.length; ci++) {
    const c = CURRICULUM[ci];
    const teacher = teachers[ci];

    const subject = await Subject.create({
      name: c.subject,
      code: c.code,
      description: `Môn học ${c.subject}`,
      status: "ACTIVE",
      createdBy: admin._id,
      updatedBy: admin._id,
    });

    const course = await Course.create({
      name: c.subject,
      code: c.code,
      subjectId: subject._id,
      grade: c.grade,
      description: `Khóa học ${c.subject} dành cho học sinh lớp ${c.grade}.`,
      prices: { FOUNDATION: 0, INTERMEDIATE: 500000, ADVANCED: 1000000 },
      duration: { value: 12, unit: "WEEK" },
      status: "PUBLISHED",
      createdBy: teacher._id,
    });

    const klass = await Class.create({
      name: `Lớp ${c.code} - K1`,
      code: `${c.code}_K1`,
      courseId: course._id,
      level: "FOUNDATION",
      teacherId: teacher._id,
      assignedBy: admin._id,
      assignedAt: new Date(),
      capacity: 30,
    });

    const classStudents = nextStudents(3);
    for (const st of classStudents) {
      const enrollment = await Enrollment.create({
        studentId: st._id,
        courseId: course._id,
        status: "CLASS_ASSIGNED",
        level: "FOUNDATION",
        price: 0,
      });
      await ClassEnrollment.create({
        enrollmentId: enrollment._id,
        studentId: st._id,
        classId: klass._id,
        status: "ACTIVE",
        createdBy: admin._id,
      });
    }

    const examQuestionRefs = [];

    for (const t of c.topics) {
      const topic = await Topic.create({
        name: t.name,
        courseId: course._id,
        order: totalTopics + 1,
        createdBy: teacher._id,
      });
      totalTopics++;

      const skillDocs = [];
      for (const skillName of t.skills) {
        const skill = await Skill.create({
          topicId: topic._id,
          name: skillName,
          order: skillDocs.length + 1,
        });
        skillDocs.push(skill);
        totalSkills++;
      }

      const questionDocs = [];
      for (const qDef of t.questions) {
        const isChoice = qDef.type === "MCQ" || qDef.type === "TRUE_FALSE";
        const options = isChoice
          ? qDef.options
            ? qDef.options.map(([text, isCorrect], i) => ({
                id: `opt-${i}`,
                content: wrap(text),
                isCorrect,
                order: i,
              }))
            : [
                { id: "opt-0", content: wrap("Đúng"), isCorrect: qDef.correct === true, order: 0 },
                { id: "opt-1", content: wrap("Sai"), isCorrect: qDef.correct === false, order: 1 },
              ]
          : [];
        const question = await Question.create({
          topicId: topic._id,
          primarySkillId: skillDocs[qDef.skill]._id,
          type: qDef.type,
          selectionMode: qDef.type === "MCQ" || qDef.type === "TRUE_FALSE" ? "SINGLE" : undefined,
          content: wrap(qDef.q),
          options,
          difficulty: qDef.difficulty,
          points: qDef.difficulty === "EASY" ? 1 : qDef.difficulty === "MEDIUM" ? 2 : 3,
          createdBy: teacher._id,
          status: "PUBLISHED",
        });
        questionDocs.push(question);
        totalQuestions++;
      }
      examQuestionRefs.push(
        ...questionDocs.filter((q) => q.type === "MCQ" || q.type === "TRUE_FALSE")
      );

      const quizQuestions = questionDocs.filter((q) => q.type === "MCQ" || q.type === "TRUE_FALSE");
      const quiz = await PracticeQuiz.create({
        title: `Ôn tập: ${t.name}`,
        questions: quizQuestions.map((q, i) => ({ questionId: q._id, order: i })),
        createdBy: teacher._id,
      });
      totalQuizzes++;

      await Lesson.create({
        topicId: topic._id,
        title: `Bài 1: Lý thuyết ${t.name}`,
        description: `Bài giảng lý thuyết cho chủ đề ${t.name}.`,
        blocks: [
          {
            type: "VIDEO",
            order: 0,
            isRequired: true,
            video: {
              platform: "YOUTUBE",
              externalId: "dQw4w9WgXcQ",
              url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              title: `[Demo] ${t.name}`,
              durationSeconds: 600,
            },
          },
        ],
        order: 0,
        status: "PUBLISHED",
        createdBy: teacher._id,
      });
      await Lesson.create({
        topicId: topic._id,
        title: `Bài 2: Luyện tập ${t.name}`,
        description: `Bài giảng luyện tập kèm Practice Quiz cho chủ đề ${t.name}.`,
        blocks: [
          {
            type: "VIDEO",
            order: 0,
            isRequired: true,
            video: {
              platform: "YOUTUBE",
              externalId: "dQw4w9WgXcQ",
              url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              title: `[Demo] Luyện tập ${t.name}`,
              durationSeconds: 480,
            },
          },
          { type: "PRACTICE_QUIZ", order: 1, isRequired: false, quizId: quiz._id },
        ],
        order: 1,
        status: "PUBLISHED",
        createdBy: teacher._id,
      });
      totalLessons += 2;

      await Assignment.create({
        topicId: topic._id,
        title: `Bài tập: ${t.name}`,
        description: `Bài tập tự luận củng cố kiến thức chủ đề ${t.name}.`,
        questions: questionDocs
          .slice(0, 2)
          .map((q, i) => ({ questionId: q._id, order: i, points: q.points || 1 })),
        duration: 45,
        endAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        status: "PUBLISHED",
        createdBy: teacher._id,
      });
      totalAssignments++;
    }

    // startAt/endAt bắt buộc phải có giá trị thật: job examLifecycle (chạy mỗi 10 phút) coi
    // exam PUBLISHED thiếu cả 2 field này là "đã hết giờ" (startAt null -> $add ra null ->
    // luôn nhỏ hơn "now") và tự động ARCHIVED ngay lượt chạy đầu tiên.
    await Exam.create({
      classId: klass._id,
      title: `Đề thi cuối khóa: ${c.subject}`,
      description: `Đề thi tổng hợp kiến thức khóa học ${c.subject}.`,
      questions: examQuestionRefs.map((q, i) => ({
        questionId: q._id,
        order: i,
        points: q.points || 1,
      })),
      duration: 60,
      attemptsAllowed: 1,
      status: "PUBLISHED",
      createdBy: teacher._id,
      startAt: new Date(),
      endAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });
    totalExams++;

    console.log(`[${c.code}] Subject+Course+Class+${c.topics.length} Topic OK.`);
  }

  console.log("\nTổng kết:");
  console.log(`  Subject/Course/Class: ${CURRICULUM.length} mỗi loại`);
  console.log(`  Topic: ${totalTopics}, Skill: ${totalSkills}, Question: ${totalQuestions}`);
  console.log(
    `  Lesson: ${totalLessons}, PracticeQuiz: ${totalQuizzes}, Assignment: ${totalAssignments}, Exam: ${totalExams}`
  );
  console.log(`  User: 1 Admin + ${teachers.length} Teacher + ${students.length} Student`);
  console.log(`  Mật khẩu đăng nhập cho MỌI tài khoản demo: "${DEMO_PASSWORD}"`);

  await mongoose.disconnect();
  console.log("\nHoàn tất.");
  process.exit(0);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((e) => {
    console.error("Reseed thất bại:", e);
    process.exit(1);
  });
}
