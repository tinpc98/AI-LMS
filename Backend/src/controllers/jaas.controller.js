import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const JAAS_APP_ID = "vpaas-magic-cookie-fbd136285b3941a2a16d9e56702c3bd2";
const API_KEY_ID = "vpaas-magic-cookie-fbd136285b3941a2a16d9e56702c3bd2/43bb4c";

// Hàm đọc Private Key linh hoạt (từ .env hoặc file keys/jaas_private_key.pk)
const getPrivateKey = () => {
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

export const generateJaasToken = async (req, res) => {
  try {
    const { roomName } = req.body;
    const user = req.user; // Lấy từ authMiddleware

    const privateKey = getPrivateKey();
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: "Chưa cấu hình Private Key 8x8 JaaS! Vui lòng dán nội dung file private key tải từ 8x8 JaaS Dashboard vào file Backend/keys/jaas_private_key.pk",
      });
    }

    // Kiểm tra role (chấp nhận cả "Teacher", "teacher", "Admin", "admin")
    const isTeacher = user?.role?.toLowerCase() === "teacher" || user?.role?.toLowerCase() === "admin";

    const now = Math.floor(Date.now() / 1000);

    // Cấu hình Payload chuẩn 8x8 JaaS (8x8.vc)
    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: JAAS_APP_ID,
      room: "*", // Sử dụng wildcard "*" để khớp với mọi phòng học dưới App ID
      nbf: now - 10,
      context: {
        user: {
          id: String(user._id || user.id || "user"),
          name: user.fullName || "User",
          email: user.email || "",
          avatar: user.avatar || "",
          moderator: Boolean(isTeacher), // Boolean true/false chuẩn 8x8
        },
        features: {
          recording: false,      // Boolean false (Không dùng string "false")
          livestreaming: false,  // Boolean false
          transcription: false,  // Boolean false
        },
      },
    };

    // Ký JWT với thuật toán RS256
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "2h",
      header: {
        kid: API_KEY_ID,
      },
    });

    return res.status(200).json({
      success: true,
      token,
      appId: JAAS_APP_ID,
    });
  } catch (error) {
    console.error("[JaaS Controller Error]:", error);
    return res.status(500).json({ success: false, message: `Lỗi tạo JWT JaaS: ${error.message}` });
  }
};

