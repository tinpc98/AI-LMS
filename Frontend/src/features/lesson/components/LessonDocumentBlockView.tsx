import React, { useEffect, useRef, useState } from "react";
import { Button, Tag } from "antd";
import { CheckCircleFilled, FileTextOutlined } from "@ant-design/icons";
import { AttachmentViewerModal } from "../../../shared/components/AttachmentViewerModal";
import { lessonProgressApi } from "../../../api/lessonProgressApi";
import type { LessonBlock, LessonProgress } from "../lesson.types";

interface Props {
  lessonId: string;
  block: LessonBlock;
  isCompleted: boolean;
  onProgressUpdated: (progress: LessonProgress) => void;
}

// TÍNH NĂNG MỚI (mục 1.4): mở tài liệu (>= 30s) mới tính hoàn thành — gọi document-open khi mở
// modal xem (lấy kèm signed URL), document-close khi đóng modal (gửi số giây đã mở).
export const LessonDocumentBlockView: React.FC<Props> = ({
  lessonId,
  block,
  isCompleted,
  onProgressUpdated,
}) => {
  const [open, setOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const openedAtRef = useRef<number | null>(null);

  const handleOpen = async () => {
    setOpen(true);
    openedAtRef.current = Date.now();
    try {
      const res = await lessonProgressApi.recordDocumentOpen(lessonId, block._id);
      setDocumentUrl(res.data.documentUrl);
      onProgressUpdated(res.data.progress);
    } catch {
      // Modal vẫn mở với url cũ (nếu có) — lỗi mạng không nên chặn học sinh xem tài liệu.
    }
  };

  const handleClose = () => {
    setOpen(false);
    const openedAt = openedAtRef.current;
    openedAtRef.current = null;
    if (openedAt === null) return;

    const openedSeconds = Math.round((Date.now() - openedAt) / 1000);
    if (openedSeconds <= 0) return;

    lessonProgressApi
      .recordDocumentClose(lessonId, block._id, { openedSeconds })
      .then((res) => onProgressUpdated(res.data.progress))
      .catch(() => {});
  };

  // Gửi nốt thời gian đã mở nếu học sinh rời trang mà không đóng modal tường minh.
  useEffect(() => {
    return () => {
      if (openedAtRef.current === null) return;
      const openedSeconds = Math.round((Date.now() - openedAtRef.current) / 1000);
      if (openedSeconds > 0) {
        lessonProgressApi
          .recordDocumentClose(lessonId, block._id, { openedSeconds })
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!block.document) return null;

  return (
    <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <FileTextOutlined style={{ fontSize: 28, color: "#f5222d" }} />
        <div className="min-w-0">
          <div className="font-semibold text-gray-800 truncate">
            {block.document.title || "Tài liệu bài giảng"}
          </div>
          <div className="text-xs text-gray-400 uppercase">{block.document.fileType || ""}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isCompleted && (
          <Tag icon={<CheckCircleFilled />} color="success">
            Đã đọc
          </Tag>
        )}
        <Button type="primary" onClick={handleOpen}>
          Xem tài liệu
        </Button>
      </div>

      <AttachmentViewerModal
        open={open}
        onClose={handleClose}
        file={
          documentUrl
            ? {
                name: block.document.title || "Tài liệu",
                url: documentUrl,
                format: block.document.fileType,
              }
            : null
        }
      />
    </div>
  );
};

export default LessonDocumentBlockView;
