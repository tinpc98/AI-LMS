import { normalizeAnswer, compareAnswers } from "./answerScoring.js";

// Basic assertions
const runTests = () => {
  let passed = 0;
  let failed = 0;

  const assertEqual = (actual, expected, testName) => {
    const isSame = JSON.stringify(actual) === JSON.stringify(expected);
    if (isSame) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(
        `❌ FAIL: ${testName} - Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`
      );
      failed++;
    }
  };

  // Test 1: Single choice exact match
  assertEqual(compareAnswers("A", "A"), true, "Single choice exact match");

  // Test 2: Single choice mismatch
  assertEqual(compareAnswers("A", "B"), false, "Single choice mismatch");

  // Test 3: Multiple choice same order
  assertEqual(compareAnswers(["A", "C"], ["A", "C"]), true, "Multiple choice same order");

  // Test 4: Multiple choice different order
  assertEqual(compareAnswers(["A", "C"], ["C", "A"]), true, "Multiple choice different order");

  // Test 5: Missing choice
  assertEqual(compareAnswers(["A", "C"], ["A"]), false, "Multiple choice missing item");

  // Test 6: Extra choice
  assertEqual(compareAnswers(["A"], ["A", "B"]), false, "Multiple choice extra item");

  // Test 7: Duplicate choice handling
  assertEqual(compareAnswers(["A", "C"], ["A", "A", "C"]), true, "Multiple choice with duplicates");

  // Test 8: Null or undefined
  assertEqual(compareAnswers("A", null), false, "Compare string with null");
  assertEqual(compareAnswers(null, null), true, "Compare null with null");

  // Test 9: JSON string representation
  assertEqual(compareAnswers('["A", "B"]', ["B", "A"]), true, "JSON string vs Array");

  console.log(`\nTest Summary: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) process.exit(1);
};

runTests();
