import type { PromptTemplate } from "../types/aiManagement.types";

export const mockPromptTemplates: PromptTemplate[] = [
  {
    id: "p-1",
    name: "AI Chatbot Assistant",
    category: "Chatbot",
    modelId: "m-1",
    description: "Trợ lý AI hỗ trợ giải đáp thắc mắc môn học 24/7 cho học sinh.",
    systemPrompt:
      "Bạn là trợ lý học tập AI chuyên nghiệp của trung tâm AI LMS. Hãy trả lời ngắn gọn, chính xác, thân thiện bằng Tiếng Việt và đưa ra ví dụ minh họa khi giải thích các khái niệm THPT Quốc Gia.",
    userPrompt:
      "Học sinh {{student_name}} thuộc môn {{subject}} hỏi: {{user_question}}. Hãy giải đáp từng bước chi tiết.",
    variables: ["student_name", "subject", "user_question"],
    status: "Active",
    createdAt: "2025-02-10T09:00:00.000Z",
    updatedAt: "2026-03-01T10:30:00.000Z",
  },
  {
    id: "p-2",
    name: "Tóm tắt bài học tự động",
    category: "Summary",
    modelId: "m-2",
    description: "Tạo bản tóm tắt kiến thức trọng tâm và sơ đồ tư duy từ nội dung bài giảng.",
    systemPrompt:
      "Bạn là chuyên gia sư phạm THPT. Nhiệm vụ của bạn là trích xuất 5 kiến thức cốt lõi, danh sách công thức quan trọng và các bẫy thường gặp trong đề thi.",
    userPrompt:
      "Dưới đây là nội dung bài học {{lesson_title}} môn {{subject}}:\n{{lesson_content}}\nHãy tóm tắt theo chuẩn cấu trúc ôn thi THPT Quốc Gia.",
    variables: ["lesson_title", "subject", "lesson_content"],
    status: "Active",
    createdAt: "2025-02-15T14:20:00.000Z",
    updatedAt: "2026-02-25T11:15:00.000Z",
  },
  {
    id: "p-3",
    name: "Tạo câu hỏi trắc nghiệm Quiz",
    category: "Quiz Generator",
    modelId: "m-1",
    description: "Sinh tự động bộ câu hỏi trắc nghiệm 4 lựa chọn có đáp án giải thích.",
    systemPrompt:
      "Bạn là ngân hàng đề thi chuẩn Bộ GD&ĐT. Hãy tạo ra các câu hỏi trắc nghiệm có độ phân hóa từ Nhận biết đến Vận dụng cao.",
    userPrompt:
      "Tạo {{question_count}} câu hỏi trắc nghiệm chủ đề {{topic}} độ khó {{difficulty}}. Trả về định dạng JSON gồm question, options, correctIndex, explanation.",
    variables: ["question_count", "topic", "difficulty"],
    status: "Active",
    createdAt: "2025-03-01T08:00:00.000Z",
    updatedAt: "2026-03-05T09:00:00.000Z",
  },
  {
    id: "p-4",
    name: "Sinh đề thi chuẩn cấu trúc",
    category: "Exam Generator",
    modelId: "m-2",
    description: "Tạo đề kiểm tra 45 phút hoặc 90 phút có ma trận đề thi chuẩn.",
    systemPrompt:
      "Bạn là chuyên gia ra đề thi THPT Quốc Gia. Đảm bảo tỷ lệ 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao.",
    userPrompt:
      "Hãy lập đề thi môn {{subject}} thời gian {{duration}} phút gồm {{total_questions}} câu thuộc các chương: {{chapters}}.",
    variables: ["subject", "duration", "total_questions", "chapters"],
    status: "Active",
    createdAt: "2025-03-12T10:00:00.000Z",
    updatedAt: "2026-02-18T15:30:00.000Z",
  },
  {
    id: "p-5",
    name: "Chấm điểm tự luận & bài tập",
    category: "Essay Evaluation",
    modelId: "m-3",
    description: "Phân tích bài làm tự luận Tiếng Anh / Ngữ Văn, sửa lỗi sai và cho điểm chi tiết.",
    systemPrompt:
      "Bạn là giám khảo chấm thi uy tín. Nhận xét ưu điểm, chỉ ra các lỗi từ vựng, ngữ pháp, logic và gợi ý cách sửa nâng band điểm.",
    userPrompt:
      "Đề bài: {{prompt_title}}\nBài làm của học sinh:\n{{student_essay}}\nHãy chấm theo thang điểm 10 kèm feedback.",
    variables: ["prompt_title", "student_essay"],
    status: "Active",
    createdAt: "2025-04-01T11:00:00.000Z",
    updatedAt: "2026-01-10T08:20:00.000Z",
  },
  {
    id: "p-6",
    name: "Gợi ý lộ trình học tập cá nhân",
    category: "Learning Recommendation",
    modelId: "m-4",
    description: "Phân tích điểm số yếu kém và đề xuất bài luyện tập khắc phục.",
    systemPrompt:
      "Bạn là cố vấn học tập AI. Phân tích kết quả luyện đề để xác định lỗ hổng kiến thức và thiết kế bài luyện 15 phút hàng ngày.",
    userPrompt:
      "Học sinh có lịch sử làm bài môn {{subject}} như sau:\n{{performance_data}}\nHãy đưa ra 3 chủ đề cần ôn gấp và bài tập phù hợp.",
    variables: ["subject", "performance_data"],
    status: "Disabled",
    createdAt: "2025-05-10T16:00:00.000Z",
    updatedAt: "2025-11-20T12:00:00.000Z",
  },
];
