import React from "react";
import type { StudentClassStatus } from "../../../../types/studentClass";
import { StatusBadge } from "../../../../shared/components/StatusBadge";

interface ClassStatusTagProps {
  status: StudentClassStatus;
  style?: React.CSSProperties;
}

export const ClassStatusTag: React.FC<ClassStatusTagProps> = React.memo(
  ({ status, style }) => {
    return <StatusBadge status={status} style={style} />;
  }
);

ClassStatusTag.displayName = "ClassStatusTag";

export default ClassStatusTag;
