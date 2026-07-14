import questionService from "../services/question.service.js";

export const uploadExcelQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn file Excel để tải lên!" });
    }

    // Truyền buffer của file sang tầng Service xử lý
    const importedQuestions = await questionService.importQuestionsFromExcel(
      req.file.buffer,
    );

    res.status(201).json({
      message: `Nhập thành công ${importedQuestions.length} câu hỏi vào hệ thống!`,
      data: importedQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
