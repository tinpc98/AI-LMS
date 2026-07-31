import assert from "assert";
import * as xlsx from "xlsx";
import { importExcelToExamSet } from "../services/examSetImport.service.js";
import { createImportExcelExamSetHandler } from "../controllers/examSet.controller.js";
import Folder from "../models/folder.model.js";
import ExamSet from "../models/examSet.model.js";
import mongoose from "mongoose";

// Helper to create an excel buffer
function createExcelBuffer(data) {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Controller mock request
const createMockRequest = ({
  file,
  body = {},
  user = { id: "507f1f77bcf86cd799439011" },
} = {}) => ({
  file,
  body,
  user,
  headers: { "content-type": "multipart/form-data" },
});

// Controller mock response
const createMockResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

async function runUnitTests() {
  console.log("🚀 Bắt đầu chạy Test Unit cho ExamSet Import...");
  let passed = 0;
  let failed = 0;

  const runTest = async (name, testFn) => {
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Lỗi: ${err.stack || err.message}`);
      failed++;
    }
  };

  const validFolderId = new mongoose.Types.ObjectId().toString();
  const ownerId = "507f1f77bcf86cd799439011";

  console.log("\n--- BẮT ĐẦU TEST CONTROLLER (S2C-02) ---");

  await runTest("TC-01 - Thiếu file", async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        throw new Error("Should not be called");
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  await runTest("TC-02 - Thiếu folderId", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        const err = new Error("Thiếu folderId");
        err.statusCode = 400;
        throw err;
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await runTest("TC-03 - folderId sai định dạng", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        const err = new Error("folderId không hợp lệ");
        err.statusCode = 400;
        throw err;
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await runTest("TC-04 - Folder không tồn tại", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        const err = new Error("Folder không tồn tại");
        err.statusCode = 404;
        throw err;
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 404);
  });

  await runTest("TC-05 - Không có quyền truy cập Folder", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        const err = new Error("Không có quyền truy cập Folder");
        err.statusCode = 403;
        throw err;
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 403);
  });

  await runTest("TC-06 - File sai định dạng", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        const err = new Error("File không đúng định dạng Excel");
        err.statusCode = 415;
        throw err;
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 415);
  });

  await runTest("TC-07 - Dữ liệu Excel không hợp lệ", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        const err = new Error("Dòng 2: Thiếu nội dung câu hỏi (content)");
        err.statusCode = 422;
        throw err;
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 422);
  });

  await runTest("TC-08 - Tương thích error.status cũ", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        const err = new Error("Lỗi module cũ");
        err.status = 409;
        throw err;
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 409);
  });

  await runTest("TC-09 - Lỗi không có status", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async () => {
        throw new Error("Unexpected error");
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 500);
  });

  await runTest("TC-10 - Import thành công", async () => {
    const req = createMockRequest({ file: { buffer: Buffer.from("mock") } });
    const res = createMockResponse();
    const handler = createImportExcelExamSetHandler({
      importService: async (params) => {
        assert.strictEqual(params.ownerId, req.user.id);
        return {
          _id: "507f1f77bcf86cd799439020",
          folderId: "507f1f77bcf86cd799439011",
          title: "Bộ câu hỏi Unit 8 và 12",
          status: "draft",
          questionCount: 31,
          totalPoints: 31,
          questions: [],
        };
      },
    });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
  });

  console.log("\n--- BẮT ĐẦU TEST SERVICE (S2C-08) ---");

  const originalFindOne = Folder.findOne;
  const originalSave = ExamSet.prototype.save;

  const resetMocks = () => {
    Folder.findOne = originalFindOne;
    ExamSet.prototype.save = originalSave;
  };

  const setupMocks = () => {
    Folder.findOne = async (query) => {
      if (query._id === validFolderId)
        return { _id: validFolderId, ownerId: ownerId, isDeleted: false };
      return null;
    };
    ExamSet.prototype.save = async function () {
      this._id = "mocked-examset";
      return this;
    };
  };

  const expectError = async (fn, statusCode) => {
    try {
      await fn();
      assert.fail("Should throw an error");
    } catch (e) {
      if (e.name === "AssertionError") throw e;
      assert.strictEqual(
        e.statusCode,
        statusCode,
        `Expected status code ${statusCode}, got ${e.statusCode}`
      );
    }
  };

  const validBuffer = createExcelBuffer([
    {
      type: "MCQ",
      content: "A?",
      options: "1|2",
      correctAnswer: "1",
      points: 2,
      difficulty: "easy",
    },
  ]);

  // Test 1-10
  await runTest("1. File Excel hợp lệ", async () => {
    setupMocks();
    try {
      const res = await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions.length, 1);
    } finally {
      resetMocks();
    }
  });

  await runTest("2. File rỗng", async () => {
    setupMocks();
    try {
      const buf = Buffer.from("");
      await expectError(
        () =>
          importExcelToExamSet({ fileBuffer: buf, ownerId, folderId: validFolderId, title: "T" }),
        400
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("3. Sheet rỗng", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([]);
      await expectError(
        () =>
          importExcelToExamSet({ fileBuffer: buf, ownerId, folderId: validFolderId, title: "T" }),
        400
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("4. Thiếu file", async () => {
    await expectError(
      () =>
        importExcelToExamSet({ fileBuffer: null, ownerId, folderId: validFolderId, title: "T" }),
      400
    );
  });

  await runTest("5. Thiếu title", async () => {
    await expectError(
      () =>
        importExcelToExamSet({
          fileBuffer: validBuffer,
          ownerId,
          folderId: validFolderId,
          title: null,
        }),
      400
    );
  });

  await runTest("6. Title chỉ có khoảng trắng", async () => {
    await expectError(
      () =>
        importExcelToExamSet({
          fileBuffer: validBuffer,
          ownerId,
          folderId: validFolderId,
          title: "   ",
        }),
      400
    );
  });

  await runTest("7. Thiếu folderId", async () => {
    await expectError(
      () => importExcelToExamSet({ fileBuffer: validBuffer, ownerId, folderId: "", title: "T" }),
      400
    );
  });

  await runTest("8. folderId sai định dạng", async () => {
    await expectError(
      () => importExcelToExamSet({ fileBuffer: validBuffer, ownerId, folderId: "abc", title: "T" }),
      400
    );
  });

  await runTest("9. Folder không tồn tại", async () => {
    setupMocks();
    try {
      await expectError(
        () =>
          importExcelToExamSet({
            fileBuffer: validBuffer,
            ownerId,
            folderId: new mongoose.Types.ObjectId().toString(),
            title: "T",
          }),
        404
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("10. Folder không thuộc owner", async () => {
    Folder.findOne = async () => ({
      _id: validFolderId,
      ownerId: new mongoose.Types.ObjectId().toString(),
      isDeleted: false,
    });
    await expectError(
      () =>
        importExcelToExamSet({
          fileBuffer: validBuffer,
          ownerId,
          folderId: validFolderId,
          title: "T",
        }),
      403
    );
    resetMocks();
  });

  // Test 11-20
  await runTest("11. MCQ hợp lệ", async () => {
    setupMocks();
    try {
      const res = await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions[0].type, "multiple_choice");
    } finally {
      resetMocks();
    }
  });

  await runTest("12. Essay hợp lệ", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([{ type: "Essay", content: "Viết bài", points: 5 }]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions[0].type, "essay");
    } finally {
      resetMocks();
    }
  });

  await runTest("13. True/False hợp lệ", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([
        { type: "TRUE_FALSE", content: "A?", options: "True|False", correctAnswer: "TRUE" },
      ]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions[0].type, "true_false");
    } finally {
      resetMocks();
    }
  });

  await runTest("14. Short Answer hợp lệ", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([
        { type: "SHORT_ANSWER", content: "A?", correctAnswer: "Ans" },
      ]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions[0].type, "short_answer");
    } finally {
      resetMocks();
    }
  });

  await runTest("15. Options không hợp lệ", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([
        { type: "MCQ", content: "A?", options: "1", correctAnswer: "1" },
      ]);
      await expectError(
        () =>
          importExcelToExamSet({ fileBuffer: buf, ownerId, folderId: validFolderId, title: "T" }),
        422
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("16. correctAnswer không khớp option", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([
        { type: "MCQ", content: "A?", options: "A|B", correctAnswer: "C" },
      ]);
      await expectError(
        () =>
          importExcelToExamSet({ fileBuffer: buf, ownerId, folderId: validFolderId, title: "T" }),
        422
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("17. Câu hỏi trùng nội dung", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([
        { type: "Essay", content: "A" },
        { type: "Essay", content: "A" },
      ]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions.length, 1);
    } finally {
      resetMocks();
    }
  });

  await runTest("18. Câu trùng khác chữ hoa/chữ thường", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([
        { type: "Essay", content: "hello" },
        { type: "Essay", content: "HELLO" },
      ]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions.length, 1);
    } finally {
      resetMocks();
    }
  });

  await runTest("19. Câu trùng có khoảng trắng thừa", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([
        { type: "Essay", content: "hello world" },
        { type: "Essay", content: "hello   world" },
      ]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions.length, 1);
    } finally {
      resetMocks();
    }
  });

  await runTest("20. points rỗng", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([{ type: "Essay", content: "A", points: "" }]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions[0].points, 1);
    } finally {
      resetMocks();
    }
  });

  // Test 21-30
  await runTest("21. points âm", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([{ type: "Essay", content: "A", points: -1 }]);
      await expectError(
        () =>
          importExcelToExamSet({ fileBuffer: buf, ownerId, folderId: validFolderId, title: "T" }),
        422
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("22. points không phải số", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([{ type: "Essay", content: "A", points: "abc" }]);
      await expectError(
        () =>
          importExcelToExamSet({ fileBuffer: buf, ownerId, folderId: validFolderId, title: "T" }),
        422
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("23. Difficulty hợp lệ", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([{ type: "Essay", content: "A", difficulty: "hard" }]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions[0].difficulty, "hard");
    } finally {
      resetMocks();
    }
  });

  await runTest("24. Difficulty không hợp lệ", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([{ type: "Essay", content: "A", difficulty: "super hard" }]);
      const res = await importExcelToExamSet({
        fileBuffer: buf,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions[0].difficulty, "medium");
    } finally {
      resetMocks();
    }
  });

  await runTest("25. Không có câu hợp lệ sau deduplication", async () => {
    setupMocks();
    try {
      const buf = createExcelBuffer([{ type: "Essay", content: "" }]);
      await expectError(
        () =>
          importExcelToExamSet({ fileBuffer: buf, ownerId, folderId: validFolderId, title: "T" }),
        422
      );
    } finally {
      resetMocks();
    }
  });

  await runTest("26. Tính đúng questionCount", async () => {
    setupMocks();
    try {
      const res = await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questionCount, 1);
    } finally {
      resetMocks();
    }
  });

  await runTest("27. Tính đúng totalPoints", async () => {
    setupMocks();
    try {
      const res = await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.totalPoints, 2);
    } finally {
      resetMocks();
    }
  });

  await runTest("Import Service không gọi Question Model", async () => {
    const fs = await import("fs");
    const serviceSource = fs.readFileSync("src/services/examSetImport.service.js", "utf8");
    const hasQuestionModel =
      serviceSource.includes("Question.create") ||
      serviceSource.includes("Question.insertMany") ||
      serviceSource.includes("new Question") ||
      serviceSource.includes("Question.bulkWrite");
    assert.strictEqual(
      hasQuestionModel,
      false,
      "Source code của service không được chứa lời gọi Question model"
    );

    setupMocks();
    try {
      const res = await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.questions.length > 0, true);
    } finally {
      resetMocks();
    }
  });

  await runTest("29. ownerId lấy từ user đã xác thực", async () => {
    setupMocks();
    try {
      const res = await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(String(res.ownerId), ownerId);
    } finally {
      resetMocks();
    }
  });

  await runTest("30. status luôn là draft", async () => {
    setupMocks();
    try {
      const res = await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId,
        folderId: validFolderId,
        title: "T",
      });
      assert.strictEqual(res.status, "draft");
    } finally {
      resetMocks();
    }
  });

  console.log("\n--- BẮT ĐẦU TEST MULTER (FIX-04) ---");
  const { excelFileFilter, mapExcelUploadError } = await import("../routes/examSet.routes.js");
  const multer = (await import("multer")).default;

  await runTest("Multer: File .xlsx với MIME chuẩn được chấp nhận", () => {
    let cbCalled = false;
    excelFileFilter(
      {},
      {
        originalname: "test.xlsx",
        mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      (err, accept) => {
        cbCalled = true;
        assert.strictEqual(err, null);
        assert.strictEqual(accept, true);
      }
    );
    assert.strictEqual(cbCalled, true, "Phải gọi cb()");
  });

  await runTest("Multer: File .xls với MIME chuẩn được chấp nhận", () => {
    excelFileFilter(
      {},
      { originalname: "test.xls", mimetype: "application/vnd.ms-excel" },
      (err, accept) => {
        assert.strictEqual(err, null);
        assert.strictEqual(accept, true);
      }
    );
  });

  await runTest("Multer: File .txt trả HTTP 415", () => {
    excelFileFilter({}, { originalname: "test.txt", mimetype: "text/plain" }, (err, accept) => {
      assert.ok(err);
      assert.strictEqual(accept, false);
      const mapped = mapExcelUploadError(err);
      assert.strictEqual(mapped.status, 415);
    });
  });

  await runTest("Multer: File đổi tên thành .xlsx nhưng MIME sai trả 415", () => {
    excelFileFilter({}, { originalname: "test.xlsx", mimetype: "text/plain" }, (err, accept) => {
      assert.ok(err);
      assert.strictEqual(accept, false);
      const mapped = mapExcelUploadError(err);
      assert.strictEqual(mapped.status, 415);
    });
  });

  await runTest("Multer: MIME Excel nhưng extension .txt trả 415", () => {
    excelFileFilter(
      {},
      { originalname: "test.txt", mimetype: "application/vnd.ms-excel" },
      (err, accept) => {
        assert.ok(err);
        assert.strictEqual(accept, false);
        const mapped = mapExcelUploadError(err);
        assert.strictEqual(mapped.status, 415);
      }
    );
  });

  await runTest("Multer: File vượt 5 MB trả HTTP 413", () => {
    const multerErr = new multer.MulterError("LIMIT_FILE_SIZE");
    const mapped = mapExcelUploadError(multerErr);
    assert.strictEqual(mapped.status, 413);
  });

  console.log(`\n🏁 Kết quả Unit Test: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runUnitTests();
