import React from "react";
import { Switch, TimePicker, Row, Col, Typography, Space } from "antd";
import dayjs from "dayjs";
import type {
  AvailabilitySchedule,
  DayOfWeek,
  DayAvailability,
} from "../../../interface/userInterface";

const { Text } = Typography;

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "Monday", label: "Thứ 2" },
  { key: "Tuesday", label: "Thứ 3" },
  { key: "Wednesday", label: "Thứ 4" },
  { key: "Thursday", label: "Thứ 5" },
  { key: "Friday", label: "Thứ 6" },
  { key: "Saturday", label: "Thứ 7" },
  { key: "Sunday", label: "Chủ nhật" },
];

const DEFAULT_DAY: DayAvailability = { startTime: "08:00", endTime: "17:00", available: false };

interface AvailabilityScheduleEditorProps {
  value?: AvailabilitySchedule | null;
  onChange?: (value: AvailabilitySchedule) => void;
}

// Lịch rảnh hàng tuần của giáo viên — khớp field User.availabilitySchedule ở backend
// (Backend/src/modules/auth/user.model.js). Đây là dữ liệu dùng để xếp/gán giáo viên vào
// lớp phù hợp thời gian (xem AssignTeacherModal), nên cần một nơi giáo viên tự cập nhật.
export const AvailabilityScheduleEditor: React.FC<AvailabilityScheduleEditorProps> = ({
  value,
  onChange,
}) => {
  const schedule = value || {};

  const updateDay = (day: DayOfWeek, patch: Partial<DayAvailability>) => {
    const current = schedule[day] || DEFAULT_DAY;
    onChange?.({ ...schedule, [day]: { ...current, ...patch } });
  };

  return (
    <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
      {DAYS.map(({ key, label }) => {
        const day = schedule[key] || DEFAULT_DAY;
        return (
          <Row key={key} align="middle" gutter={12} className="px-3 py-2">
            <Col xs={7} sm={5}>
              <Switch
                size="small"
                checked={day.available}
                onChange={(checked) => updateDay(key, { available: checked })}
              />
              <Text className="ml-2 text-sm">{label}</Text>
            </Col>
            <Col xs={17} sm={19}>
              <Space.Compact>
                <TimePicker
                  size="small"
                  format="HH:mm"
                  disabled={!day.available}
                  value={day.available ? dayjs(day.startTime, "HH:mm") : undefined}
                  onChange={(time) =>
                    updateDay(key, { startTime: time ? time.format("HH:mm") : "08:00" })
                  }
                  placeholder="Bắt đầu"
                  allowClear={false}
                />
                <TimePicker
                  size="small"
                  format="HH:mm"
                  disabled={!day.available}
                  value={day.available ? dayjs(day.endTime, "HH:mm") : undefined}
                  onChange={(time) =>
                    updateDay(key, { endTime: time ? time.format("HH:mm") : "17:00" })
                  }
                  placeholder="Kết thúc"
                  allowClear={false}
                />
              </Space.Compact>
            </Col>
          </Row>
        );
      })}
    </div>
  );
};

export default AvailabilityScheduleEditor;
