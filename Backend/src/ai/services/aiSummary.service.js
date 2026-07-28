import crypto from "crypto";
import mongoose from "mongoose";
import AISummary from "../../models/aiSummary.model.js";
import lessonContentExtractor from "./lessonContentExtractor.service.js";
import aiCoreService from "./aiCore.service.js";
import { summaryOutputValidator } from "../validators/summaryOutput.validator.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

const SUMMARY_PROMPT_VERSION = "v1.0"; // Change this to invalidate old fingerprints if prompt changes drastically

class AISummaryService {
  /**
   * Tính toán fingerprint để chống sinh lại nội dung cũ
   */
  generateFingerprint({ title, description, attachments, contentText }) {
    const attachmentKeys = (attachments || [])
      .map(a => a.publicId || a.url || "")
      .sort()
      .join("|");
    
    const raw = `${title || ""}|${description || ""}|${attachmentKeys}|${contentText || ""}|${SUMMARY_PROMPT_VERSION}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Sinh tóm tắt bài giảng
   */
  async generateSummary(lesson, user) {
    if (!lesson || !lesson._id) {
      throw new AIError("Thông tin bài giảng không hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 400);
    }

    // 1. Trích xuất nội dung bài giảng
    const { text: contentText, warnings: sourceWarnings } = await lessonContentExtractor.extractLessonContent(lesson);

    // 2. Tính fingerprint
    const fingerprint = this.generateFingerprint({
      title: lesson.title,
      description: lesson.description,
      attachments: lesson.attachments,
      contentText
    });

    // 3. Chống generate trùng (Idempotency / Caching)
    // Nếu đã có bản draft hoặc bản approved cùng fingerprint cho lesson này -> Trả về luôn
    const existingSummary = await AISummary.findOne({
      lessonId: lesson._id,
      sourceFingerprint: fingerprint,
    }).sort({ version: -1 });

    if (existingSummary && existingSummary.status !== "rejected") {
      return existingSummary;
    }

    // 4. Tìm version cao nhất hiện tại để tạo version mới
    const lastVersionDoc = await AISummary.findOne({ lessonId: lesson._id }).sort({ version: -1 });
    const nextVersion = lastVersionDoc ? lastVersionDoc.version + 1 : 1;

    // 5. Gọi AI Core Orchestration (Quản lý Quota, Gọi LLM, Error Handling)
    const aiResult = await aiCoreService.executeStructuredAI({
      userId: user._id || user.id,
      userRole: user.role,
      feature: "summary",
      templateName: "summary",
      promptParams: { contentText },
      referenceId: lesson._id,
      referenceType: "Lesson",
      validatorFunc: summaryOutputValidator,
    });

    // 6. Lưu dữ liệu Draft
    const newSummary = await AISummary.create({
      lessonId: lesson._id,
      classId: lesson.classId,
      version: nextVersion,
      status: "draft",
      summary: aiResult.data.summary,
      keyPoints: aiResult.data.keyPoints,
      suggestedReviewTopics: aiResult.data.suggestedReviewTopics,
      sourceFingerprint: fingerprint,
      sourceWarnings: sourceWarnings,
      generatedBy: user._id || user.id,
      provider: aiResult.usage.provider,
      model: aiResult.usage.model,
      aiUsageId: aiResult.usageId || null,
    });

    return newSummary;
  }

  /**
   * Duyệt bản tóm tắt (Teacher/Admin)
   */
  async approveSummary(summaryId, userId) {
    const session = await mongoose.startSession();
    try {
      let approvedDoc = null;
      await session.withTransaction(async () => {
        const summary = await AISummary.findById(summaryId).session(session);
        if (!summary) {
          throw new AIError("Không tìm thấy bản tóm tắt.", AIErrorCode.AI_INVALID_INPUT, 404);
        }

        if (summary.status === "approved") {
          throw new AIError("Bản tóm tắt này đã được duyệt.", AIErrorCode.AI_INVALID_INPUT, 409);
        }

        if (summary.status !== "draft") {
          throw new AIError(`Không thể duyệt bản tóm tắt đang ở trạng thái '${summary.status}'.`, AIErrorCode.AI_INVALID_INPUT, 409);
        }

        // Cập nhật bản approved cũ (nếu có) thành superseded
        await AISummary.updateMany(
          { lessonId: summary.lessonId, status: "approved" },
          { $set: { status: "superseded" } },
          { session }
        );

        summary.status = "approved";
        summary.reviewedBy = userId;
        summary.approvedAt = new Date();
        await summary.save({ session });
        
        approvedDoc = summary;
      });
      return approvedDoc;
    } finally {
      session.endSession();
    }
  }

  /**
   * Từ chối bản tóm tắt (Teacher/Admin)
   */
  async rejectSummary(summaryId, userId, reason) {
    const session = await mongoose.startSession();
    try {
      let rejectedDoc = null;
      await session.withTransaction(async () => {
        const summary = await AISummary.findById(summaryId).session(session);
        if (!summary) {
          throw new AIError("Không tìm thấy bản tóm tắt.", AIErrorCode.AI_INVALID_INPUT, 404);
        }

        if (summary.status !== "draft") {
          throw new AIError(`Không thể từ chối bản tóm tắt đang ở trạng thái '${summary.status}'.`, AIErrorCode.AI_INVALID_INPUT, 409);
        }

        summary.status = "rejected";
        summary.reviewedBy = userId;
        summary.rejectedAt = new Date();
        summary.rejectionReason = reason || "Không có lý do.";
        await summary.save({ session });
        
        rejectedDoc = summary;
      });
      return rejectedDoc;
    } finally {
      session.endSession();
    }
  }

  /**
   * Lấy bản tóm tắt hiện hành của một bài giảng (Cho Student)
   */
  async getApprovedSummary(lessonId) {
    return await AISummary.findOne({ lessonId, status: "approved" }).sort({ version: -1 });
  }

  /**
   * Lấy bản tóm tắt mới nhất bất kể trạng thái (Cho Teacher/Admin)
   */
  async getLatestSummary(lessonId) {
    return await AISummary.findOne({ lessonId }).sort({ version: -1 });
  }
}

export default new AISummaryService();
