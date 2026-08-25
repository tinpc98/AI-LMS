import React, { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Typography,
  Space,
  Card,
  Row,
  Col,
  Empty,
  Skeleton,
  Drawer,
  Modal,
  Input,
  Upload,
  Switch,
  List,
  Radio,
  Divider,
  Select,
  Badge,
  message,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  EditOutlined,
  VideoCameraOutlined,
  FolderOpenOutlined,
  FormOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PlayCircleFilled,
  UploadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { lessonApi } from "../../../api/lessonApi";
import type { ILesson, ICreateLessonPayload } from "../../../interface/lessonInterface";
import { sortLessons, cleanLessonTitle } from "../utils/lessonHelper";
import * as XLSX from "xlsx";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Bước 1: Khai báo Data Structure
interface IQuestion {
  id: string | number;
  content: string;
  options: string[];
  correctAnswer: string | number;
  type: 'multiple_choice' | 'essay';
}

export const LectureDetailTeacherPage: React.FC = () => {
  const { classId = "", lectureId = "", lessonId = "" } = useParams<{
    classId?: string;
    lectureId?: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const baseClassPath = `/teacher/classroom-detail/${classId}`;
  const getLecturePath = (targetLessonId: string) =>
    `/teacher/classroom-detail/${classId}/lecture/${targetLessonId}`;

  const activeLessonId = lectureId || lessonId;

  // UI States for Modals & Drawers
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditGeneralModalOpen, setIsEditGeneralModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isSolutionVideoModalOpen, setIsSolutionVideoModalOpen] = useState(false);
  const [isQuizBuilderModalOpen, setIsQuizBuilderModalOpen] = useState(false);
  const [isAddManualModalOpen, setIsAddManualModalOpen] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  
  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingFileId, setIsDeletingFileId] = useState<string | null>(null);

  // Bước 1: Khởi tạo state
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [allowImageSubmit, setAllowImageSubmit] = useState(false);

  // Form State cho "Thêm/Sửa thủ công"
  const [editingQuestionId, setEditingQuestionId] = useState<string | number | null>(null);
  const [newQuestionType, setNewQuestionType] = useState<'multiple_choice' | 'essay'>('multiple_choice');
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuestionCorrectAnswer, setNewQuestionCorrectAnswer] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Lessons
  const { data: lessonsData, isLoading: isLoadingLessons, isError: isLessonsError } = useQuery({
    queryKey: ["lessons", classId],
    queryFn: async () => {
      if (!classId) return [];
      const res = await lessonApi.getLessonsByClass(classId);
      return (res.data?.lessons || []) as ILesson[];
    },
    enabled: !!classId,
  });

  const sortedLessons = useMemo(() => sortLessons(lessonsData || []), [lessonsData]);

  const currentIndex = useMemo(() => {
    if (!activeLessonId) return -1;
    return sortedLessons.findIndex((l) => String(l._id) === String(activeLessonId));
  }, [sortedLessons, activeLessonId]);

  const currentLesson = useMemo(() => {
    if (currentIndex >= 0) return sortedLessons[currentIndex];
    return sortedLessons[0] || null;
  }, [sortedLessons, currentIndex]);

  const handleSelectLesson = (targetLessonId: string) => {
    navigate(getLecturePath(targetLessonId));
    setDrawerVisible(false);
  };

  const handleRouteToQuizBuilder = () => {
    if (currentLesson && (currentLesson as any).quiz) {
      const quizData = (currentLesson as any).quiz;
      setQuestions(quizData.questions || []);
      setAllowImageSubmit(quizData.allowImageSubmit || false);
    } else {
      setQuestions([]);
      setAllowImageSubmit(false);
    }
    setIsQuizBuilderModalOpen(true);
  };

  const handleOpenAddManual = () => {
    setEditingQuestionId(null);
    setNewQuestionType('multiple_choice');
    setNewQuestionContent("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewQuestionCorrectAnswer(0);
    setIsAddManualModalOpen(true);
  };

  const handleEditQuestion = (q: IQuestion) => {
    setEditingQuestionId(q.id);
    setNewQuestionType(q.type);
    setNewQuestionContent(q.content);
    if (q.type === 'multiple_choice') {
      setNewQuestionOptions([...q.options]);
      setNewQuestionCorrectAnswer(q.correctAnswer as number);
    } else {
      setNewQuestionOptions(["", "", "", ""]);
      setNewQuestionCorrectAnswer(0);
    }
    setIsAddManualModalOpen(true);
  };

  // Bước 2: Lưu câu hỏi thủ công (Add & Edit)
  const handleSaveQuestion = () => {
    if (!newQuestionContent.trim()) {
      message.error("Vui lòng nhập nội dung câu hỏi!");
      return;
    }
    if (newQuestionType === 'multiple_choice' && newQuestionOptions.some(opt => !opt.trim())) {
      message.error("Vui lòng nhập đầy đủ 4 đáp án!");
      return;
    }

    const newQ: IQuestion = {
      id: editingQuestionId ? editingQuestionId : Date.now().toString(),
      type: newQuestionType,
      content: newQuestionContent,
      options: newQuestionType === 'multiple_choice' ? [...newQuestionOptions] : [],
      correctAnswer: newQuestionType === 'multiple_choice' ? newQuestionCorrectAnswer : "",
    };

    if (editingQuestionId) {
      setQuestions(questions.map(q => q.id === editingQuestionId ? newQ : q));
      message.success("Cập nhật câu hỏi thành công!");
    } else {
      setQuestions([...questions, newQ]);
      message.success("Thêm câu hỏi thành công!");
    }
    
    setIsAddManualModalOpen(false);
  };

  // Bước 3: Hàm xóa câu hỏi
  const handleDeleteQuestion = (id: string | number) => {
    setQuestions(questions.filter(q => q.id !== id));
    message.success("Đã xóa câu hỏi");
  };

  // Bước 4: Lưu tổng (API thật)
  const handleSaveQuiz = async () => {
    setIsSavingQuiz(true);
    try {
      if (!currentLesson?._id) return;
      
      await lessonApi.updateLessonQuiz(currentLesson._id, { 
        allowImageSubmit, 
        questions 
      });
      
      message.success("Đã lưu Bộ câu hỏi thành công!");
      setIsQuizBuilderModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["lessons", classId] });
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu bộ câu hỏi.");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // Upload File Logic
  const handleUploadFile = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!currentLesson?._id) return;
    
    setIsUploading(true);
    try {
      const payload: Partial<ICreateLessonPayload> = {
        classId: classId,
        files: [file as File]
      };
      
      await lessonApi.updateLesson(currentLesson._id, payload);
      message.success("Tải lên tài liệu thành công!");
      onSuccess?.("ok");
      queryClient.invalidateQueries({ queryKey: ["lessons", classId] });
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải lên tài liệu.");
      onError?.(error as any);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (publicId: string) => {
    if (!currentLesson?._id) return;
    
    setIsDeletingFileId(publicId);
    try {
      await lessonApi.deleteLessonAttachment(currentLesson._id, publicId);
      message.success("Xóa tài liệu thành công!");
      queryClient.invalidateQueries({ queryKey: ["lessons", classId] });
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xóa tài liệu.");
    } finally {
      setIsDeletingFileId(null);
    }
  };

  // Bước 2: Hàm tải File Excel Mẫu
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Loại câu hỏi (TRAC_NGHIEM/TU_LUAN)": "TRAC_NGHIEM",
        "Nội dung câu hỏi": "Nguyên hàm của hàm số f(x) = x^2 là gì?",
        "Đáp án A": "x^3/3 + C",
        "Đáp án B": "2x + C",
        "Đáp án C": "x^3 + C",
        "Đáp án D": "x^2/2 + C",
        "Đáp án đúng (A/B/C/D)": "A"
      },
      {
        "Loại câu hỏi (TRAC_NGHIEM/TU_LUAN)": "TU_LUAN",
        "Nội dung câu hỏi": "Hãy trình bày cách giải phương trình bậc 2.",
        "Đáp án A": "",
        "Đáp án B": "",
        "Đáp án C": "",
        "Đáp án D": "",
        "Đáp án đúng (A/B/C/D)": ""
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Mau_Nhap_Cau_Hoi.xlsx");
  };

  // Bước 3: Hàm đọc File Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        let importedCount = 0;
        const newQuestions: IQuestion[] = [];

        data.forEach((row, index) => {
          const typeRaw = row["Loại câu hỏi (TRAC_NGHIEM/TU_LUAN)"]?.toString().trim();
          const content = row["Nội dung câu hỏi"]?.toString().trim();
          
          if (!content) return; // Bỏ qua dòng trống
          
          const type: 'multiple_choice' | 'essay' = typeRaw === "TU_LUAN" ? "essay" : "multiple_choice";
          
          let options: string[] = [];
          let correctIdx = 0;

          if (type === "multiple_choice") {
            options = [
              row["Đáp án A"]?.toString() || "",
              row["Đáp án B"]?.toString() || "",
              row["Đáp án C"]?.toString() || "",
              row["Đáp án D"]?.toString() || ""
            ];
            const ansLetter = row["Đáp án đúng (A/B/C/D)"]?.toString().toUpperCase().trim();
            if (ansLetter === 'A') correctIdx = 0;
            else if (ansLetter === 'B') correctIdx = 1;
            else if (ansLetter === 'C') correctIdx = 2;
            else if (ansLetter === 'D') correctIdx = 3;
          }

          newQuestions.push({
            id: `excel_${Date.now()}_${index}`,
            type,
            content,
            options,
            correctAnswer: correctIdx
          });
          importedCount++;
        });

        if (importedCount > 0) {
          setQuestions(prev => [...prev, ...newQuestions]);
          message.success(`Đã nhập thành công ${importedCount} câu hỏi!`);
        } else {
          message.warning("Không tìm thấy câu hỏi hợp lệ nào trong file.");
        }
      } catch (error) {
        console.error(error);
        message.error("Đã xảy ra lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.");
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  if (isLoadingLessons) {
    return (
      <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8">
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  if (isLessonsError || sortedLessons.length === 0 || !currentLesson) {
    return (
      <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8 text-center mt-12">
        <Empty description={<Text type="secondary">Không tìm thấy bài giảng yêu cầu.</Text>}>
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate(baseClassPath)}>
            Quay lại lớp học
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header Bar */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Space size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(baseClassPath)} type="text">
            Quay lại
          </Button>
          <Button icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)}>
            Danh sách bài giảng
          </Button>
        </Space>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                BÀI {currentIndex + 1}
              </Text>
              <Title level={2} style={{ margin: "4px 0 0", color: '#1e293b' }}>
                {cleanLessonTitle(currentLesson.title)}
              </Title>
              <Paragraph style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>
                {currentLesson.description || "Chưa có mô tả cho bài giảng này."}
              </Paragraph>
            </div>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setIsEditGeneralModalOpen(true)}
              style={{ borderRadius: 6 }}
            >
              Chỉnh sửa thông tin chung
            </Button>
          </div>
        </Card>

        <Title level={4} style={{ margin: "16px 0 0", color: '#334155' }}>Quản lý Nội dung</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => setIsVideoModalOpen(true)}
              style={{ borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '2px solid transparent' }}
              styles={{ body: { padding: '32px 24px' } }}
              className="hover:border-blue-400 transition-colors"
            >
              <VideoCameraOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Quản lý Video</Title>
              <Text type="secondary">Xem trước và Cập nhật Link YouTube</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => setIsDocumentModalOpen(true)}
              style={{ borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '2px solid transparent' }}
              styles={{ body: { padding: '32px 24px' } }}
              className="hover:border-red-400 transition-colors"
            >
              <FolderOpenOutlined style={{ fontSize: 48, color: '#f5222d', marginBottom: 16 }} />
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Quản lý Tài liệu</Title>
              <Text type="secondary">Xóa file cũ, Upload file mới (PDF, DOCX)</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={handleRouteToQuizBuilder}
              style={{ borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '2px solid transparent' }}
              styles={{ body: { padding: '32px 24px' } }}
              className="hover:border-green-400 transition-colors"
            >
              <FormOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Quản lý Bộ câu hỏi</Title>
              <Text type="secondary">Thêm thủ công, Import Excel & Tự luận hình ảnh</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => setIsSolutionVideoModalOpen(true)}
              style={{ borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '2px solid transparent' }}
              styles={{ body: { padding: '32px 24px' } }}
              className="hover:border-orange-400 transition-colors"
            >
              <SettingOutlined style={{ fontSize: 48, color: '#fa8c16', marginBottom: 16 }} />
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Cập nhật Video Chữa bài</Title>
              <Text type="secondary">Không giới hạn xem (Không lock)</Text>
            </Card>
          </Col>
        </Row>
      </div>

      <Drawer
        title={<Text strong style={{ fontSize: 16 }}>Danh sách bài giảng</Text>}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={360}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sortedLessons.map((item, idx) => {
            const isActive = currentLesson ? String(item._id) === String(currentLesson._id) : false;
            return (
              <div
                key={item._id}
                onClick={() => handleSelectLesson(item._id)}
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  backgroundColor: isActive ? "#e6f4ff" : "transparent",
                  borderLeft: isActive ? "4px solid #1677ff" : "4px solid transparent",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {isActive ? <PlayCircleFilled style={{ color: "#1677ff", fontSize: 18 }} /> : <PlayCircleOutlined style={{ color: "#94a3b8", fontSize: 18 }} />}
                <Text strong={isActive} style={{ fontSize: 14, color: isActive ? "#1677ff" : "inherit" }}>
                  Bài {idx + 1}: {cleanLessonTitle(item.title)}
                </Text>
              </div>
            );
          })}
        </div>
      </Drawer>

      <Modal
        title="Chỉnh sửa thông tin chung"
        open={isEditGeneralModalOpen}
        onOk={() => setIsEditGeneralModalOpen(false)}
        onCancel={() => setIsEditGeneralModalOpen(false)}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Tên bài giảng</Text>
          <Input defaultValue={currentLesson?.title} />
          <Text strong style={{ marginTop: 12 }}>Mô tả ngắn</Text>
          <Input.TextArea defaultValue={currentLesson?.description} rows={4} />
        </Space>
      </Modal>

      <Modal
        title="Quản lý Video Bài giảng"
        open={isVideoModalOpen}
        onOk={() => setIsVideoModalOpen(false)}
        onCancel={() => setIsVideoModalOpen(false)}
        okText="Lưu Video"
        cancelText="Hủy"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Link YouTube</Text>
          <Input defaultValue={currentLesson?.videoUrl || ""} placeholder="https://youtube.com/watch?v=..." />
        </Space>
      </Modal>

      <Modal
        title="Quản lý Tài liệu đính kèm"
        open={isDocumentModalOpen}
        onOk={() => setIsDocumentModalOpen(false)}
        onCancel={() => setIsDocumentModalOpen(false)}
        okText="Hoàn tất"
        cancelText="Đóng"
      >
        <Upload customRequest={handleUploadFile} showUploadList={false}>
          <Button icon={<UploadOutlined />} loading={isUploading}>Tải lên file mới (PDF, DOCX)</Button>
        </Upload>
        <List
          style={{ marginTop: 16 }}
          bordered
          dataSource={currentLesson?.attachments || []}
          renderItem={(item) => (
            <List.Item 
              actions={[
                <Popconfirm
                  title="Xóa tài liệu"
                  description="Bạn có chắc chắn muốn xóa tài liệu này không?"
                  onConfirm={() => handleDeleteFile(item.publicId)}
                  okText="Xóa"
                  cancelText="Hủy"
                  placement="topLeft"
                  key="deletePop"
                >
                  <Button danger type="text" icon={<DeleteOutlined />} loading={isDeletingFileId === item.publicId} />
                </Popconfirm>
              ]}
            >
              {item.name}
            </List.Item>
          )}
        />
        {(!currentLesson?.attachments || currentLesson.attachments.length === 0) && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tài liệu nào" />
        )}
      </Modal>

      <Modal
        title="Cập nhật Video Chữa bài"
        open={isSolutionVideoModalOpen}
        onOk={() => setIsSolutionVideoModalOpen(false)}
        onCancel={() => setIsSolutionVideoModalOpen(false)}
        okText="Lưu Video Chữa Bài"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Link YouTube (Video Chữa bài)</Text>
          <Input placeholder="https://youtube.com/watch?v=..." />
          <Text type="secondary" style={{ fontSize: 12 }}>
            * Lưu ý: Video này sẽ không bị gắn cờ isLockedUntilSubmit. Học sinh có thể xem ngay lập tức.
          </Text>
        </Space>
      </Modal>

      {/* Quiz Builder Modal */}
      <Modal
        title="Quản lý Bộ câu hỏi (Quiz Builder)"
        open={isQuizBuilderModalOpen}
        onOk={handleSaveQuiz}
        onCancel={() => setIsQuizBuilderModalOpen(false)}
        okText="Lưu Bộ Câu Hỏi"
        cancelText="Hủy"
        width={800}
        style={{ top: 20 }}
        confirmLoading={isSavingQuiz}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card size="small" title="Cấu hình Nộp bài">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text strong>Cho phép nộp bài tự luận bằng hình ảnh</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>Học sinh có thể chụp ảnh bài giải giấy và tải lên.</Text>
              </div>
              <Switch checked={allowImageSubmit} onChange={setAllowImageSubmit} />
            </div>
          </Card>

          <Card size="small" title="Thêm Câu hỏi mới">
            <Row gutter={16}>
              <Col span={12}>
                <Button 
                  type="dashed" 
                  block 
                  icon={<PlusOutlined />} 
                  onClick={handleOpenAddManual}
                  style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                >
                  <span style={{ marginTop: 8 }}>Thêm thủ công</span>
                </Button>
              </Col>
              <Col span={12}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button 
                  type="dashed" 
                  block 
                  icon={<FileExcelOutlined />} 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                >
                  <span style={{ marginTop: 8 }}>Nhập từ Excel</span>
                </Button>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Button type="link" size="small" onClick={handleDownloadTemplate}>
                    Tải file Excel mẫu
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          <div>
            <Text strong>Danh sách câu hỏi hiện tại ({questions.length})</Text>
            {questions.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có câu hỏi nào trong bộ này." />
            ) : (
              <List
                style={{ marginTop: 12 }}
                itemLayout="horizontal"
                dataSource={questions}
                renderItem={(q, index) => (
                  <List.Item
                    actions={[
                      <Button type="text" icon={<EditOutlined />} onClick={() => handleEditQuestion(q)} key="edit" />,
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteQuestion(q.id)} key="delete" />
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Badge status={q.type === 'essay' ? 'warning' : 'processing'} text={q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'} />
                          <Text strong>Câu {index + 1}:</Text> {q.content}
                        </Space>
                      }
                      description={q.type === 'multiple_choice' ? `Đáp án: ${q.options.length} lựa chọn | Đúng: ${['A','B','C','D'][q.correctAnswer as number]}` : 'Yêu cầu viết tự luận'}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </Space>
      </Modal>

      {/* Modal: Thêm/Sửa thủ công */}
      <Modal
        title={editingQuestionId ? "Cập nhật Câu hỏi" : "Thêm Câu hỏi thủ công"}
        open={isAddManualModalOpen}
        onOk={handleSaveQuestion}
        onCancel={() => setIsAddManualModalOpen(false)}
        okText={editingQuestionId ? "Lưu thay đổi" : "Thêm câu hỏi"}
        cancelText="Hủy"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Loại câu hỏi</Text>
            <br />
            <Select 
              value={newQuestionType} 
              onChange={setNewQuestionType}
              style={{ width: '100%', marginTop: 8 }}
              options={[
                { value: 'multiple_choice', label: 'Trắc nghiệm' },
                { value: 'essay', label: 'Tự luận' },
              ]}
            />
          </div>

          <div>
            <Text strong>Nội dung câu hỏi</Text>
            <TextArea 
              rows={3} 
              value={newQuestionContent} 
              onChange={(e) => setNewQuestionContent(e.target.value)} 
              style={{ marginTop: 8 }}
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {newQuestionType === 'multiple_choice' && (
            <div>
              <Text strong>Các đáp án (Chọn đáp án đúng bằng nút Radio)</Text>
              <Radio.Group 
                onChange={(e) => setNewQuestionCorrectAnswer(e.target.value)} 
                value={newQuestionCorrectAnswer}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {newQuestionOptions.map((opt, index) => (
                    <Row key={index} align="middle" gutter={8}>
                      <Col>
                        <Radio value={index}>
                          <Text strong>{String.fromCharCode(65 + index)}.</Text>
                        </Radio>
                      </Col>
                      <Col flex="auto">
                        <Input 
                          value={opt} 
                          onChange={(e) => {
                            const newOpts = [...newQuestionOptions];
                            newOpts[index] = e.target.value;
                            setNewQuestionOptions(newOpts);
                          }}
                          placeholder={`Nhập đáp án ${String.fromCharCode(65 + index)}...`}
                        />
                      </Col>
                    </Row>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default LectureDetailTeacherPage;
