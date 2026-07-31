import assert from "assert";
import lessonContentExtractorService from "#modules/ai/services/lessonContentExtractor.service.js";

let pass = 0;
let fail = 0;

function runTest(name, testFn) {
  return Promise.resolve(testFn())
    .then(() => {
      console.log(`[PASS] ${name}`);
      pass++;
    })
    .catch((error) => {
      console.error(`[FAIL] ${name}`);
      console.error(error.message);
      fail++;
    });
}

// Mocking fetch
const originalFetch = global.fetch;

async function executeTests() {
  // Test: Content-Length exceeds max size
  await runTest("1. Content-Length vượt giới hạn", async () => {
    global.fetch = async () => ({
      ok: true,
      headers: new Headers({ "content-length": "20000000" }), // 20MB > 10MB
      status: 200,
    });
    try {
      await lessonContentExtractorService.fetchSafeBuffer("https://res.cloudinary.com/test.pdf");
      assert.fail("Should have thrown");
    } catch (e) {
      assert.match(e.message, /báo cáo kích thước vượt quá giới hạn/);
    }
  });

  // Test: Stream size exceeds max size
  await runTest("2. Stream thực tế vượt giới hạn (Dù không có Content-Length)", async () => {
    const streamPayload = new Uint8Array(11 * 1024 * 1024); // 11MB
    let readCalled = false;

    global.fetch = async () => ({
      ok: true,
      headers: new Headers(), // No content length
      status: 200,
      body: {
        getReader: () => ({
          read: async () => {
            if (!readCalled) {
              readCalled = true;
              return { done: false, value: streamPayload };
            }
            return { done: true };
          },
        }),
      },
    });

    try {
      await lessonContentExtractorService.fetchSafeBuffer("https://res.cloudinary.com/test2.pdf");
      assert.fail("Should have thrown");
    } catch (e) {
      assert.match(e.message, /thực tế vượt quá giới hạn/);
    }
  });

  // Test: URL is private IP
  await runTest("3. Chặn URL localhost/private IP", async () => {
    try {
      await lessonContentExtractorService.fetchSafeBuffer("http://localhost/test.pdf");
      assert.fail("Should have thrown");
    } catch (e) {
      assert.match(e.message, /không an toàn/);
    }
  });

  console.log(`\nKết quả Fix 2: PASS: ${pass}, FAIL: ${fail}`);
  global.fetch = originalFetch;
  if (fail > 0) process.exit(1);
}

executeTests();
