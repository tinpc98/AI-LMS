/**
 * Chuẩn hóa đáp án thành mảng các chuỗi ký tự sạch
 * @param {any} answer
 * @returns {string[]}
 */
export const normalizeAnswer = (answer) => {
  if (answer === null || answer === undefined) {
    return [];
  }

  let list = [];

  if (Array.isArray(answer)) {
    list = answer;
  } else if (typeof answer === "string") {
    const trimmed = answer.trim();
    if (!trimmed) return [];

    // Thử parse nếu là JSON array string: '["A", "B"]'
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          list = parsed;
        } else {
          list = [trimmed];
        }
      } catch (e) {
        list = [trimmed];
      }
    } else if (trimmed.includes(",")) {
      // Chuỗi phân cách bằng dấu phẩy: "A, C"
      list = trimmed.split(",");
    } else {
      list = [trimmed];
    }
  } else {
    list = [String(answer)];
  }

  // Trim từng element, bỏ chuỗi rỗng và loại bỏ trùng lặp (Deduplicate)
  const cleaned = list.map((item) => String(item).trim()).filter((item) => item.length > 0);

  const unique = Array.from(new Set(cleaned));
  unique.sort(); // Sắp xếp theo thứ tự bảng chữ cái

  return unique;
};

/**
 * So sánh hai đáp án (không phụ thuộc thứ tự các phần tử)
 * @param {any} correctAnswer
 * @param {any} studentAnswer
 * @returns {boolean}
 */
export const compareAnswers = (correctAnswer, studentAnswer) => {
  const normCorrect = normalizeAnswer(correctAnswer);
  const normStudent = normalizeAnswer(studentAnswer);

  if (normCorrect.length !== normStudent.length) {
    return false;
  }

  for (let i = 0; i < normCorrect.length; i++) {
    if (normCorrect[i] !== normStudent[i]) {
      return false;
    }
  }

  return true;
};

export default { normalizeAnswer, compareAnswers };
