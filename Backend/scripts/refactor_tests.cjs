const fs = require('fs');
const path = 'src/scripts/testExamSetImportUnit.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/setupMocks\(\);\s+([\s\S]*?)\s+resetMocks\(\);/g, (match, p1) => {
  return `setupMocks();
    try {
      ${p1.trim().replace(/\n/g, '\n      ')}
    } finally {
      resetMocks();
    }`;
});

content = content.replace(/process\.exit\(1\);/g, 'process.exitCode = 1;');
content = content.replace(/process\.exit\(0\);/g, 'process.exitCode = 0;');

// Update test 28
const test28Old = `await runTest("28. Không tạo document trong Question model", async () => {
    setupMocks();
    try {
      const res = await importExcelToExamSet({ fileBuffer: validBuffer, ownerId, folderId: validFolderId, title: "T" });
      assert.strictEqual(res.questions.length > 0, true);
    } finally {
      resetMocks();
    }
  });`;

const test28New = `await runTest("Import Service không gọi Question Model", async () => {
    const serviceSource = fs.readFileSync('src/services/examSetImport.service.js', 'utf8');
    const hasQuestionModel = serviceSource.includes('Question.create') || 
                             serviceSource.includes('Question.insertMany') || 
                             serviceSource.includes('new Question');
    assert.strictEqual(hasQuestionModel, false, "Source code của service không được chứa lời gọi Question model");
    
    // Test logic cũ cho chắc chắn nó chạy
    setupMocks();
    try {
      const res = await importExcelToExamSet({ fileBuffer: validBuffer, ownerId, folderId: validFolderId, title: "T" });
      assert.strictEqual(res.questions.length > 0, true);
    } finally {
      resetMocks();
    }
  });`;

content = content.replace(test28Old, test28New);
fs.writeFileSync(path, content);
console.log('Refactored testExamSetImportUnit.js');
