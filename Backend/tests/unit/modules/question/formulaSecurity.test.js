import { describe, it, beforeAll, afterAll } from "vitest";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../../../../src/app.js";
import User from "../../../../src/modules/auth/user.model.js";
import Topic from "../../../../src/modules/topic/topic.model.js";
import { connectDB, disconnectDB } from "../../../integration/domain04/testUtils.js";

const app = createApp();

describe("Formula Security Validation", () => {
  let teacherToken;
  let topicId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeAll(async () => {
    const teacher = await User.create({
      username: "teacher_sec_test_" + Date.now(),
      email: `teacher_sec_test_${Date.now()}@example.com`,
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
      name: "Security Test Topic",
      courseId: new mongoose.Types.ObjectId(),
    });
    topicId = topic._id;
  });

  afterAll(async () => {
    await User.deleteMany({ role: "Teacher" });
    await Topic.deleteMany({});
  });

  it("should reject FORMULA with <script> tag", async () => {
    const payload = {
      topicId,
      type: "ESSAY",
      content: [
        {
          id: "c1",
          type: "FORMULA",
          order: 1,
          displayMode: "INLINE",
          latex: "\\frac{1}{2} <script>alert(1)</script>",
        },
      ],
    };

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).to.equal(400);
    expect(res.body.errors[0].message).to.include("chứa payload nguy hiểm (XSS)");
  });

  it("should reject FORMULA with javascript: URI", async () => {
    const payload = {
      topicId,
      type: "ESSAY",
      content: [
        {
          id: "c1",
          type: "FORMULA",
          order: 1,
          displayMode: "BLOCK",
          latex: "\\href{javascript:alert(1)}{click}",
        },
      ],
    };

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).to.equal(400);
    expect(res.body.errors[0].message).to.include("chứa payload nguy hiểm (XSS)");
  });

  it("should accept valid FORMULA", async () => {
    const payload = {
      topicId,
      type: "ESSAY",
      points: 10,
      content: [
        {
          id: "c1",
          type: "FORMULA",
          order: 1,
          displayMode: "BLOCK",
          latex: "E = mc^2",
        },
      ],
    };

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).to.equal(201);
  });
});
