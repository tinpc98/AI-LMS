import { describe, it } from "vitest";
import { expect } from "chai";
import mongoose from "mongoose";
import Lesson from "../../../../src/modules/lesson/lesson.model.js";

describe("Lesson Schema Validation", () => {
  it("should reject Lesson without title", async () => {
    const lesson = new Lesson({
      topicId: new mongoose.Types.ObjectId(),
      status: "DRAFT",
    });

    try {
      await lesson.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.title).to.exist;
    }
  });

  it("should reject Lesson without topicId", async () => {
    const lesson = new Lesson({
      title: "Valid Title",
      status: "DRAFT",
    });

    try {
      await lesson.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.topicId).to.exist;
    }
  });

  it("should accept valid DRAFT Lesson", async () => {
    const lesson = new Lesson({
      topicId: new mongoose.Types.ObjectId(),
      title: "Valid Title",
      status: "DRAFT",
      createdBy: new mongoose.Types.ObjectId(),
    });

    await lesson.validate();
  });
});
