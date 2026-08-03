import React from "react";
import { Table } from "antd";
import type { TableProps } from "antd";
import "./ResponsiveTable.css";

export interface ResponsiveTableProps<RecordType extends object = any>
  extends TableProps<RecordType> {
  /**
   * Tự động đặt scroll.x = "max-content" nếu chưa cấu hình để chống tràn vỡ layout trên mobile.
   * Mặc định là true.
   */
  autoScrollX?: boolean;
}

/**
 * ResponsiveTable: Wrapper chuẩn Ant Design Table cho EduSpace Design System
 * - Đảm bảo không bao giờ làm vỡ layout ở mọi breakpoint (đặc biệt < 768px).
 * - Cuộn ngang mượt mà với thanh cuộn thu gọn tinh tế.
 * - Giữ nguyên 100% API của Ant Design Table.
 */
export function ResponsiveTable<RecordType extends object = any>({
  autoScrollX = true,
  scroll,
  className,
  ...props
}: ResponsiveTableProps<RecordType>) {
  const mergedScroll = autoScrollX
    ? { x: "max-content", ...scroll }
    : scroll;

  return (
    <div className={`responsive-table-wrapper ${className || ""}`}>
      <Table<RecordType>
        scroll={mergedScroll}
        {...props}
      />
    </div>
  );
}

export default ResponsiveTable;
