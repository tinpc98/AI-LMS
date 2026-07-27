import { body, validationResult } from "express-validator";

// Middleware tập trung hứng lỗi và trả về cho Frontend
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.",
      // Sử dụng err.path cho các phiên bản mới, bọc lót err.param nếu dùng bản cũ
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
    .withMessage("Type phải là MULTIPLE_CHOICE"),

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
