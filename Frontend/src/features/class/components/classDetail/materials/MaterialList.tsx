import React from "react";
import { Row, Col } from "antd";
import MaterialCard from "./MaterialCard";
import type { ILearningMaterial } from "../../../../../types/learningMaterial";

interface MaterialListProps {
  materials: ILearningMaterial[];
  classId?: string;
  onPreview?: (item: ILearningMaterial) => void;
  onDownload: (item: ILearningMaterial) => void;
  onCopyLink: (url: string) => void;
  onDetail: (item: ILearningMaterial) => void;
}

export const MaterialList: React.FC<MaterialListProps> = React.memo(
  ({ materials, classId, onPreview, onDownload, onCopyLink, onDetail }) => {
    return (
      <Row gutter={[16, 16]}>
        {materials.map((item) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={item._id}>
            <MaterialCard
              item={item}
              classId={classId}
              onPreview={onPreview}
              onDownload={onDownload}
              onCopyLink={onCopyLink}
              onDetail={onDetail}
            />
          </Col>
        ))}
      </Row>
    );
  }
);

MaterialList.displayName = "MaterialList";

export default MaterialList;
