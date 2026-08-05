import React from "react";
import {
  FilePptOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  GlobalOutlined,
  DownloadOutlined,
  ExportOutlined,
  FileUnknownOutlined,
  FileImageOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Button, Tag, Space } from "antd";
import { classifyResource } from "../utils/resourceUtils";

interface GenericMaterialViewerProps {
  type?: string;
  url?: string;
  format?: string;
  originalFilename?: string;
  title: string;
  description?: string;
  uploaderName?: string;
  onDownload?: () => void;
}

export const GenericMaterialViewer: React.FC<GenericMaterialViewerProps> = ({
  type,
  url,
  format,
  originalFilename,
  title,
  description,
  uploaderName,
  onDownload,
}) => {
  const meta = classifyResource({ type, url, format, originalFilename });
  const isLink = meta.kind === "link";
  const isSlide = meta.kind === "slide";
  const isExcel = meta.kind === "excel";
  const isZip = meta.kind === "zip";
  const isImage = meta.kind === "image";

  let domain = "";
  try {
    if (isLink && url) {
      domain = new URL(url).hostname.replace(/^www\./, "");
    }
  } catch {
    domain = "";
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-surface-container-lowest border border-outline-variant rounded-2xl text-center min-h-[450px]">
      {/* Icon đại diện */}
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center mb-6 shadow-inner">
        {isSlide ? (
          <FilePptOutlined style={{ fontSize: 40, color: "var(--color-warning-base)" }} />
        ) : isExcel ? (
          <FileExcelOutlined style={{ fontSize: 40, color: "var(--color-success-base, #10b981)" }} />
        ) : isZip ? (
          <FileZipOutlined style={{ fontSize: 40, color: "var(--color-secondary-icon)" }} />
        ) : isImage ? (
          <FileImageOutlined style={{ fontSize: 40, color: "var(--color-action-primary-bg, #3b82f6)" }} />
        ) : isLink ? (
          <GlobalOutlined style={{ fontSize: 40, color: "var(--color-info-base)" }} />
        ) : (
          <FileUnknownOutlined style={{ fontSize: 40, color: "var(--color-text-description)" }} />
        )}
      </div>

      {/* Tag loại tài liệu */}
      <Tag
        color={
          isSlide
            ? "orange"
            : isExcel
            ? "green"
            : isZip
            ? "purple"
            : isImage
            ? "cyan"
            : isLink
            ? "blue"
            : "default"
        }
        className="mb-3 px-3 py-1 font-semibold rounded-full text-xs"
      >
        {isSlide
          ? "Bản trình chiếu Slide / PPT"
          : isExcel
          ? "Bảng tính Excel / CSV"
          : isZip
          ? "Tệp nén ZIP / RAR"
          : isImage
          ? "Hình ảnh"
          : isLink
          ? `Liên kết Website (${domain || "Web"})`
          : "Tài liệu đính kèm"}
      </Tag>

      {/* Tiêu đề & Mô tả */}
      <h2 className="text-xl font-bold text-on-surface mb-2 max-w-xl">{title}</h2>
      <p className="text-sm text-secondary max-w-lg mb-8 leading-relaxed">
        {description ||
          (isLink
            ? "Nhấn vào nút bên dưới để mở liên kết trang web tài liệu trong tab mới."
            : "Định dạng tệp này không hỗ trợ hiển thị trực tiếp trong trình duyệt. Vui lòng tải file về máy để mở bằng ứng dụng chuyên dụng.")}
      </p>

      {/* Hành động chính */}
      <Space size={14} wrap className="justify-center">
        {isLink ? (
          <Button
            type="primary"
            size="large"
            icon={<ExportOutlined />}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-6 font-semibold"
          >
            Mở liên kết trong tab mới
          </Button>
        ) : (
          onDownload && (
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={onDownload}
              className="rounded-xl px-6 font-semibold"
            >
              Tải tệp về máy
            </Button>
          )
        )}
      </Space>

      {/* Thông tin hỗ trợ */}
      <div className="mt-8 pt-6 border-t border-outline-variant/60 flex items-center space-x-2 text-xs text-secondary">
        <InfoCircleOutlined />
        <span>Người đăng: {uploaderName || "Giáo viên bộ môn"}</span>
      </div>
    </div>
  );
};

export default GenericMaterialViewer;
