import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import LiveSession from "../models/liveSession.model.js";
import classModel from "../models/class.model.js";
import { LiveError, LIVE_ERROR_CODES } from "../validators/live.validator.js";

const DEFAULT_DOMAIN = "8x8.vc";

export const getJaasAppId = () => process.env.JAAS_APP_ID || null;
export const getJaasApiKeyId = () => process.env.JAAS_API_KEY_ID || null;
export const getJaasDomain = () => process.env.JAAS_DOMAIN || DEFAULT_DOMAIN;

export const getPrivateKey = () => {
  if (process.env.JAAS_PRIVATE_KEY) {
    return process.env.JAAS_PRIVATE_KEY.replace(/\\n/g, "\n");
  }

  const keyPath = path.join(process.cwd(), "keys/jaas_private_key.pk");
  if (fs.existsSync(keyPath)) {
    const keyContent = fs.readFileSync(keyPath, "utf8").trim();
    if (keyContent && !keyContent.includes("PASTE_YOUR_8X8_JAAS_RSA_PRIVATE_KEY_HERE")) {
      return keyContent;
    }
  }

  return null;
};

export const validateJaasConfig = () => {
  const privateKey = getPrivateKey();
  const appId = getJaasAppId();
  const apiKeyId = getJaasApiKeyId();

  if (!appId || !apiKeyId) {
    console.warn("⚠️ [JaaS Config Warning] Thiếu JAAS_APP_ID hoặc JAAS_API_KEY_ID!");
    return false;
  }

  if (!privateKey) {
    console.warn("⚠️ [JaaS Config Warning] Chưa cấu hình JAAS_PRIVATE_KEY trong .env!");
    return false;
  }

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    console.warn("⚠️ [JaaS Config Warning] JAAS_PRIVATE_KEY không phải định dạng PEM hợp lệ!");
    return false;
  }

  console.log("✅ [JaaS Config] Cấu hình 8x8 JaaS hợp lệ.");
  return true;
};

/**
 * Service sinh JWT JaaS cho phiên LiveSession
 * QUYẾT ĐỊNH CHÍNH THỨC: Admin KHÔNG ĐƯỢC PHÉP nhận Token.
 */
export const generateJaasTokenService = async ({ sessionId, user }) => {
  const userRole = (user?.role || "").toLowerCase();

  // Admin bị CHẶN HOÀN TOÀN
  if (userRole === "admin") {
    throw new LiveError(
      "Quản trị viên không được phép vận hành hoặc tham gia buổi học trực tuyến.",
      403,
      LIVE_ERROR_CODES.ADMIN_OPERATION_NOT_ALLOWED
    );
  }

  const privateKey = getPrivateKey();
  if (!privateKey) {
    throw new LiveError(
      "Dịch vụ 8x8 JaaS chưa được cấu hình Private Key hợp lệ trên Server!",
      503,
      LIVE_ERROR_CODES.JAAS_UNAVAILABLE
    );
  }

  if (!getJaasAppId() || !getJaasApiKeyId()) {
    throw new LiveError(
      "Dịch vụ 8x8 JaaS chưa được cấu hình App ID / API Key ID hợp lệ trên Server!",
      503,
      LIVE_ERROR_CODES.JAAS_UNAVAILABLE
    );
  }

  let targetSession = null;

  if (sessionId) {
    targetSession = await LiveSession.findById(sessionId).lean();
  }

  if (!targetSession || targetSession.isDeleted) {
    throw new LiveError(
      "Không tìm thấy buổi học trực tuyến hoặc buổi học đã bị xóa!",
      404,
      LIVE_ERROR_CODES.SESSION_NOT_FOUND
    );
  }

  if (targetSession.status !== "Live") {
    throw new LiveError(
      `Buổi học trực tuyến đã kết thúc (${targetSession.status}). Không thể cấp Token tham gia!`,
      409,
      LIVE_ERROR_CODES.SESSION_ALREADY_ENDED
    );
  }

  const classInfo = await classModel.findById(targetSession.classId).lean();
  if (!classInfo || classInfo.isDeleted) {
    throw new LiveError("Lớp học liên kết không tồn tại!", 404, LIVE_ERROR_CODES.CLASS_NOT_FOUND);
  }

  const userIdStr = String(user.id || user._id);
  const isTeacherOwner = classInfo.teacherId && String(classInfo.teacherId) === userIdStr;
  const isEnrolledStudent =
    Array.isArray(classInfo.students) &&
    classInfo.students.some((s) => String(s.studentId) === userIdStr && s.status === "Enrolled");

  if (!isTeacherOwner && !isEnrolledStudent) {
    throw new LiveError(
      "Bạn không có quyền tham gia buổi học trực tuyến của lớp học này!",
      403,
      isTeacherOwner ? LIVE_ERROR_CODES.TEACHER_NOT_OWNER : LIVE_ERROR_CODES.STUDENT_NOT_ENROLLED
    );
  }

  // Moderator CHỈ DÙNG TRUE duy nhất cho Giáo viên sở hữu Lớp học
  const isModerator = Boolean(isTeacherOwner);
  const targetRoomName = targetSession.roomName || targetSession.meetingRoomId;

  const now = Math.floor(Date.now() / 1000);
  const appId = getJaasAppId();
  const apiKeyId = getJaasApiKeyId();

  // Payload JWT: room = targetRoomName (TUYỆT ĐỐI KHÔNG DÙNG WILDCARD "*")
  const payload = {
    aud: "jitsi",
    iss: "chat",
    sub: appId,
    room: targetRoomName,
    nbf: now - 10,
    context: {
      user: {
        id: userIdStr,
        name: user.fullName || user.name || "User",
        email: user.email || "",
        avatar: user.avatar || "",
        moderator: isModerator,
      },
      features: {
        recording: false,
        livestreaming: false,
        transcription: false,
      },
    },
  };

  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "2h",
    header: {
      kid: apiKeyId,
    },
  });

  return {
    sessionId: targetSession._id.toString(),
    roomName: targetRoomName,
    appId,
    domain: getJaasDomain(),
    token,
    moderator: isModerator,
    expiresAt: new Date((now + 7200) * 1000).toISOString(),
  };
};
