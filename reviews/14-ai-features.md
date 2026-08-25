# 14 - Tính năng AI (AI Features)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟡 Cần cải thiện

## 1. Tóm tắt

Module AI cung cấp nhiều tính năng tiên tiến: Tự động chấm điểm (Auto-Grading), Sinh câu hỏi (Question Generation), Tóm tắt bài giảng (Summary), và Chatbot (RAG). Mặc dù API Backend đã được triển khai rõ ràng, phân luồng routing rất sạch sẽ, nhưng trang Quản trị AI (Admin) ở Frontend hoàn toàn là một giao diện tĩnh "chết" sử dụng 100% Mock Data không có API kết nối.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Các Prompts, Models được tổ chức dưới backend. |
| REST API | ✅ Hoàn thành | Đầy đủ 5 cụm API: Summary, Questions, Grading, Knowledge (RAG), Chat. |
| Phân quyền | ✅ Hoàn thành | API Endpoint được bảo mật. |
| Validation | ✅ Hoàn thành | Validate dữ liệu RAG và Chat có xử lý lỗi tại Provider. |
| Frontend - Admin | 🔴 Có lỗi | Toàn bộ trang `AIManagementPage` sử dụng các hooks như `useAIModels`, `usePromptTemplates` nhưng bên trong chỉ set state nội bộ từ thư mục `mock/`. Không có bất kỳ call API nào xuống server để quản lý model/prompt. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ⚠️ Một phần | Ở Admin thì lỗi không thể xảy ra do không gọi API. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API Backend (Hoạt động tốt)

| Method | Path (prefix `/api/ai`) | Vai trò | Trạng thái |
|---|---|---|---|
| POST | `/lectures` | Tóm tắt bài giảng | 🟢 Hoạt động |
| POST | `/lectures/:lessonId/question-sets` | Sinh câu hỏi tự động | 🟢 Hoạt động |
| POST | `/exam-attempts` | Chấm điểm tự luận | 🟢 Hoạt động |
| POST | `/lessons` | Xử lý Knowledge RAG | 🟢 Hoạt động |
| POST | `/chat` | Chatbot hỗ trợ học tập | 🟢 Hoạt động |

## 4. Lỗi phát hiện

### [🔴 Cao] Trang Quản trị AI hoàn toàn là giao diện Fake (MOCK)
- **Mô tả:** Frontend Admin page cho AI (`AIManagementPage.tsx` và toàn bộ hook liên quan như `useAIModels`, `usePromptTemplates`, `useAIFeatures`) hoạt động như một ứng dụng độc lập, chỉ thao tác trên biến array tĩnh. Mọi thao tác thêm/sửa/xóa Model, Cấu hình hay Prompt Template đều bị mất sau khi F5 trang.
- **Vị trí:** `Frontend/src/features/ai/hooks/*`
- **Ảnh hưởng:** Admin không thể cấu hình AI trên thực tế, hệ thống không đáp ứng được tính năng "Cấu hình LLM/Prompt Template qua giao diện quản trị".
- **Đề xuất:** Xây dựng API cấu hình tại Backend để lưu Model Settings / Prompts vào Database, và thay đổi các hooks của FE để gọi xuống API bằng `axiosClient`.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Thêm Model ở trang Admin | Lưu vào Database | Biến mất khi Refresh trang vì chỉ dùng `setState` | Không đạt |

## 6. Nợ kỹ thuật

- Việc xây dựng một trang UI cực kì đồ sộ (có Dashboard, Tables, Drawers, Modals) nhưng lại không có Data Layer thật đằng sau là một khoản nợ kỹ thuật khổng lồ, đánh lừa cảm giác tiến độ của dự án.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Tích hợp API thật cho trang AI Management (CRUD Models, Prompts, Configs) | 🔴 Cao | 16h | Cả hai |
