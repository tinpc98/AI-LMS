import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let consoleLogs = [];
  page.on("console", msg => {
    if (msg.text().includes("Download the React DevTools")) return;
    if (msg.text().includes("[vite]")) return;
    consoleLogs.push(`[Browser ${msg.type()}] ${msg.text()}`);
  });

  page.on("requestfinished", request => {
    if (request.url().includes("/answers")) {
      consoleLogs.push(`[Network PATCH] ${request.url()} -> HTTP ${request.response()?.status()}`);
    }
  });

  try {
    console.log("Navigating to login...");
    await page.goto("http://localhost:5173/login");
    await page.fill('input[type="email"]', "test_e2e_bugfix@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    console.log("Waiting for dashboard...");
    await page.waitForURL("**/student**", { timeout: 10000 });
    
    console.log("Navigating to My Classes...");
    await page.goto("http://localhost:5173/student/myclasses");
    
    console.log("Entering first class...");
    await page.waitForSelector(".ant-card-meta-title");
    const classTitles = await page.$$(".ant-card-meta-title");
    if (classTitles.length > 0) {
      await classTitles[0].click();
    } else {
      console.log("No classes found!");
      return;
    }
    
    console.log("Opening Exams tab...");
    await page.waitForSelector("text=Bài kiểm tra", { timeout: 10000 });
    await page.click("text=Bài kiểm tra");

    console.log("Starting Exam...");
    await page.waitForSelector("button:has-text('Bắt đầu')", { timeout: 10000 });
    const btn = await page.$("button:has-text('Bắt đầu')");
    if (btn) await btn.click();
    
    // In Modal
    console.log("Confirming Exam start...");
    await page.waitForSelector("text=Lưu ý quan trọng trước khi làm bài");
    await page.click('button:has-text("Bắt đầu làm bài")');
    
    console.log("Waiting for Exam page to load...");
    await page.waitForURL("**/exam/**", { timeout: 10000 });
    await page.waitForTimeout(2000); // let questions load
    
    console.log("Selecting Answer 1...");
    const radios = await page.$$('input[type="radio"]');
    if (radios.length > 0) {
      // simulate checking a radio button by clicking its parent label
      await radios[0].evaluate(node => node.click());
      console.log("Answer 1 selected. Waiting for autosave (2s)...");
      await page.waitForTimeout(2000);
      
      console.log("Selecting Answer 2...");
      await radios[1].evaluate(node => node.click());
      console.log("Answer 2 selected. Waiting for autosave (2s)...");
      await page.waitForTimeout(2000);
    } else {
      console.log("No radio buttons found, typing into essay textarea instead...");
      const textareas = await page.$$('textarea');
      if (textareas.length > 0) {
        await textareas[0].fill("This is a test answer for essay.");
        console.log("Essay text filled. Waiting for autosave (2s)...");
        await page.waitForTimeout(2000);
        await textareas[0].fill("This is another change.");
        console.log("Essay text changed. Waiting for autosave (2s)...");
        await page.waitForTimeout(2000);
      } else {
        console.log("No answer inputs found at all.");
      }
    }
    
    console.log("--- BROWSER CONSOLE & NETWORK LOGS ---");
    consoleLogs.forEach(log => console.log(log));
    console.log("--------------------------------------");
    
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
