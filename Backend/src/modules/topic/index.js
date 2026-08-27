// File: src/modules/topic/index.js
// PUBLIC API của module topic (§3.3).
//
// CỐ Ý CHỈ export model, KHÔNG export gì từ topic.service.js: service đó import Lesson/
// Assignment/Exam/Question/Course/StudentPerformance để phục vụ deleteTopicService — nếu
// re-export ở đây, MỌI nơi chỉ cần model Topic (rất nhẹ) sẽ kéo theo toàn bộ chuỗi phụ thuộc
// đó, kể cả trong test chỉ mock mỗi topic.model.js. checkTopicOwnership vẫn dùng được, chỉ
// cần import thẳng "#modules/topic/topic.service.js" ở nơi thật sự cần (chấp nhận như một
// cross-module-internals có chủ đích, giống các trường hợp khác đã có trong codebase).
export { default as Topic } from "./topic.model.js";
