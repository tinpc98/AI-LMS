import React from "react";
import { Typography, Row, Col, Card, Statistic } from "antd";
import {
  FolderOpenOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FilePptOutlined,
} from "@ant-design/icons";
import MaterialToolbar from "./MaterialToolbar";
import MaterialList from "./MaterialList";
import MaterialEmptyState from "./MaterialEmptyState";
import MaterialLoadingSkeleton from "./MaterialLoadingSkeleton";
import MaterialPreviewDrawer from "./MaterialPreviewDrawer";
import MaterialDetailModal from "./MaterialDetailModal";
import useLearningMaterials from "../../../../lesson/hooks/useLearningMaterials";
import type { ILearningMaterial } from "../../../../../types/learningMaterial";

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
            <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "var(--color-text-title)" }}>
              📚 Tài liệu học tập
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Danh sách tài liệu, bài giảng, tài nguyên được giáo viên chia sẻ cho lớp học.
            </Text>
          </div>

          {/* 5 Small Statistic Badges */}
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card
                bordered={false}
                styles={{ body: { padding: "12px 16px" } }}
                style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
              >
                <Statistic
                  title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tổng tài liệu</span>}
                  value={stats.total}
                  prefix={<FolderOpenOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-title)" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card
                bordered={false}
                styles={{ body: { padding: "12px 16px" } }}
                style={{ borderRadius: 12, backgroundColor: "var(--color-error-bg)" }}
              >
                <Statistic
                  title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>File PDF</span>}
                  value={stats.pdf}
                  prefix={<FilePdfOutlined style={{ color: "var(--color-error-base)", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-error-text)" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card
                bordered={false}
                styles={{ body: { padding: "12px 16px" } }}
                style={{ borderRadius: 12, backgroundColor: "var(--color-bg-primary-tint)" }}
              >
                <Statistic
                  title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Video bài giảng</span>}
                  value={stats.video}
                  prefix={<VideoCameraOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-action-primary-bg-active)" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card
                bordered={false}
                styles={{ body: { padding: "12px 16px" } }}
                style={{ borderRadius: 12, backgroundColor: "var(--color-info-bg)" }}
              >
                <Statistic
                  title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Web Link</span>}
                  value={stats.link}
                  prefix={<LinkOutlined style={{ color: "var(--color-info-base)", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-info-text)" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
              <Card
                bordered={false}
                styles={{ body: { padding: "12px 16px" } }}
                style={{ borderRadius: 12, backgroundColor: "var(--color-warning-bg)" }}
              >
                <Statistic
                  title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Slide / Docx</span>}
                  value={stats.slide + stats.other}
                  prefix={<FilePptOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-warning-text)" }}
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
