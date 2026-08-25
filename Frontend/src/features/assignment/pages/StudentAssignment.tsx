import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Alert, Button, Typography, Space, Divider } from "antd";
import { toast } from "../../../utils/toast";
import assignmentApi from "../../../api/assignmentApi";
import type { IAssignment, IAssignmentAttempt } from "../../../interface/assignmentInterface";
import { AssignmentQuestionRenderer } from "../components/AssignmentQuestionRenderer";
import { AttemptDetailView } from "../components/AttemptDetailView";

const { Title, Text, Paragraph } = Typography;

const StudentAssignmentContent = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<IAssignment | null>(null);
  const [attempt, setAttempt] = useState<IAssignmentAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      // Assuming getAssignment exists or we can just try to fetch the attempt directly if we only want that
      // But we probably need to fetch the assignment to see if we can start an attempt.
      // assignmentApi.ts has getStudentAssignments but not getAssignmentById? 
      // Let's assume we can fetch getAttempts and assignment info.
      // Wait, in Phase 2F, the student gets attempts via getAttempts(assignmentId)
      const res = await assignmentApi.getAttemptHistory(assignmentId);
      if (res && res.length > 0) {
        setAttempt(res[0]);
      }
      
      const classId = localStorage.getItem("currentClassId"); 
      if (classId) {
        const assignmentsRes = await assignmentApi.getAssignmentsByClass(classId);
        const currentAssign = assignmentsRes.find((a: any) => a._id === assignmentId);
        if (currentAssign) {
          setAssignment(currentAssign);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const startAttempt = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const res = await assignmentApi.startAttempt(assignmentId);
      setAttempt(res);
      toast.success("Bắt đầu làm bài!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể bắt đầu làm bài");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (questionId: string, answer: { selectedOptionIds?: string[]; content?: string }) => {
    if (!attempt) return;
    
    const formattedAnswer: any = {};
    if (answer.selectedOptionIds) formattedAnswer.selectedOptionIds = answer.selectedOptionIds;
    if (answer.content) formattedAnswer.content = [{ id: "ans", type: "TEXT", text: answer.content, order: 0 }];

    // Optimistic update
    setAttempt(prev => {
      if (!prev) return prev;
      const updatedQuestions = prev.questions.map(q => {
        if (q.questionId === questionId) {
          return { ...q, answer: { ...q.answer, ...formattedAnswer } };
        }
        return q;
      });
      return { ...prev, questions: updatedQuestions };
    });

    try {
      await assignmentApi.saveAnswer(attempt._id, questionId, formattedAnswer);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi lưu câu trả lời");
    }
  };

  const submitAttempt = async () => {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      const res = await assignmentApi.submitAttempt(attempt._id);
      setAttempt(res);
      toast.success("Nộp bài thành công!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi nộp bài");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !attempt) {
    return (
      <main className="ml-[280px] pt-16 h-screen flex items-center justify-center bg-surface">
        <Spin size="large" tip="Đang tải..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="ml-[280px] pt-16 h-screen p-10 bg-surface flex items-center justify-center">
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          action={<Button type="primary" onClick={fetchData}>Thử lại</Button>}
        />
      </main>
    );
  }

  return (
    <main className="ml-[280px] pt-16 min-h-screen bg-gray-50 flex">
      <div className="flex-1 max-w-4xl mx-auto p-8">
        <Button onClick={() => navigate(-1)} className="mb-4">← Quay lại</Button>
        
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <Title level={3}>{assignment?.title || "Bài tập"}</Title>
          <Paragraph type="secondary">{assignment?.description}</Paragraph>

          {!attempt && (
            <div className="text-center py-10">
              <Button type="primary" size="large" onClick={startAttempt}>
                Bắt đầu làm bài
              </Button>
            </div>
          )}

          {attempt && attempt.status === "IN_PROGRESS" && (
            <div>
              <Divider />
              <div className="flex justify-between items-center mb-6">
                <Title level={4}>Bài làm của bạn</Title>
              </div>

              {attempt.questions.map((q, idx) => (
                <AssignmentQuestionRenderer
                  key={q.questionId}
                  index={idx}
                  question={q}
                  onAnswerChange={handleAnswerChange}
                />
              ))}

              <div className="text-center mt-8">
                <Button type="primary" size="large" onClick={submitAttempt} loading={isSubmitting}>
                  Nộp bài
                </Button>
              </div>
            </div>
          )}

          {attempt && attempt.status !== "IN_PROGRESS" && (
            <div className="mt-6">
              <Title level={4}>Kết quả bài làm</Title>
              <AttemptDetailView attempt={attempt} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default StudentAssignmentContent;
