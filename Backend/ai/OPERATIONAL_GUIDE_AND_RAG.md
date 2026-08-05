# Hướng Dẫn Vận Hành & Cấu Hình RAG (Operational & RAG Guide)

Tài liệu này hướng dẫn cách cấu hình, vận hành và xử lý sự cố cho hệ thống **RAG Vector Search** và các dịch vụ AI trong AI-LMS.

---

## 1. Cấu Hình MongoDB Atlas Vector Search Index

Tính năng AI Chat RAG dùng tính năng Vector Search trực tiếp trên MongoDB Atlas. Chỉ mục này **không được tạo tự động qua Mongoose Script**, người vận hành phải cấu hình trên MongoDB Atlas Dashboard hoặc Atlas CLI.

### 1.1 Thông số Index Definition (JSON)
- **Database/Collection**: `<TÊN_DB>.aiknowledgechunks`
- **Tên Index mặc định**: `ai_knowledge_vector_index` (khớp với biến môi trường `AI_VECTOR_INDEX_NAME`).

```json
{
  "name": "ai_knowledge_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      },
      { "type": "filter", "path": "classId" },
      { "type": "filter", "path": "lessonId" },
      { "type": "filter", "path": "status" },
      { "type": "filter", "path": "isDeleted" }
    ]
  }
}
```

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ DIMENSIONS**:
> `numDimensions: 768` phải khớp tuyệt đối với cấu hình `AI_EMBEDDING_DIMENSIONS=768` trong `.env`. Nếu đổi sang mô hình embedding khác (ví dụ OpenAI `text-embedding-3-small` với 1536 dims), người vận hành bắt buộc phải:
> 1. Cập nhật lại `numDimensions` trên Atlas Search Index.
> 2. Kích hoạt Re-index toàn bộ tri thức cũ (`POST /api/ai/lessons/:lessonId/index` với `force=true`).

---

## 2. Danh Sách Biến Môi Trường (.env Configuration)

Cấu hình các biến môi trường trong file `.env` phía Backend:

| Biến Môi Trường | Giá Trị Mặc Định | Ý Nghĩa / Mô Tả |
|---|---|---|
| `GEMINI_API_KEY` | *(Secret)* | API Key kết nối với Google Gemini. |
| `AI_PROVIDER` | `google-gemini` | AI Provider sử dụng (`google-gemini` hoặc `mock`). |
| `AI_MOCK_MODE` | `false` | Bật mode giả lập (dùng trong test/local dev không cần API Key). |
| `AI_MODEL` | `gemini-1.5-flash` | Mô hình LLM mặc định cho xử lý văn bản. |
| `AI_EMBEDDING_MODEL` | `gemini-embedding-2` | Mô hình sinh vector embedding. |
| `AI_EMBEDDING_DIMENSIONS` | `768` | Số chiều vector embedding (bắt buộc khớp Atlas Index). |
| `AI_VECTOR_INDEX_NAME` | `ai_knowledge_vector_index` | Tên Search Index đặt trên MongoDB Atlas. |
| `RAG_TOP_K` | `5` | Số chunk tối đa lấy ra để đưa vào prompt context. |
| `RAG_NUM_CANDIDATES` | `100` | Số ứng viên Atlas quét trước khi xếp hạng (ANN search). |
| `RAG_MIN_SCORE` | `0.65` | Điểm tương đồng tối thiểu để chấp nhận chunk context. |
| `RAG_CHUNK_MAX_CHARS` | `2400` | Kích thước tối đa của mỗi chunk văn bản. |
| `RAG_CHUNK_OVERLAP_CHARS` | `300` | Số ký tự ghi đè/chồng lấp giữa 2 chunk liên tiếp. |

---

## 3. Kiểm Tra Tính Nhất Quán Tri Thức (Embedding Consistency Check)

Khi máy chủ khởi động, `AIKnowledgeIndexingService.checkEmbeddingConfigConsistency()` sẽ tự động chạy để so sánh `AI_EMBEDDING_DIMENSIONS` trong `.env` với kích thước vector của các chunk đã lưu trong CSDL.

- Nếu có sự sai lệch, hệ thống sẽ in cảnh báo:
  ```text
  ⚠️ [RAG Config Warning] AI_EMBEDDING_DIMENSIONS hiện tại (1536) KHÁC với dimensions của dữ liệu đã index trong DB (768). Vector Search có thể trả về sai/thiếu kết quả.
  ```

---

## 4. Khắc Phục Sự Cố Thường Gặp (Troubleshooting)

### ❓ 1. Lỗi `AI_CONFIG_ERROR: Hệ thống Vector Search chưa được cấu hình`
- **Nguyên nhân**: Atlas Search Index chưa được tạo, chưa ở trạng thái `Active`, hoặc tên index trong `.env` không khớp với tên trên Atlas.
- **Cách khắc phục**: Vào Atlas Dashboard -> Atlas Search -> Tạo/Sửa index tên `ai_knowledge_vector_index`.

### ❓ 2. AI Chat không trả về trích dẫn (Chỉ báo "Chưa tìm thấy thông tin trong tài liệu")
- **Nguyên nhân**:
  1. Bài giảng chưa được kích hoạt Re-index tri thức (`POST /api/ai/lessons/:lessonId/index`).
  2. Ngưỡng `RAG_MIN_SCORE` quá cao (thử giảm từ `0.65` xuống `0.55`).
  3. Lệch `numDimensions` giữa Atlas Search và biến `.env`.

### ❓ 3. Lỗi `AI_QUOTA_EXCEEDED`
- **Nguyên nhân**: Người dùng vượt quá lượt dùng AI trong ngày.
- **Cách khắc phục**: Admin vào **AI Management Console** (`/ai-management`) tăng quota trong ngày cho vai trò tương ứng (`studentDailyQuota`, `teacherDailyQuota`).
