import { body, validationResult, query, param } from "express-validator";

const stripTags = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.replace(/<[^>]*>/g, "").trim();
};

export const handleValidationErrors = (req, res, next) => {
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

export const examSetShareCreateValidation = [
  body("sharedWithUserId")
    .notEmpty()
    .withMessage("sharedWithUserId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("sharedWithUserId không hợp lệ"),

  body("permission")
    .notEmpty()
    .withMessage("permission là bắt buộc")
    .bail()
    .isIn(["VIEW", "EDIT"]) 
    .withMessage("permission không hợp lệ"),

  body("expiresAt")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error("expiresAt phải là ngày hợp lệ");
      }
      if (d.getTime() <= Date.now()) {
        throw new Error("expiresAt phải là thời điểm tương lai");
      }
      return true;
    }),

  body("note")
    .optional()
    .isString()
    .withMessage("note phải là chuỗi")
    .trim()
    .isLength({ max: 500 })
    .withMessage("note tối đa 500 ký tự"),

  handleValidationErrors,
];

export const examSetShareRevokeValidation = [
  param("examSetId")
    .notEmpty()
    .withMessage("examSetId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("examSetId không hợp lệ"),

  param("shareId")
    .notEmpty()
    .withMessage("shareId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("shareId không hợp lệ"),

  handleValidationErrors,
];

export const examSetShareListValidation = [
  param("examSetId")
    .notEmpty()
    .withMessage("examSetId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("examSetId không hợp lệ"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên lớn hơn hoặc bằng 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit phải là số nguyên từ 1 đến 100")
    .toInt(),

  query("status")
    .optional()
    .isIn(["ACTIVE", "REVOKED", "EXPIRED"])
    .withMessage("status không hợp lệ"),

  query("permission")
    .optional()
    .isIn(["VIEW", "EDIT"])
    .withMessage("permission không hợp lệ"),

  query("search")
    .optional()
    .isString()
    .withMessage("search phải là chuỗi")
    .trim()
    .isLength({ max: 100 })
    .withMessage("search không được vượt quá 100 ký tự"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "expiresAt", "status", "permission"])
    .withMessage("sortBy không hợp lệ"),

  query("sortOrder")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder không hợp lệ"),

  handleValidationErrors,
];

export const examSetSharedWithMeValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên lớn hơn hoặc bằng 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit phải là số nguyên từ 1 đến 100")
    .toInt(),

  query("permission")
    .optional()
    .isIn(["VIEW", "EDIT"])
    .withMessage("permission không hợp lệ"),

  query("search")
    .optional()
    .isString()
    .withMessage("search phải là chuỗi")
    .trim()
    .isLength({ max: 100 })
    .withMessage("search không được vượt quá 100 ký tự"),

  query("ownerId")
    .optional()
    .isMongoId()
    .withMessage("ownerId không hợp lệ"),

  query("sortBy")
    .optional()
    .isIn(["sharedAt", "createdAt", "updatedAt", "expiresAt", "permission"])
    .withMessage("sortBy không hợp lệ"),

  query("sortOrder")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder không hợp lệ"),

  handleValidationErrors,
];

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

export const examSetTagsValidation = [
  body("tags")
    .exists({ checkFalsy: false })
    .withMessage("tags là bắt buộc")
    .isArray()
    .withMessage("tags phải là một mảng"),

  body("tags").custom((tags) => {
    if (!Array.isArray(tags)) {
      throw new Error("tags phải là một mảng");
    }

    if (tags.length > 20) {
      throw new Error("Không được phép có quá 20 tag");
    }

    const normalized = new Set();

    for (const [index, tag] of tags.entries()) {
      if (typeof tag !== "string") {
        throw new Error(`tags[${index}] phải là chuỗi`);
      }

      const trimmed = tag.trim().replace(/\s+/g, " ");
      if (trimmed === "") {
        throw new Error(`tags[${index}] không được để trống`);
      }

      const withoutHash = trimmed.replace(/^#+/, "");
      if (withoutHash === "") {
        throw new Error(`tags[${index}] không được chỉ chứa ký tự #`);
      }

      if (withoutHash.length > 30) {
        throw new Error(`tags[${index}] không được quá 30 ký tự`);
      }

      const lower = withoutHash.toLowerCase();
      if (normalized.has(lower)) {
        continue;
      }
      normalized.add(lower);
    }

    return true;
  }),

  handleValidationErrors,
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

const QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer", "essay"];
const DIFFICULTY_LEVELS = ["easy", "medium", "hard"];

const isBooleanString = (value) => {
  return typeof value === "boolean" || (typeof value === "string" && ["true", "false"].includes(value.toLowerCase()));
};

const validateScore = (value) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1000) {
    throw new Error("Score phải là số hợp lệ và không được âm");
  }
  return true;
};

const validatePoints = (value) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1000) {
    throw new Error("Points phải là số hợp lệ và không được âm");
  }
  return true;
};

const validateRubricPayload = [
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
];

const multipleChoiceCreateValidators = [
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

  body("options")
    .custom((options) => {
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
    .withMessage("correctAnswer phải tồn tại"),

  body("correctAnswer")
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
];

const multipleChoiceUpdateValidators = [
  body("options")
    .optional()
    .isArray({ min: 2 })
    .withMessage("Phải có tối thiểu 2 options"),

  body("options.*.id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Mỗi option phải có id"),

  body("options.*.text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Mỗi option phải có text"),

  body("options")
    .optional()
    .custom((options) => {
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
    .optional()
    .trim()
    .notEmpty()
    .withMessage("correctAnswer phải tồn tại"),
];

const trueFalseCreateValidators = [
  body("correctAnswer")
    .custom((correctAnswer) => {
      if (!isBooleanString(correctAnswer)) {
        throw new Error("correctAnswer phải là boolean hoặc 'true'/'false' cho true_false");
      }
      return true;
    }),

  body("options")
    .optional()
    .custom((options) => {
      if (!Array.isArray(options)) {
        throw new Error("options phải là một mảng nếu được cung cấp");
      }
      if (options.length !== 2) {
        throw new Error("TRUE_FALSE chỉ được phép có đúng 2 options nếu cung cấp");
      }

      const normalized = options.map((option) => {
        if (!option || typeof option !== "object") {
          throw new Error("Mỗi option phải là object");
        }
        return String(option.text || "").trim().toLowerCase();
      });

      if (!normalized.includes("true") || !normalized.includes("false")) {
        throw new Error("TRUE_FALSE options phải gồm True và False");
      }
      return true;
    }),
];

const trueFalseUpdateValidators = [
  body("correctAnswer")
    .optional()
    .custom((correctAnswer) => {
      if (!isBooleanString(correctAnswer)) {
        throw new Error("correctAnswer phải là boolean hoặc 'true'/'false' cho true_false");
      }
      return true;
    }),

  body("options")
    .optional()
    .custom((options) => {
      if (!Array.isArray(options)) {
        throw new Error("options phải là một mảng nếu được cung cấp");
      }
      if (options.length !== 2) {
        throw new Error("TRUE_FALSE chỉ được phép có đúng 2 options nếu cung cấp");
      }

      const normalized = options.map((option) => {
        if (!option || typeof option !== "object") {
          throw new Error("Mỗi option phải là object");
        }
        return String(option.text || "").trim().toLowerCase();
      });

      if (!normalized.includes("true") || !normalized.includes("false")) {
        throw new Error("TRUE_FALSE options phải gồm True và False");
      }
      return true;
    }),
];

const shortAnswerCreateValidators = [
  body("correctAnswer")
    .trim()
    .notEmpty()
    .withMessage("correctAnswer là bắt buộc cho short_answer"),

  body("acceptedAnswers")
    .optional()
    .isArray()
    .withMessage("acceptedAnswers phải là mảng"),

  body("acceptedAnswers.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("acceptedAnswers không được chứa giá trị rỗng"),

  body("caseSensitive")
    .optional()
    .isBoolean()
    .withMessage("caseSensitive phải là boolean"),
];

const shortAnswerUpdateValidators = [
  body("correctAnswer")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("correctAnswer không được để trống"),

  body("acceptedAnswers")
    .optional()
    .isArray()
    .withMessage("acceptedAnswers phải là mảng"),

  body("acceptedAnswers.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("acceptedAnswers không được chứa giá trị rỗng"),

  body("caseSensitive")
    .optional()
    .isBoolean()
    .withMessage("caseSensitive phải là boolean"),
];

const essayCreateValidators = [
  body()
    .custom((body) => {
      if (body.type === "essay" && body.score === undefined && body.points === undefined) {
        throw new Error("Score là bắt buộc cho ESSAY");
      }
      return true;
    }),

  body("options")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng options");
    }),

  body("correctAnswer")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng correctAnswer");
    }),

  body("acceptedAnswers")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng acceptedAnswers");
    }),

  body("caseSensitive")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng caseSensitive");
    }),
];

const essayUpdateValidators = [
  body("options")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng options");
    }),

  body("correctAnswer")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng correctAnswer");
    }),

  body("acceptedAnswers")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng acceptedAnswers");
    }),

  body("caseSensitive")
    .optional()
    .custom(() => {
      throw new Error("ESSAY không sử dụng caseSensitive");
    }),
];

const createTypeValidators = {
  multiple_choice: multipleChoiceCreateValidators,
  true_false: trueFalseCreateValidators,
  short_answer: shortAnswerCreateValidators,
  essay: essayCreateValidators,
};

const updateTypeValidators = {
  multiple_choice: multipleChoiceUpdateValidators,
  true_false: trueFalseUpdateValidators,
  short_answer: shortAnswerUpdateValidators,
  essay: essayUpdateValidators,
};

const runCreateTypeSpecificValidators = async (req, res, next) => {
  const type = req.body.type;
  if (!type || !QUESTION_TYPES.includes(type)) {
    return next();
  }

  const validators = createTypeValidators[type] || [];
  for (const validator of validators) {
    await validator.run(req);
  }

  next();
};

const runUpdateTypeSpecificValidators = async (req, res, next) => {
  const type = req.body.type;
  if (!type || !QUESTION_TYPES.includes(type)) {
    return next();
  }

  const validators = updateTypeValidators[type] || [];
  for (const validator of validators) {
    await validator.run(req);
  }

  next();
};

const rejectClientMetrics = (field) =>
  body(field)
    .optional()
    .custom(() => {
      throw new Error(`${field} không được phép gửi từ client`);
    });

export const examSetQuestionCreateValidation = [
  rejectClientMetrics("questionCount"),
  rejectClientMetrics("totalPoints"),
  body("questionId")
    .trim()
    .notEmpty()
    .withMessage("questionId là bắt buộc"),

  body("type")
    .trim()
    .customSanitizer((value) => (typeof value === "string" ? value.trim().toLowerCase() : value))
    .notEmpty()
    .withMessage("Loại câu hỏi là bắt buộc")
    .isIn(QUESTION_TYPES)
    .withMessage("Type phải là một trong các loại câu hỏi hợp lệ"),

  body("content")
    .isString()
    .withMessage("Content phải là chuỗi")
    .customSanitizer(stripTags)
    .notEmpty()
    .withMessage("Content là bắt buộc")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Content phải có độ dài từ 5 đến 5000 ký tự"),

  body("score").optional().custom(validateScore),
  body("points").optional().custom(validatePoints),

  body("difficulty")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(DIFFICULTY_LEVELS)
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

  ...validateRubricPayload,

  runCreateTypeSpecificValidators,
  handleValidationErrors,
];

export const examSetQuestionUpdateValidation = [
  rejectClientMetrics("questionCount"),
  rejectClientMetrics("totalPoints"),
  body("type")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(QUESTION_TYPES)
    .withMessage("Type phải là một trong các loại câu hỏi hợp lệ"),

  body("content")
    .optional()
    .customSanitizer(stripTags)
    .notEmpty()
    .withMessage("Content không được để trống")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Content phải có độ dài từ 5 đến 5000 ký tự"),

  body("score").optional().custom(validateScore),
  body("points").optional().custom(validatePoints),

  body("difficulty")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(DIFFICULTY_LEVELS)
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

  ...validateRubricPayload,

  runUpdateTypeSpecificValidators,
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

export const examSetVersionsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên >= 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit phải là số nguyên giữa 1 và 100")
    .toInt(),

  query("sort")
    .optional()
    .trim()
    .isIn(["asc", "desc"])
    .withMessage("sort chỉ chấp nhận 'asc' hoặc 'desc'"),

  handleValidationErrors,
];

/**
 * Validation for PATCH /:examSetId/shares/:shareId
 * Update share metadata: expiresAt and/or note
 */
export const examSetShareUpdateMetadataValidation = [
  param("examSetId")
    .notEmpty()
    .withMessage("examSetId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("examSetId không hợp lệ"),

  param("shareId")
    .notEmpty()
    .withMessage("shareId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("shareId không hợp lệ"),

  // Reject unknown top-level fields (whitelist: expiresAt, note only)
  body()
    .custom((body) => {
      const allowed = new Set(["expiresAt", "note"]);
      const unknown = Object.keys(body || {}).filter((k) => !allowed.has(k));
      if (unknown.length > 0) {
        throw new Error(`Trường không được phép: ${unknown.join(", ")}`);
      }
      // At least one known field must be present
      const hasExpiresAt = "expiresAt" in (body || {});
      const hasNote = "note" in (body || {});
      if (!hasExpiresAt && !hasNote) {
        throw new Error("Body phải chứa ít nhất một trong: expiresAt, note");
      }
      return true;
    }),

  body("expiresAt")
    .optional({ checkFalsy: false })
    .custom((value) => {
      // Allow explicit null to clear expiry
      if (value === null) return true;
      // Reject non-string/non-null types
      if (typeof value !== "string") {
        throw new Error("expiresAt phải là chuỗi ISO 8601 hoặc null");
      }
      if (value.trim() === "") {
        throw new Error("expiresAt không được là chuỗi rỗng");
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error("expiresAt phải là ngày hợp lệ (ISO 8601)");
      }
      if (d.getTime() <= Date.now()) {
        throw new Error("expiresAt phải là thời điểm trong tương lai");
      }
      return true;
    }),

  body("note")
    .optional({ checkFalsy: false })
    .custom((value) => {
      // Allow explicit null to clear note
      if (value === null) return true;
      if (typeof value !== "string") {
        throw new Error("note phải là chuỗi hoặc null");
      }
      if (value.trim().length > 500) {
        throw new Error("note tối đa 500 ký tự");
      }
      return true;
    }),

  handleValidationErrors,
];
