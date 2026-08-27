import { describe, it, beforeAll, afterAll } from "vitest";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../../../../src/app.js";

const app = createApp();
import User from "../../../../src/modules/auth/user.model.js";
import Topic from "../../../../src/modules/topic/topic.model.js";
import { connectDB, disconnectDB } from "../../../integration/domain04/testUtils.js";

describe("ContentBlock & MCQ Logic Validation", () => {
  let teacherToken;
  let topicId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeAll(async () => {
    // Giả sử có kết nối DB mock trong môi trường test
    const teacher = await User.create({
      username: "teacher_test_" + Date.now(),
      email: `teacher_test_${Date.now()}@example.com`,
      password: "Password123!",
      fullName: "Test Teacher",
      role: "Teacher",
    });

    teacherToken = jwt.sign(
      { id: teacher._id, role: "Teacher" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    const topic = await Topic.create({
      name: "Test Topic",
      courseId: new mongoose.Types.ObjectId(),
      createdBy: teacher._id,
    });
    topicId = topic._id;
  });

  afterAll(async () => {
    await User.deleteMany({ role: "Teacher" });
    await Topic.deleteMany({});
  });

  it("should reject Question without any ContentBlock", async () => {
    const payload = {
      topicId,
      type: "MCQ",
      selectionMode: "SINGLE",
      content: [],
      options: [
        {
          id: "1",
          order: 1,
          isCorrect: true,
          content: [{ id: "c1", type: "TEXT", text: "A", order: 1 }],
        },
        {
          id: "2",
          order: 2,
          isCorrect: false,
          content: [{ id: "c2", type: "TEXT", text: "B", order: 2 }],
        },
      ],
    };

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).to.equal(400);
    expect(res.body.errors[0].message).to.include("Phải có ít nhất 1 ContentBlock");
  });

  it("should reject MCQ with less than 2 options", async () => {
    const payload = {
      topicId,
      type: "MCQ",
      selectionMode: "SINGLE",
      content: [{ id: "c0", type: "TEXT", text: "Test", order: 1 }],
      options: [
        {
          id: "1",
          order: 1,
          isCorrect: true,
          content: [{ id: "c1", type: "TEXT", text: "A", order: 1 }],
        },
      ],
    };

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).to.equal(400);
    expect(res.body.errors[0].message).to.include("tối thiểu 2 options");
  });

  it("should reject SINGLE MCQ without exactly 1 correct option", async () => {
    const payload = {
      topicId,
      type: "MCQ",
      selectionMode: "SINGLE",
      content: [{ id: "c0", type: "TEXT", text: "Test", order: 1 }],
      options: [
        {
          id: "1",
          order: 1,
          isCorrect: true,
          content: [{ id: "c1", type: "TEXT", text: "A", order: 1 }],
        },
        {
          id: "2",
          order: 2,
          isCorrect: true,
          content: [{ id: "c2", type: "TEXT", text: "B", order: 2 }],
        },
      ],
    };

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).to.equal(400);
    expect(res.body.errors[0].message).to.include("đúng 1 đáp án đúng");
  });
});
