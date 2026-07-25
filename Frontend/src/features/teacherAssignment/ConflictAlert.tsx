import { Alert } from "antd";
import type { ConflictCheckResult } from "./teacherAssignment.types";
import { formatScheduleDays, formatScheduleTime } from "./teacherAssignmentUtils";

interface ConflictAlertProps {
  conflict: ConflictCheckResult;
}

const ConflictAlert = ({ conflict }: ConflictAlertProps) => {
  if (!conflict.hasConflict) return null;

  const confClass = conflict.conflictingClass;
  const daysText = confClass ? formatScheduleDays(confClass.schedule.days) : "";
  const timeText = confClass ? formatScheduleTime(confClass.schedule.startTime, confClass.schedule.endTime) : "";

  const detailText = confClass
    ? `Conflict detected with class "${confClass.className}" (${confClass.classCode}) on ${daysText} (${timeText}).`
    : conflict.message || "Teacher already has another class at this time.";

  return (
    <Alert
      style={{ marginTop: 12, marginBottom: 12 }}
      type="error"
      showIcon
      message="Teacher already has another class at this time."
      description={detailText}
    />
  );
};

export default ConflictAlert;
