// Test cho getAttachmentSignedUrl — chốt lỗi IDOR thật đã tìm và sửa trong đợt review toàn dự
// án: checkClassAccess (router.use ở chat.routes.js) chỉ xác nhận req.user thuộc classId trên
// URL, KHÔNG xác nhận publicId (do client tự truyền, không qua kiểm soát) thực sự thuộc lớp đó.
// Trước đây bất kỳ ai có quyền vào MỘT lớp bất kỳ đều xin được signed URL của file đính kèm
// thuộc lớp KHÁC nếu biết/đoán được publicId.
import { describe, it, expect, vi, beforeEach } from "vitest";

const getSignedUrl = vi.fn();
vi.mock("#shared/services/storage.service.js", () => ({
  default: { getSignedUrl: (...a) => getSignedUrl(...a) },
}));
vi.mock("./message.model.js", () => ({ default: {} }));
vi.mock("./chatReceipt.model.js", () => ({ default: {} }));

const { getAttachmentSignedUrl } = await import("#modules/chat/chat.controller.js");

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAttachmentSignedUrl — chặn IDOR publicId khác lớp", () => {
  it("publicId thuộc lớp KHÁC classId trên URL → 403, không gọi storageService", async () => {
    const req = {
      params: {
        classId: "classA",
        publicId: "eduspace/classes/classB/chat/doc_secret.pdf",
      },
      query: {},
    };
    const res = makeRes();
    const next = vi.fn();

    await getAttachmentSignedUrl(req, res, next);

    expect(getSignedUrl).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(403);
  });

  it("publicId thuộc ĐÚNG classId trên URL → cho phép, gọi storageService với đúng publicId", async () => {
    getSignedUrl.mockReturnValue({ signedUrl: "https://signed.example/file" });
    const req = {
      params: {
        classId: "classA",
        publicId: "eduspace/classes/classA/chat/doc_ok.pdf",
      },
      query: { resourceType: "raw" },
    };
    const res = makeRes();
    const next = vi.fn();

    await getAttachmentSignedUrl(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(getSignedUrl).toHaveBeenCalledWith(
      "eduspace/classes/classA/chat/doc_ok.pdf",
      expect.objectContaining({ resourceType: "raw" })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
