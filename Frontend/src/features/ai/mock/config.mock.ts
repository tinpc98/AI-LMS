import type { AIConfiguration } from "../types/aiManagement.types";

export const mockAIConfig: AIConfiguration = {
  defaultModelId: "m-1",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 4096,
  requestTimeoutSec: 30,
  retryCount: 3,
  dailyRequestLimit: 50000,
  teacherRequestLimit: 1000,
  studentRequestLimit: 200,
  enableSafetyFilter: true,
  enableUsageLogging: true,
};
