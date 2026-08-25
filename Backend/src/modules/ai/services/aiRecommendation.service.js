import { generateAIResponse } from "./aiCore.service.js";

export const generateRecommendationService = async ({
  studentId,
  skillName,
  topicName,
  accuracy,
  severity,
  availableResources,
}) => {
  const prompt = `
Bạn là một gia sư AI chuyên gia.
Học sinh đang gặp điểm yếu (Weakness) ở kỹ năng: "${skillName}" thuộc chủ đề: "${topicName}".
Tỷ lệ chính xác hiện tại là: ${accuracy}%. Mức độ nghiêm trọng: ${severity}.

Hãy chọn lọc từ danh sách các tài nguyên (resources) có sẵn dưới đây để đề xuất một lộ trình học tập phù hợp nhất.
Danh sách tài nguyên có sẵn:
${JSON.stringify(availableResources, null, 2)}

Trả về kết quả dưới định dạng JSON (KHÔNG có markdown block, chỉ JSON raw) với cấu trúc sau:
{
  "title": "Tiêu đề lộ trình học",
  "explanation": "Lý do vì sao học sinh cần lộ trình này",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "resources": [
    {
      "type": "LESSON" | "ASSIGNMENT" | "VIDEO" | "EXAM",
      "resourceId": "id tài nguyên có trong danh sách trên",
      "title": "Tên tài nguyên",
      "required": true/false
    }
  ]
}

Lưu ý: 
- Chỉ sử dụng các resourceId chính xác từ danh sách có sẵn.
- Trả về JSON hợp lệ.
`;

  try {
    const rawResponse = await generateAIResponse(prompt, {
      systemInstruction: "Bạn là một AI chuyên phân tích điểm yếu học sinh và đưa ra lộ trình học tập tối ưu.",
      model: "gemini-1.5-flash",
    });

    // Remove markdown code blocks if present
    const cleanJson = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Recommendation Generation Error:", error);
    throw new Error("Failed to generate recommendation from AI");
  }
};
