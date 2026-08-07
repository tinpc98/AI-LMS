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

/**
 * Loại bỏ dấu tiếng Việt và dấu cách thừa
 * @param {string} str
 * @returns {string}
 */
export const removeVietnameseTones = (str) => {
  if (!str) return "";
  let result = String(str).trim();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  result = result.replace(/Đ/g, "D");
  // Thay thế khoảng trắng thừa bằng 1 khoảng trắng
  result = result.replace(/\s+/g, " ");
  return result;
};

/**
 * So sánh câu hỏi điền từ (Short Answer)
 * @param {any} correctAnswer
 * @param {string[]} acceptedAnswers
 * @param {string} studentAnswer
 * @param {boolean} caseSensitive
 * @returns {boolean}
 */
export const compareShortAnswer = (correctAnswer, acceptedAnswers, studentAnswer, caseSensitive = false) => {
  if (!studentAnswer) return false;
  let sAns = removeVietnameseTones(studentAnswer);
  if (!caseSensitive) sAns = sAns.toLowerCase();

  // Gom các đáp án đúng có thể có
  const possibleAnswers = [];
  if (correctAnswer) possibleAnswers.push(correctAnswer);
  if (Array.isArray(acceptedAnswers)) {
    possibleAnswers.push(...acceptedAnswers);
  }

  for (let ans of possibleAnswers) {
    if (!ans) continue;
    let cAns = removeVietnameseTones(ans);
    if (!caseSensitive) cAns = cAns.toLowerCase();
    
    if (sAns === cAns) return true;
  }
  return false;
};

export default { normalizeAnswer, compareAnswers, removeVietnameseTones, compareShortAnswer };
