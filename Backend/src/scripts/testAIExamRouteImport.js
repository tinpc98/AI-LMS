import express from "express";
import ExamRouter from "../routes/exam.routes.js";

let found = false;
ExamRouter.stack.forEach((handler) => {
  if (handler.route && handler.route.path === '/generate-from-examset' && handler.route.methods.post) {
    found = true;
  }
});

if (found) {
  console.log("PASS: POST /generate-from-examset đã được đăng ký");
  process.exit(0);
} else {
  console.error("FAIL: Route not found");
  process.exit(1);
}
