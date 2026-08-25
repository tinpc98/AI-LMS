import {
  generateJaasTokenService,
  validateJaasConfig,
  getJaasAppId,
  getJaasApiKeyId,
  getJaasDomain,
  getPrivateKey,
} from "./jaas.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

export { validateJaasConfig, getJaasAppId, getJaasApiKeyId, getJaasDomain, getPrivateKey };

/**
 * Controller Sinh JWT Token JaaS (API V2 & Legacy Adapter)
 */
export const generateJaasTokenForSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const user = req.user;

  const result = await generateJaasTokenService({
    sessionId,
    user,
    isLegacy: false,
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
});
