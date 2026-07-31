import React, { useMemo } from "react";
import { Row, Col, Card, Skeleton, Alert } from "antd";
import PageContainer from "../../../shared/components/PageContainer";
import useStudentClasses from "../../../hooks/useStudentClasses";

// Sub-components
import MyClassesHeader from "../components/classes/MyClassesHeader";
import SearchToolbar from "../components/classes/SearchToolbar";
import ClassCard from "../components/classes/ClassCard";
import EmptyClassState from "../components/classes/EmptyClassState";

export const StudentMyClassesPage: React.FC = () => {
  const {
    classes,
    filteredClasses,
    loading,
    error,
    filters,
    availableSubjects,
    availableSemesters,
    setSearch,
    setStatusFilter,
    setSemesterFilter,
    setSubjectFilter,
    setSortBy,
    resetFilters,
  } = useStudentClasses();

  // Metrics for header
  const activeClassesCount = useMemo(
    () => classes.filter((c) => c.status === "Active" || c.status === "active").length,
    [classes]
  );

  const completedClassesCount = useMemo(
    () => classes.filter((c) => c.status === "Completed" || c.status === "completed").length,
    [classes]
  );

  const isFiltered =
    filters.search !== "" ||
    filters.status !== "ALL" ||
    filters.semester !== "ALL" ||
    filters.subject !== "ALL";

  return (
    <PageContainer maxWidth="1400px" loading={false}>
      {/* 1. Page Header with Statistics */}
      <MyClassesHeader
        totalClasses={classes.length}
        activeClassesCount={activeClassesCount}
        completedClassesCount={completedClassesCount}
      />

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải danh sách lớp học"
          description={error}
          showIcon
          closable
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {/* 2. Search & Filter Toolbar */}
      <SearchToolbar
        filters={filters}
        availableSubjects={availableSubjects}
        availableSemesters={availableSemesters}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onSemesterChange={setSemesterFilter}
        onSubjectChange={setSubjectFilter}
        onSortByChange={setSortBy}
        onReset={resetFilters}
      />

      {/* 3. Class Cards Grid or Loading Skeleton */}
      {loading ? (
        <Row gutter={[20, 20]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={key}>
              <Card style={{ borderRadius: 16, height: 320 }}>
                <Skeleton active avatar paragraph={{ rows: 5 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredClasses.length === 0 ? (
        <EmptyClassState isFiltered={isFiltered} onResetFilters={resetFilters} />
      ) : (
        <Row gutter={[20, 20]}>
          {filteredClasses.map((item) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={item._id}>
              <ClassCard item={item} />
            </Col>
          ))}
        </Row>
      )}
    </PageContainer>
  );
};

export default StudentMyClassesPage;
