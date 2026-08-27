import React, { useRef } from "react";
import { Tag } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { YouTubeLessonPlayer } from "./YouTubeLessonPlayer";
import { lessonProgressApi } from "../../../api/lessonProgressApi";
import type { LessonBlock, LessonProgress } from "../lesson.types";

interface Props {
  lessonId: string;
  block: LessonBlock;
  isCompleted: boolean;
  onProgressUpdated: (progress: LessonProgress) => void;
}

// TÍNH NĂNG MỚI (mục 1.4): % xem thật (union các đoạn đã xem) — chỉ hỗ trợ YouTube trong giao
// diện hiện tại (player Vimeo chưa được xây, block Vimeo hiện chỉ hiện thông báo chưa hỗ trợ).
export const LessonVideoBlockView: React.FC<Props> = ({
  lessonId,
  block,
  isCompleted,
  onProgressUpdated,
}) => {
  const lastTimeRef = useRef<number | null>(null);

  const handleProgressTick = (currentTime: number) => {
    const start = lastTimeRef.current;
    lastTimeRef.current = currentTime;
    if (start === null || currentTime <= start) return;

    lessonProgressApi
      .recordVideoProgress(lessonId, block._id, { start, end: currentTime })
      .then((res) => onProgressUpdated(res.data.progress))
      .catch(() => {
        // Lỗi mạng tạm thời — lần tick tiếp theo sẽ tự báo lại đoạn mới, không cần retry thủ công.
      });
  };

  if (!block.video || block.video.platform !== "YOUTUBE") {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        {block.video?.platform === "VIMEO"
          ? "Video Vimeo chưa được hỗ trợ xem trong giao diện hiện tại."
          : "Bài học này chưa có video."}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          {block.video.title || "Video bài giảng"}
        </span>
        {isCompleted && (
          <Tag icon={<CheckCircleFilled />} color="success">
            Đã hoàn thành
          </Tag>
        )}
      </div>
      <YouTubeLessonPlayer
        videoUrl={block.video.url}
        lessonTitle={block.video.title}
        onProgressTick={handleProgressTick}
        onVideoEnded={() => {}}
      />
    </div>
  );
};

export default LessonVideoBlockView;
