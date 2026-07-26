import React from "react";
import { Row, Col, Card, Statistic, Typography } from "antd";
import {
  UserOutlined,
  BookOutlined,
  SolutionOutlined,
  TeamOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import type { DateRangeState } from "../../../utils/reportTransformer";
import { transformOverviewReport } from "../../../utils/reportTransformer";

const { Title, Text } = Typography;

interface ReportOverviewProps {
  filter: DateRangeState;
}

export const ReportOverview: React.FC<ReportOverviewProps> = ({ filter }) => {
  const { kpis, studentGrowth, courseEnrollments, classPerformance } = transformOverviewReport(filter);

  const kpiList = [
    {
      title: "Total Students",
      value: kpis.totalStudents,
      suffix: "học sinh",
      icon: <UserOutlined />,
      color: "#1677ff",
      bgColor: "#e6f4ff",
    },
    {
      title: "Total Courses",
      value: kpis.totalCourses,
      suffix: "khóa học",
      icon: <BookOutlined />,
      color: "#13c2c2",
      bgColor: "#e6fffb",
    },
    {
      title: "Total Classes",
      value: kpis.totalClasses,
      suffix: "lớp học",
      icon: <SolutionOutlined />,
      color: "#fa8c16",
      bgColor: "#fff7e6",
    },
    {
      title: "Total Teachers",
      value: kpis.totalTeachers,
      suffix: "giáo viên",
      icon: <TeamOutlined />,
      color: "#722ed1",
      bgColor: "#f9f0ff",
    },
    {
      title: "Average Score",
      value: kpis.averageScore,
      suffix: "/ 10 điểm",
      precision: 2,
      icon: <TrophyOutlined />,
      color: "#eb2f96",
      bgColor: "#fff0f6",
    },
    {
      title: "Attendance Rate",
      value: kpis.attendanceRate,
      suffix: "%",
      precision: 1,
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
      bgColor: "#f6ffed",
    },
  ];

  return (
    <div>
      {/* 6 KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        {kpiList.map((item, index) => (
          <Col xs={24} sm={12} md={8} lg={4} key={index}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card
                variant="borderless"
                style={{
                  borderRadius: "14px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #f0f0f0",
                }}
                styles={{ body: { padding: "18px" } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                    {item.title}
                  </Text>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      backgroundColor: item.bgColor,
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
                <Statistic
                  value={item.value}
                  precision={item.precision || 0}
                  suffix={<span style={{ fontSize: "12px", color: "#8c8c8c", marginLeft: 4 }}>{item.suffix}</span>}
                  styles={{
                    content: {
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#1f1f1f",
                    },
                  }}
                />
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Student Growth Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f0f0f0",
            }}
            styles={{ body: { padding: "24px" } }}
          >
            <div style={{ marginBottom: "20px" }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Student Growth Chart 📈
              </Title>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                Tốc độ tăng trưởng số lượng học sinh thực tế so với mục tiêu đề ra
              </Text>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#e0e0e0" }} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} align="right" />
                  <Line name="Học sinh thực tế" type="monotone" dataKey="students" stroke="#1677ff" strokeWidth={3} dot={{ r: 4 }} />
                  <Line name="Mục tiêu (Target)" type="monotone" dataKey="target" stroke="#fa8c16" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Course Enrollment Chart */}
        <Col xs={24} lg={8}>
          <Card
            variant="borderless"
            style={{
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "24px" } }}
          >
            <div style={{ marginBottom: "20px" }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Course Enrollment 📚
              </Title>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                Số học sinh đăng ký từng khóa học
              </Text>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseEnrollments} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="courseName" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="enrollments" name="Học sinh" radius={[0, 6, 6, 0]}>
                    {courseEnrollments.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#1677ff" : "#722ed1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Class Performance Chart */}
      <Card
        variant="borderless"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ marginBottom: "20px" }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Class Performance Chart 🎯
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Điểm số trung bình kết quả kiểm tra theo từng lớp học
          </Text>
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="className" tickLine={false} axisLine={{ stroke: "#e0e0e0" }} />
              <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
              <Tooltip formatter={(val: any) => [`${val} điểm`, "Điểm trung bình"]} />
              <Bar dataKey="averageScore" name="Điểm TB" fill="#52c41a" radius={[8, 8, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
