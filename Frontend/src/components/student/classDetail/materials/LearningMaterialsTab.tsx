import React from "react";
import { Typography, Row, Col, Card, Statistic, Tag, Space } from "antd";
import {
  FolderOpenOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FilePptOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import MaterialToolbar from "./MaterialToolbar";
import MaterialList from "./MaterialList";
import MaterialEmptyState from "./MaterialEmptyState";
import MaterialLoadingSkeleton from "./MaterialLoadingSkeleton";
import MaterialPreviewDrawer from "./MaterialPreviewDrawer";
import MaterialDetailModal from "./MaterialDetailModal";
import useLearningMaterials from "../../../../hooks/useLearningMaterials";
import type { ILearningMaterial } from "../../../../types/learningMaterial";

const { Title, Text } = Typography;

interface LearningMaterialsTabProps {
  resources?: ILearningMaterial[];
  loading?: boolean;
}

export const LearningMaterialsTab: React.FC<LearningMaterialsTabProps> = React.memo(
  ({ resources = [], loading = false }) => {
    const {
      filters,
      stats,
      filteredMaterials,
      handleSearchChange,
      handleTypeChange,
      handleSortChange,
      previewItem,
      isPreviewOpen,
      openPreview,
      closePreview,
      detailItem,
      isDetailOpen,
      openDetail,
      closeDetail,
      handleCopyLink,
      handleDownload,
    } = useLearningMaterials(resources);

    const isFiltered = filters.searchQuery.trim() !== "" || filters.typeFilter !== "all";

    return (
      <div style={{ padding: "8px 0" }}>
        {/* 1. Header Banner & Stats Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1f2937" }}>
              📚 Tài liệu học tập
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Danh sách tài liệu, bài giảng, tài nguyên được giáo viên chia sẻ cho lớp học.
            </Text>
          </div>

          {/* 5 Small Statistic Badges */}
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#fafafa" }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tổng tài liệu</span>}
                  value={stats.total}
                  prefix={<FolderOpenOutlined style={{ color: "#1890ff", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#fff1f0" }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>File PDF</span>}
                  value={stats.pdf}
                  prefix={<FilePdfOutlined style={{ color: "#ff4d4f", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "#cf1322" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#e6f7ff" }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Video bài giảng</span>}
                  value={stats.video}
                  prefix={<VideoCameraOutlined style={{ color: "#1890ff", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#e6fffb" }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Web Link</span>}
                  value={stats.link}
                  prefix={<LinkOutlined style={{ color: "#13c2c2", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "#08979c" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#fff7e6" }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Slide / Docx</span>}
                  value={stats.slide + stats.other}
                  prefix={<FilePptOutlined style={{ color: "#fa8c16", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "#d46b08" }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* 2. Toolbar (Search, Filter, Sort) */}
        <MaterialToolbar
          searchQuery={filters.searchQuery}
          typeFilter={filters.typeFilter}
          sortBy={filters.sortBy}
          onSearchChange={handleSearchChange}
          onTypeChange={handleTypeChange}
          onSortChange={handleSortChange}
        />

        {/* 3. Content Box: Loading / Empty / Material List */}
        {loading ? (
          <MaterialLoadingSkeleton count={8} />
        ) : filteredMaterials.length === 0 ? (
          <MaterialEmptyState
            isFiltered={isFiltered}
            onResetFilters={() => {
              handleSearchChange("");
              handleTypeChange("all");
            }}
          />
        ) : (
          <MaterialList
            materials={filteredMaterials}
            onPreview={openPreview}
            onDownload={handleDownload}
            onCopyLink={handleCopyLink}
            onDetail={openDetail}
          />
        )}

        {/* 4. Preview Drawer */}
        <MaterialPreviewDrawer
          open={isPreviewOpen}
          item={previewItem}
          onClose={closePreview}
          onDownload={handleDownload}
        />

        {/* 5. Detail Modal */}
        <MaterialDetailModal
          open={isDetailOpen}
          item={detailItem}
          onClose={closeDetail}
          onDownload={handleDownload}
          onCopyLink={handleCopyLink}
        />
      </div>
    );
  }
);

LearningMaterialsTab.displayName = "LearningMaterialsTab";

export default LearningMaterialsTab;
