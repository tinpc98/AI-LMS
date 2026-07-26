import React from "react";
import { Row, Col } from "antd";
import AssignmentCard from "./AssignmentCard";
import type { IExtendedAssignment } from "../../../types/studentAssignment";

interface AssignmentListProps {
  assignments: IExtendedAssignment[];
  onDetail: (item: IExtendedAssignment) => void;
  onSubmit: (item: IExtendedAssignment) => void;
  onFeedback: (item: IExtendedAssignment) => void;
  onCancelSubmission: (assignmentId: string) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = React.memo(
  ({ assignments, onDetail, onSubmit, onFeedback, onCancelSubmission }) => {
    return (
      <Row gutter={[16, 16]}>
        {assignments.map((item) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={item._id}>
            <AssignmentCard
              item={item}
              onDetail={onDetail}
              onSubmit={onSubmit}
              onFeedback={onFeedback}
              onCancelSubmission={onCancelSubmission}
            />
          </Col>
        ))}
      </Row>
    );
  }
);

AssignmentList.displayName = "AssignmentList";

export default AssignmentList;
