import React from "react";
import { Row, Col } from "antd";
import ExamCard from "./ExamCard";
import type { IExtendedExam } from "../../../types/studentExam";

interface ExamListProps {
  exams: IExtendedExam[];
  onDetail: (item: IExtendedExam) => void;
  onStart: (item: IExtendedExam) => void;
  onReview: (item: IExtendedExam) => void;
}

export const ExamList: React.FC<ExamListProps> = React.memo(
  ({ exams, onDetail, onStart, onReview }) => {
    return (
      <Row gutter={[16, 16]}>
        {exams.map((item) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={item._id}>
            <ExamCard
              item={item}
              onDetail={onDetail}
              onStart={onStart}
              onReview={onReview}
            />
          </Col>
        ))}
      </Row>
    );
  }
);

ExamList.displayName = "ExamList";

export default ExamList;
