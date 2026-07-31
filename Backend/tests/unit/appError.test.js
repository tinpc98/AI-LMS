import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from "#shared/utils/appError.js";

describe("AppError hierarchy", () => {
  it("AppError mặc định có status 500 và code INTERNAL_ERROR", () => {
    const err = new AppError("Lỗi chung");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Lỗi chung");
    expect(err.status).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.isAppError).toBe(true);
  });

  it("AppError giữ đúng details truyền vào", () => {
    const err = new AppError("x", "CUSTOM", 418, { field: "a" });
    expect(err.status).toBe(418);
    expect(err.code).toBe("CUSTOM");
    expect(err.details).toEqual({ field: "a" });
  });

  it.each([
    [ValidationError, 400, "VALIDATION_ERROR"],
    [AuthenticationError, 401, "AUTHENTICATION_ERROR"],
    [AuthorizationError, 403, "AUTHORIZATION_ERROR"],
    [NotFoundError, 404, "NOT_FOUND"],
    [ConflictError, 409, "CONFLICT"],
    [BusinessRuleError, 422, "BUSINESS_RULE_VIOLATION"],
  ])("%s có status %i và code %s", (ErrorClass, expectedStatus, expectedCode) => {
    const err = new ErrorClass();
    expect(err.status).toBe(expectedStatus);
    expect(err.code).toBe(expectedCode);
    expect(err.isAppError).toBe(true);
    expect(err).toBeInstanceOf(AppError);
  });

  it("Mỗi subclass nhận message tùy chỉnh", () => {
    const err = new NotFoundError("Không tìm thấy lớp học");
    expect(err.message).toBe("Không tìm thấy lớp học");
  });
});
