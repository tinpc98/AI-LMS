import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import LiveSession from "../models/liveSession.model.js";
import classModel from "../models/class.model.js";

// Đọc cấu hình linh hoạt từ environment variables (.env)
const DEFAULT_APP_ID = "vpaas-magic-cookie-fbd136285b3941a2a16d9e56702c3bd2";
const DEFAULT_API_KEY_ID = "vpaas-magic-cookie-fbd136285b3941a2a16d9e56702c3bd2/43bb4c";
const DEFAULT_DOMAIN = "8x8.vc";

export const getJaasAppId = () => process.env.JAAS_APP_ID || DEFAULT_APP_ID;
export const getJaasApiKeyId = () => process.env.JAAS_API_KEY_ID || DEFAULT_API_KEY_ID;
export const getJaasDomain = () => process.env.JAAS_DOMAIN || DEFAULT_DOMAIN;

// Hàm đọc Private Key RSA linh hoạt
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

/**
 * Validate Cấu hình 8x8 JaaS khi Server khởi động (Fail-fast check)
 */
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
 * Sinh JWT Token JaaS chuẩn cho 1 phiên LiveSession cụ thể
 * BẢO MẬT SPRINT J2: KHÔNG DÙNG WILDCARD "*", room = session.roomName
 */
export const generateJaasTokenForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { roomName: legacyRoomName } = req.body;
    const user = req.user;

    const privateKey = getPrivateKey();
    if (!privateKey) {
      return res.status(503).json({
        success: false,
        message: "Dịch vụ 8x8 JaaS chưa được cấu hình Private Key hợp lệ trên Server!",
      });
    }

    let targetSession = req.liveSession;

    // Nếu gọi qua route V2 (/sessions/:sessionId/token)
    if (sessionId) {
      targetSession = await LiveSession.findById(sessionId);
    } 
    // Trường hợp Adapter Legacy (/jaas-token) nhận roomName
    else if (legacyRoomName) {
      targetSession = await LiveSession.findOne({
        $or: [{ roomName: legacyRoomName }, { meetingRoomId: legacyRoomName }],
        status: "Live",
        isDeleted: false,
      });
    }

    if (!targetSession || targetSession.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy buổi học trực tuyến hoặc buổi học đã bị xóa!",
      });
    }

    if (targetSession.status !== "Live") {
      return res.status(409).json({
        success: false,
        message: `Buổi học trực tuyến đã kết thúc (${targetSession.status}). Không thể cấp Token tham gia!`,
      });
    }

    // Tự động kiểm tra Ownership/Enrollment trên Class
    const classInfo = req.classInfo || (await classModel.findById(targetSession.classId));
    if (!classInfo || classInfo.isDeleted) {
      return res.status(404).json({ success: false, message: "Lớp học liên kết không tồn tại!" });
    }

    const userIdStr = String(user.id || user._id);
    const userRoleStr = (user.role || "").toLowerCase();
    const isTeacherOwner = classInfo.teacherId && String(classInfo.teacherId) === userIdStr;
    const isAdmin = userRoleStr === "admin";
    const isEnrolledStudent = Array.isArray(classInfo.students) &&
      classInfo.students.some((s) => String(s.studentId) === userIdStr && s.status === "Enrolled");

    if (!isTeacherOwner && !isAdmin && !isEnrolledStudent) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền tham gia buổi học trực tuyến của lớp học này!",
      });
    }

    // Moderator CHỈ DÙNG TRUE nếu là Giáo viên chủ trì lớp (hoặc Admin)
    const isModerator = Boolean(isTeacherOwner || isAdmin);
    const targetRoomName = targetSession.roomName || targetSession.meetingRoomId;

    const now = Math.floor(Date.now() / 1000);
    const appId = getJaasAppId();
    const apiKeyId = getJaasApiKeyId();

    // Payload JWT chuẩn 8x8 JaaS: room = targetRoomName (TUYỆT ĐỐI KHÔNG DÙNG WILDCARD "*")
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

    return res.status(200).json({
      success: true,
      token,
      appId,
      domain: getJaasDomain(),
      roomName: targetRoomName,
      sessionId: targetSession._id,
      moderator: isModerator,
    });
  } catch (error) {
    console.error("[JaaS Controller Error]:", error);
    return res.status(500).json({ success: false, message: `Lỗi tạo JWT JaaS: ${error.message}` });
  }
};

// Export alias giữ nguyên tương thích cho route legacy
export const generateJaasToken = generateJaasTokenForSession;

