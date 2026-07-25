import { Card, Typography } from "antd";
import TeacherAssignmentHeader from "./TeacherAssignmentHeader";
import TeacherAssignmentStatistic from "./TeacherAssignmentStatistic";
import TeacherAssignmentFilter from "./TeacherAssignmentFilter";
import TeacherAssignmentTable from "./TeacherAssignmentTable";
import AssignTeacherModal from "./AssignTeacherModal";
import ChangeTeacherModal from "./ChangeTeacherModal";
import DeleteAssignmentModal from "./DeleteAssignmentModal";
import TeacherAssignmentDrawer from "./TeacherAssignmentDrawer";
import { useTeacherAssignment } from "./useTeacherAssignment";

const TeacherAssignmentPage = () => {
  const {
    classes,
    allClasses,
    teachers,
    courses,
    filters,
    setFilters,
    loading,
    stats,
    teachingLoadMap,
    assignModalOpen,
    setAssignModalOpen,
    changeModalOpen,
    setChangeModalOpen,
    removeModalOpen,
    setRemoveModalOpen,
    drawerOpen,
    setDrawerOpen,
    selectedClass,
    selectedTeacher,
    actionLoading,
    loadData,
    openAssignModal,
    openChangeModal,
    openRemoveModal,
    openDrawer,
    handleAssign,
    handleChange,
    handleRemove,
  } = useTeacherAssignment();

  return (
    <div>
      <TeacherAssignmentHeader />

      <TeacherAssignmentStatistic stats={stats} />

      <Card bordered={false}>
        <TeacherAssignmentFilter
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={() => void loadData()}
          courses={courses}
          teachers={teachers}
        />

        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Showing {classes.length} class(es)</Typography.Text>
        </div>

        <div style={{ marginTop: 16 }}>
          <TeacherAssignmentTable
            data={classes}
            loading={loading}
            courses={courses}
            teachers={teachers}
            onView={openDrawer}
            onAssign={openAssignModal}
            onChange={openChangeModal}
            onRemove={openRemoveModal}
          />
        </div>
      </Card>

      <AssignTeacherModal
        open={assignModalOpen}
        classRecord={selectedClass}
        teachers={teachers}
        courses={courses}
        allClasses={allClasses}
        teachingLoadMap={teachingLoadMap}
        onAssign={handleAssign}
        onCancel={() => setAssignModalOpen(false)}
      />

      <ChangeTeacherModal
        open={changeModalOpen}
        classRecord={selectedClass}
        teachers={teachers}
        courses={courses}
        allClasses={allClasses}
        teachingLoadMap={teachingLoadMap}
        onChange={handleChange}
        onCancel={() => setChangeModalOpen(false)}
      />

      <DeleteAssignmentModal
        open={removeModalOpen}
        classRecord={selectedClass}
        teacher={selectedTeacher}
        onConfirm={handleRemove}
        onCancel={() => setRemoveModalOpen(false)}
        loading={actionLoading}
      />

      <TeacherAssignmentDrawer
        open={drawerOpen}
        classRecord={selectedClass}
        teacher={selectedTeacher}
        courses={courses}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default TeacherAssignmentPage;
