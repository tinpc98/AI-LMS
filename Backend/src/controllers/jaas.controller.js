import {
  generateJaasTokenService,
  validateJaasConfig,
  getJaasAppId,
  getJaasApiKeyId,
  getJaasDomain,
  getPrivateKey,
} from "../services/jaas.service.js";
import { LiveError, sendLiveError } from "../validators/live.validator.js";

export { validateJaasConfig, getJaasAppId, getJaasApiKeyId, getJaasDomain, getPrivateKey };

/**
 * Controller Sinh JWT Token JaaS (API V2 & Legacy Adapter)
 */
export const generateJaasTokenForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { roomName: legacyRoomName } = req.body;
    const user = req.user;
    const isLegacy = Boolean(req.originalUrl?.endsWith("/jaas-token"));

    const result = await generateJaasTokenService({
      sessionId,
      legacyRoomName,
      user,
      isLegacy,
    });

    if (isLegacy) {
      return res.status(200).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof LiveError) {
      return sendLiveError(res, error.statusCode, error.code, error.message, error.details);
    }
    console.error("[JaaS Controller Error]:", error);
    return res.status(500).json({ success: false, message: `Lỗi tạo JWT JaaS: ${error.message}` });
  }
};

export const generateJaasToken = generateJaasTokenForSession;

