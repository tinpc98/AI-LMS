import { body, validationResult } from "express-validator";

const stripTags = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.replace(/<[^>]*>/g, "").trim();
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống!")
    .isEmail()
    .withMessage("Email không đúng định dạng!")
    .normalizeEmail(), // Đồng bộ normalize để luôn tìm kiếm dạng chữ thường

  body("password").notEmpty().withMessage("Mật khẩu không được để trống!"),

  handleValidationErrors, // Thêm chốt chặn xử lý kết quả lỗi (Em từng thiếu chỗ này)
];

export const multipleChoiceQuestionValidation = [
  body("questionId")
    .trim()
    .notEmpty()
    .withMessage("questionId là bắt buộc"),

  body("type")
    .trim()
    .notEmpty()
    .withMessage("Loại câu hỏi là bắt buộc")
    .equals("multiple_choice")
    .withMessage("Type phải là multiple_choice"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content là bắt buộc"),

  body("options")
    .isArray({ min: 2 })
    .withMessage("Phải có tối thiểu 2 options"),

  body("options.*.id")
    .trim()
    .notEmpty()
    .withMessage("Mỗi option phải có id"),

  body("options.*.text")
    .trim()
    .notEmpty()
    .withMessage("Mỗi option phải có text"),

  body("options").custom((options) => {
    if (!Array.isArray(options)) {
      throw new Error("options phải là một mảng");
    }

    const ids = new Set();
    const texts = new Set();

    for (const [index, option] of options.entries()) {
      if (!option || typeof option !== "object") {
        throw new Error(`options[${index}] phải là object`);
      }

      if (!option.id || typeof option.id !== "string" || option.id.trim() === "") {
        throw new Error(`options[${index}].id là bắt buộc`);
      }

      if (!option.text || typeof option.text !== "string" || option.text.trim() === "") {
        throw new Error(`options[${index}].text là bắt buộc`);
      }

      if (ids.has(option.id)) {
        throw new Error("Option id không được trùng nhau");
      }
      ids.add(option.id);

      if (texts.has(option.text)) {
        throw new Error("Option text không được trùng nhau");
      }
      texts.add(option.text);
    }

    return true;
  }),

  body("correctAnswer")
    .trim()
    .notEmpty()
    .withMessage("correctAnswer phải tồn tại")
    .custom((correctAnswer, { req }) => {
      const options = req.body.options;
      if (!Array.isArray(options)) {
        throw new Error("options phải là một mảng");
      }

      const matchById = options.some((option) => option.id === correctAnswer);
      const matchByText = options.some((option) => option.text === correctAnswer);
      if (!matchById && !matchByText) {
        throw new Error("correctAnswer phải tồn tại trong options");
      }
      return true;
    }),

  body("points")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Score phải lớn hơn hoặc bằng 0"),

  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty phải thuộc enum easy, medium, hard"),

  handleValidationErrors,
];

const essayForbiddenFields = [
  "options",
  "correctAnswer",
  "acceptedAnswers",
  "caseSensitive",
];

const essayForbiddenFieldValidators = essayForbiddenFields.map((field) =>
  body(field).custom((value, { req }) => {
    if (req.body.type === "essay" && value !== undefined) {
      throw new Error(`ESSAY không sử dụng ${field}`);
    }
    return true;
  })
);

export const examSetQuestionCreateValidation = [
  body("questionId")
    .trim()
    .notEmpty()
    .withMessage("questionId là bắt buộc"),

  body("type")
    .trim()
    .customSanitizer((value) => (typeof value === "string" ? value.trim().toLowerCase() : value))
    .notEmpty()
    .withMessage("Loại câu hỏi là bắt buộc")
    .isIn(["multiple_choice", "true_false", "short_answer", "essay"])
    .withMessage("Type phải là một trong các loại câu hỏi hợp lệ"),

  body("content")
    .isString()
    .withMessage("Content phải là chuỗi")
    .customSanitizer(stripTags)
    .notEmpty()
    .withMessage("Content là bắt buộc")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Content phải có độ dài từ 5 đến 5000 ký tự"),

  body("score")
    .optional()
    .custom((value) => {
      if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1000) {
        throw new Error("Score phải là số hợp lệ và không được âm");
      }
      return true;
    }),

  body("points")
    .optional()
    .custom((value) => {
      if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1000) {
        throw new Error("Points phải là số hợp lệ và không được âm");
      }
      return true;
    }),

  body("difficulty")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty phải thuộc enum easy, medium, hard"),

  body("suggestedAnswer")
    .optional()
    .customSanitizer(stripTags)
    .isString()
    .withMessage("suggestedAnswer phải là một chuỗi")
    .notEmpty()
    .withMessage("suggestedAnswer không được chỉ là khoảng trắng")
    .isLength({ max: 10000 })
    .withMessage("suggestedAnswer không được vượt quá 10000 ký tự"),

  body("rubric")
    .optional()
    .isArray({ min: 1, max: 20 })
    .withMessage("Rubric phải là mảng có tối thiểu 1 và tối đa 20 tiêu chí"),

  body("rubric.*.criterion")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("criterion trong rubric là bắt buộc")
    .isLength({ max: 500 })
    .withMessage("criterion không được vượt quá 500 ký tự"),

  body("rubric.*.maxScore")
    .optional()
    .isFloat({ min: 0.000001 })
    .withMessage("maxScore phải là số lớn hơn 0"),

  body("rubric")
    .optional()
    .custom((rubric, { req }) => {
      if (!Array.isArray(rubric)) {
        throw new Error("Rubric phải là một mảng");
      }

      const criteriaSet = new Set();
      let totalScore = 0;
      const questionScore = req.body.score ?? req.body.points;

      for (const [index, item] of rubric.entries()) {
        if (!item || typeof item !== "object") {
          throw new Error(`rubric[${index}] phải là object`);
        }

        if (!item.criterion || typeof item.criterion !== "string" || item.criterion.trim() === "") {
          throw new Error(`rubric[${index}].criterion là bắt buộc`);
        }

        const normalizedCriterion = item.criterion.trim().toLowerCase();
        if (criteriaSet.has(normalizedCriterion)) {
          throw new Error("rubric không được có tiêu chí trùng nhau");
        }
        criteriaSet.add(normalizedCriterion);

        if (item.maxScore === undefined || item.maxScore === null || Number.isNaN(Number(item.maxScore))) {
          throw new Error(`rubric[${index}].maxScore là bắt buộc và phải là số`);
        }

        const maxScoreValue = Number(item.maxScore);
        if (maxScoreValue <= 0) {
          throw new Error(`rubric[${index}].maxScore phải lớn hơn 0`);
        }

        totalScore += maxScoreValue;
      }

      if (questionScore !== undefined && totalScore > Number(questionScore)) {
        throw new Error("Tổng rubric không được lớn hơn score của câu hỏi");
      }

      return true;
    }),

  ...essayForbiddenFieldValidators,

  body()
    .custom((body) => {
      if (body.type === "essay" && body.score === undefined && body.points === undefined) {
        throw new Error("Score là bắt buộc cho ESSAY");
      }
      return true;
    }),

  body("type")
    .custom((type, { req }) => {
      if (type === "essay") {
        const forbidden = ["options", "correctAnswer", "acceptedAnswers", "caseSensitive"];
        for (const field of forbidden) {
          if (req.body[field] !== undefined) {
            throw new Error(`ESSAY không sử dụng ${field}`);
          }
        }
      }
      return true;
    }),

  handleValidationErrors,
];

export const examSetQuestionUpdateValidation = [
  body("type")
    .optional()
    .trim()
    .isIn(["multiple_choice", "true_false", "short_answer", "essay"])
    .withMessage("Type phải là một trong các loại câu hỏi hợp lệ"),

  body("content")
    .optional()
    .customSanitizer(stripTags)
    .notEmpty()
    .withMessage("Content không được để trống")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Content phải có độ dài từ 5 đến 5000 ký tự"),

  body("score")
    .optional()
    .custom((value) => {
      if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1000) {
        throw new Error("Score phải là số hợp lệ và không được âm");
      }
      return true;
    }),

  body("points")
    .optional()
    .custom((value) => {
      if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1000) {
        throw new Error("Points phải là số hợp lệ và không được âm");
      }
      return true;
    }),

  body("difficulty")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty phải thuộc enum easy, medium, hard"),

  body("suggestedAnswer")
    .optional()
    .customSanitizer(stripTags)
    .isString()
    .withMessage("suggestedAnswer phải là một chuỗi")
    .notEmpty()
    .withMessage("suggestedAnswer không được chỉ là khoảng trắng")
    .isLength({ max: 10000 })
    .withMessage("suggestedAnswer không được vượt quá 10000 ký tự"),

  body("rubric")
    .optional()
    .isArray({ min: 1, max: 20 })
    .withMessage("Rubric phải là mảng có tối thiểu 1 và tối đa 20 tiêu chí"),

  body("rubric.*.criterion")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("criterion trong rubric là bắt buộc")
    .isLength({ max: 500 })
    .withMessage("criterion không được vượt quá 500 ký tự"),

  body("rubric.*.maxScore")
    .optional()
    .isFloat({ min: 0.000001 })
    .withMessage("maxScore phải là số lớn hơn 0"),

  body("rubric")
    .optional()
    .custom((rubric, { req }) => {
      if (!Array.isArray(rubric)) {
        throw new Error("Rubric phải là một mảng");
      }

      const criteriaSet = new Set();
      let totalScore = 0;
      const questionScore = req.body.score ?? req.body.points;

      for (const [index, item] of rubric.entries()) {
        if (!item || typeof item !== "object") {
          throw new Error(`rubric[${index}] phải là object`);
        }

        if (!item.criterion || typeof item.criterion !== "string" || item.criterion.trim() === "") {
          throw new Error(`rubric[${index}].criterion là bắt buộc`);
        }

        const normalizedCriterion = item.criterion.trim().toLowerCase();
        if (criteriaSet.has(normalizedCriterion)) {
          throw new Error("rubric không được có tiêu chí trùng nhau");
        }
        criteriaSet.add(normalizedCriterion);

        if (item.maxScore === undefined || item.maxScore === null || Number.isNaN(Number(item.maxScore))) {
          throw new Error(`rubric[${index}].maxScore là bắt buộc và phải là số`);
        }

        const maxScoreValue = Number(item.maxScore);
        if (maxScoreValue <= 0) {
          throw new Error(`rubric[${index}].maxScore phải lớn hơn 0`);
        }

        totalScore += maxScoreValue;
      }

      if (questionScore !== undefined && totalScore > Number(questionScore)) {
        throw new Error("Tổng rubric không được lớn hơn score của câu hỏi");
      }

      return true;
    }),

  body("options").optional().custom((value, { req }) => {
    if (req.body.type === "essay") {
      throw new Error("ESSAY không sử dụng options");
    }
    return true;
  }),

  body("correctAnswer").optional().custom((value, { req }) => {
    if (req.body.type === "essay") {
      throw new Error("ESSAY không sử dụng correctAnswer");
    }
    return true;
  }),

  body("acceptedAnswers").optional().custom((value, { req }) => {
    if (req.body.type === "essay") {
      throw new Error("ESSAY không sử dụng acceptedAnswers");
    }
    return true;
  }),

  body("caseSensitive").optional().custom((value, { req }) => {
    if (req.body.type === "essay") {
      throw new Error("ESSAY không sử dụng caseSensitive");
    }
    return true;
  }),

  handleValidationErrors,
];

export const reorderQuestionsValidation = [
  body("questions")
    .isArray({ min: 1 })
    .withMessage("questions phải là một mảng và không được rỗng"),

  body("questions.*.questionId")
    .trim()
    .notEmpty()
    .withMessage("questionId là bắt buộc cho mỗi câu hỏi"),

  body("questions.*.order")
    .isInt({ min: 0 })
    .withMessage("order phải là số nguyên không âm cho mỗi câu hỏi"),

  handleValidationErrors,
];
