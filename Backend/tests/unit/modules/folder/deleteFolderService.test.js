// Test cho deleteFolderService — chốt lỗi thật đã tìm và sửa trong đợt review toàn dự án: xóa
// folder trước đây chỉ xóa mềm ĐÚNG 1 folder được chọn, không cascade xuống thư mục con —
// getFolderTreeService chỉ gắn con vào cây khi tìm thấy cha trong tập folder CHƯA xóa, nên cha
// biến mất thì con cũng biến mất khỏi cây (dù vẫn "sống" isDeleted:false trong DB), không ai
// truy cập lại được qua danh sách.
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const folderFindOne = vi.fn();
const folderFind = vi.fn();
const folderUpdateMany = vi.fn();

vi.mock("#modules/folder/folder.model.js", () => ({
  default: {
    findOne: (...a) => folderFindOne(...a),
    find: (...a) => folderFind(...a),
    updateMany: (...a) => folderUpdateMany(...a),
  },
}));

const { deleteFolderService } = await import("#modules/folder/folder.service.js");

const OWNER_ID = new mongoose.Types.ObjectId().toString();
const ROOT_ID = new mongoose.Types.ObjectId().toString();
const CHILD_ID = new mongoose.Types.ObjectId().toString();
const GRANDCHILD_ID = new mongoose.Types.ObjectId().toString();

const mongooseSelect = (result) => ({ select: () => ({ lean: () => Promise.resolve(result) }) });

beforeEach(() => {
  vi.clearAllMocks();
  folderUpdateMany.mockResolvedValue({ modifiedCount: 0 });
});

describe("deleteFolderService — cascade xuống thư mục con (BUG ĐÃ SỬA)", () => {
  it("Xóa folder có 2 cấp con (child + grandchild) → cả 2 đều bị isDeleted qua updateMany", async () => {
    const rootDoc = {
      _id: ROOT_ID,
      ownerId: OWNER_ID,
      isDeleted: false,
      softDelete: vi.fn().mockResolvedValue(true),
    };
    folderFindOne.mockResolvedValue(rootDoc);

    // Tầng 1: con trực tiếp của ROOT
    folderFind.mockReturnValueOnce(mongooseSelect([{ _id: CHILD_ID }]));
    // Tầng 2: con của CHILD (cháu của ROOT)
    folderFind.mockReturnValueOnce(mongooseSelect([{ _id: GRANDCHILD_ID }]));
    // Tầng 3: không còn con nào nữa → dừng
    folderFind.mockReturnValueOnce(mongooseSelect([]));

    await deleteFolderService(ROOT_ID, OWNER_ID);

    expect(folderUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: [CHILD_ID, GRANDCHILD_ID] } },
      expect.objectContaining({ isDeleted: true, deletedBy: OWNER_ID })
    );
    expect(rootDoc.softDelete).toHaveBeenCalledWith(OWNER_ID);
  });

  it("Folder không có con nào → không gọi updateMany (không cascade thừa)", async () => {
    const rootDoc = {
      _id: ROOT_ID,
      ownerId: OWNER_ID,
      isDeleted: false,
      softDelete: vi.fn().mockResolvedValue(true),
    };
    folderFindOne.mockResolvedValue(rootDoc);
    folderFind.mockReturnValueOnce(mongooseSelect([]));

    await deleteFolderService(ROOT_ID, OWNER_ID);

    expect(folderUpdateMany).not.toHaveBeenCalled();
    expect(rootDoc.softDelete).toHaveBeenCalledWith(OWNER_ID);
  });

  it("Folder không tồn tại hoặc không thuộc sở hữu → 404, không đụng gì tới DB", async () => {
    folderFindOne.mockResolvedValue(null);

    await expect(deleteFolderService(ROOT_ID, OWNER_ID)).rejects.toMatchObject({ status: 404 });
    expect(folderFind).not.toHaveBeenCalled();
    expect(folderUpdateMany).not.toHaveBeenCalled();
  });
});
