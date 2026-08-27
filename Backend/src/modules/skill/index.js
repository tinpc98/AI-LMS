// File: src/modules/skill/index.js
// PUBLIC API của module skill (§3.3).
//
// CỐ Ý KHÔNG export router/service ở đây — cùng nguyên tắc "index.js không re-export thứ mà
// file nội bộ module cũng cần" đã áp dụng cho các module khác (xem topic/lesson/badge). Chỉ
// export model vì question.model.js cần nó cho field primarySkillId (ref: "Skill").

export { default as Skill } from "./skill.model.js";
