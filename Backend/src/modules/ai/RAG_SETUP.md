# RAG / Vector Search — Hướng dẫn vận hành (PR-13)

Tính năng AI Chat theo ngữ cảnh bài giảng (RAG — Retrieval Augmented Generation) dùng
**MongoDB Atlas Vector Search** (`$vectorSearch`) để tìm các đoạn nội dung (chunk) liên quan
nhất tới câu hỏi của học sinh, dựa trên embedding vector.

Đây KHÔNG phải một service riêng biệt — không cần thêm hạ tầng mới (không Qdrant/Pinecone/pgvector).
Chỉ cần **một Atlas Search Index** được cấu hình đúng trên collection `aiknowledgechunks`.

## Vì sao tài liệu này tồn tại

Atlas Search Index **không được tạo bằng Mongoose/migration script** — nó chỉ có thể tạo qua
Atlas UI, Atlas CLI, hoặc Atlas Admin API. Trước PR-13, không có nơi nào trong repo ghi lại
cấu hình chính xác của index này. Nếu thiếu tài liệu này, dựng lại môi trường mới (staging,
disaster recovery, đổi cluster) sẽ khiến toàn bộ tính năng AI Chat báo lỗi
`AI_CONFIG_ERROR: Hệ thống Vector Search chưa được cấu hình` mà không ai biết phải sửa gì.

## 1. Định nghĩa Index (Atlas Search JSON)

Tên index mặc định: `ai_knowledge_vector_index` (đổi qua biến môi trường `AI_VECTOR_INDEX_NAME`
nếu cần, xem [aiVectorRetriever.service.js](./services/aiVectorRetriever.service.js)).

Định nghĩa dưới đây **khớp với các field mà code thực sự truy vấn** (đường dẫn vector, và 4 field
dùng làm pre-filter trong `$vectorSearch.filter`). Đây là **specification cần áp dụng lên cluster
thật**, không phải trạng thái hiện tại của cluster (không có quyền truy cập Atlas Dashboard để xác
minh trực tiếp) — người vận hành cần tự đối chiếu/áp dụng và xác nhận qua bước 3 bên dưới.

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

- `numDimensions: 768` khớp với mặc định `AI_EMBEDDING_DIMENSIONS=768` (model `gemini-embedding-2`
  hiện dùng). **Nếu đổi model/dimensions, PHẢI cập nhật lại giá trị này trong Atlas VÀ re-index toàn
  bộ dữ liệu cũ** — xem mục "Rủi ro" bên dưới.
- `similarity: "cosine"` là lựa chọn tiêu chuẩn cho embedding văn bản kiểu Gemini/OpenAI. Nếu embedding
  provider của bạn khuyến nghị metric khác (`euclidean`, `dotProduct`), đổi tương ứng.

## 2. Các bước tạo Index trên Atlas

1. Đăng nhập [Atlas Dashboard](https://cloud.mongodb.com) → chọn cluster đang dùng (xem `MONGO_URI`
   trong `.env`, KHÔNG commit giá trị thật).
2. Vào **Search** (hoặc **Atlas Search**) → **Create Search Index** → chọn **Atlas Vector Search**
   → **JSON Editor**.
3. Chọn database/collection: `<tên DB trong MONGO_URI>.aiknowledgechunks`.
4. Dán định nghĩa JSON ở mục 1 vào, đặt tên index đúng bằng giá trị `AI_VECTOR_INDEX_NAME`.
5. Chờ trạng thái index chuyển sang **Active** (thường vài phút với dữ liệu nhỏ).

Tương đương qua Atlas CLI (`atlas` cần đã đăng nhập và trỏ đúng project):

```bash
atlas clusters search indexes create \
  --clusterName <TÊN_CLUSTER> \
  --db <TÊN_DB> \
  --collection aiknowledgechunks \
  --file atlas-vector-search-index.json
```

## 3. Xác minh Index hoạt động

Sau khi index Active, index thử một bài giảng bất kỳ (`POST /api/ai/lessons/:lessonId/index` — xem
`aiKnowledge.routes.js`), sau đó gửi một câu hỏi AI Chat liên quan tới nội dung bài giảng đó. Nếu
trả lời có trích dẫn (`citations`) thay vì thông báo "chưa tìm thấy thông tin trong tài liệu", index
đang hoạt động đúng.

Nếu gặp lỗi `AI_CONFIG_ERROR` khi chat — index chưa tồn tại/chưa Active/sai tên. Nếu KHÔNG có lỗi
nhưng luôn nhận "chưa tìm thấy thông tin" dù bài giảng chắc chắn có nội dung liên quan — nghi ngờ
đầu tiên là **lệch `numDimensions`** (xem mục Rủi ro).

## 4. Rủi ro cần biết: lệch AI_EMBEDDING_DIMENSIONS

Khi boot, server tự động gọi `aiKnowledgeIndexingService.checkEmbeddingConfigConsistency()`
(xem [aiKnowledgeIndexing.service.js](./services/aiKnowledgeIndexing.service.js)) — so sánh
`AI_EMBEDDING_DIMENSIONS` hiện tại với dimensions của các chunk **đã index trong DB**, log cảnh báo
console nếu lệch. Đây chỉ là cảnh báo **nội bộ ứng dụng** (dữ liệu cũ vs. dữ liệu mới) — nó **không
và không thể** kiểm tra cấu hình `numDimensions` thực tế trên Atlas Search Index (Atlas không lộ giá
trị này qua driver một cách đáng tin cậy để tự động hoá).

Vì vậy, khi đổi `AI_EMBEDDING_MODEL`/`AI_EMBEDDING_DIMENSIONS`, PHẢI làm thủ công theo đúng thứ tự:

1. Cập nhật index Atlas: đổi `numDimensions` trong định nghĩa (mục 1) → apply lại trên Atlas.
2. Re-index toàn bộ bài giảng đã index trước đó (gọi lại `indexLessonKnowledge` với `force=true`)
   — embedding cũ (dimensions cũ) sẽ không tương thích với index mới.
3. Xác minh lại theo mục 3.

Bỏ qua thứ tự này KHÔNG gây lỗi rõ ràng — Vector Search sẽ chỉ âm thầm trả về ít/không kết quả,
rất khó phát hiện nếu không chủ động kiểm tra.

## 5. Biến môi trường liên quan (xem `.env.example`)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `AI_VECTOR_INDEX_NAME` | `ai_knowledge_vector_index` | Tên Atlas Search Index |
| `AI_EMBEDDING_MODEL` | `gemini-embedding-2` | Model sinh embedding |
| `AI_EMBEDDING_DIMENSIONS` | `768` | Số chiều vector — PHẢI khớp `numDimensions` trên Atlas |
| `RAG_TOP_K` | `5` | Số chunk tối đa trả về sau khi lọc |
| `RAG_NUM_CANDIDATES` | `100` | Số ứng viên Atlas quét trước khi rank (ANN search) |
| `RAG_MIN_SCORE` | `0.65` | Ngưỡng điểm tương đồng tối thiểu để giữ lại chunk |
| `RAG_CHUNK_MAX_CHARS` | `2400` | Kích thước tối đa mỗi chunk khi chia nhỏ tài liệu |
| `RAG_CHUNK_OVERLAP_CHARS` | `300` | Số ký tự chồng lấp giữa 2 chunk liên tiếp |
| `RAG_MAX_CONTEXT_CHARS` | `12000` | Giới hạn tổng ký tự context đưa vào prompt AI |
| `RAG_MAX_HISTORY_MESSAGES` | `10` | Số tin nhắn lịch sử chat đưa vào prompt |

## Vì sao không migrate sang vector DB riêng (Qdrant/Pinecone/pgvector)

Đã đánh giá (PR-13) và quyết định **giữ nguyên Atlas Vector Search**:

- Dữ liệu đã nằm sẵn trong MongoDB (cùng cluster với toàn bộ hệ thống) — dùng `$vectorSearch` không
  cần đồng bộ dữ liệu sang một hệ thống thứ hai, không cần vận hành/bảo mật thêm một service.
- Đúng nguyên tắc modular-monolith của dự án (không thêm hạ tầng mới khi chưa chứng minh được lợi ích
  rõ ràng).
- Atlas Vector Search hỗ trợ pre-filter (`classId`, `lessonId`, `status`, `isDeleted`) ngay trong cùng
  một query — đúng nhu cầu hiện tại (RAG theo phạm vi lớp học/bài giảng cụ thể).
- Vấn đề thực sự trước PR-13 không nằm ở lựa chọn công nghệ, mà ở việc **thiếu tài liệu vận hành và
  test** — đã được xử lý bằng tài liệu này + `tests/unit/aiVectorRetriever.test.js` +
  `tests/unit/aiKnowledgeIndexing.test.js`.
