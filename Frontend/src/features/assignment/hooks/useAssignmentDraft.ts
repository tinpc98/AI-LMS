import { useState, useEffect, useRef, useCallback } from "react";
import assignmentApi from "../../../api/assignmentApi";
import type { ISubmission, ISubmissionAnswer } from "../../../interface/assignmentInterface";

interface DraftData {
  submissionType: "file" | "link" | "direct";
  content: string;
  linkUrl: string;
  answers: ISubmissionAnswer[];
  updatedAt: number;
}

interface UseAssignmentDraftProps {
  assignmentId: string;
  userId?: string;
  initialSubmission?: ISubmission | null;
  enabled?: boolean;
}

export const useAssignmentDraft = ({
  assignmentId,
  userId = "guest",
  initialSubmission,
  enabled = true,
}: UseAssignmentDraftProps) => {
  const storageKey = `assignment_draft_${userId}_${assignmentId}`;

  const [draftState, setDraftState] = useState<{
    submissionType: "file" | "link" | "direct";
    content: string;
    linkUrl: string;
    answers: ISubmissionAnswer[];
  }>(() => {
    // 1. Khởi tạo từ initial submission nếu là status draft
    if (initialSubmission && initialSubmission.status === "draft") {
      return {
        submissionType: initialSubmission.submissionType || "file",
        content: initialSubmission.content || "",
        linkUrl: initialSubmission.linkUrl || "",
        answers: initialSubmission.answers || [],
      };
    }
    return {
      submissionType: "file",
      content: "",
      linkUrl: "",
      answers: [],
    };
  });

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasRestoredLocal, setHasRestoredLocal] = useState<boolean>(false);

  const draftStateRef = useRef(draftState);
  draftStateRef.current = draftState;

  // Khôi phục từ localStorage nếu mới hơn dữ liệu server
  useEffect(() => {
    if (!enabled || !assignmentId) return;

    try {
      // Nếu bài nộp đã chấm, xóa draft local và bỏ qua việc load
      if (initialSubmission && initialSubmission.status === "graded") {
        localStorage.removeItem(storageKey);
        return;
      }

      const localDataStr = localStorage.getItem(storageKey);
      if (localDataStr) {
        const localData: DraftData = JSON.parse(localDataStr);
        const serverUpdatedAt = initialSubmission?.updatedAt
          ? new Date(initialSubmission.updatedAt).getTime()
          : 0;

        // Nếu bản nháp local mới hơn hoặc server chưa có bản nháp
        if (localData && localData.updatedAt > serverUpdatedAt) {
          setDraftState({
            submissionType: localData.submissionType || "file",
            content: localData.content || "",
            linkUrl: localData.linkUrl || "",
            answers: localData.answers || [],
          });
          setHasRestoredLocal(true);
          setLastSavedAt(new Date(localData.updatedAt));
        }
      }
    } catch {
      // Ignored
    }
  }, [assignmentId, storageKey, enabled, initialSubmission]);

  // Lưu tức thì vào localStorage (debounce 500ms)
  useEffect(() => {
    if (!enabled || !assignmentId) return;

    const timer = setTimeout(() => {
      try {
        const dataToStore: DraftData = {
          ...draftStateRef.current,
          updatedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      } catch {
        // Ignored
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [draftState, storageKey, enabled, assignmentId]);

  // Lưu lên server định kỳ (Auto-save throttle 30s)
  const saveToServer = useCallback(async () => {
    if (!enabled || !assignmentId) return;
    const currentState = draftStateRef.current;

    // Không gửi nếu không có nội dung gì
    const hasContent =
      currentState.content.trim() ||
      currentState.linkUrl.trim() ||
      currentState.answers.some((a) => a.content && a.content.trim());

    if (!hasContent) return;

    try {
      setSaveStatus("saving");
      await assignmentApi.saveDraft(assignmentId, {
        submissionType: currentState.submissionType,
        content: currentState.content,
        linkUrl: currentState.linkUrl,
        answers: currentState.answers,
      });
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    } catch {
      setSaveStatus("error");
    }
  }, [assignmentId, enabled]);

  useEffect(() => {
    if (!enabled || !assignmentId) return;

    const interval = setInterval(() => {
      saveToServer();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [saveToServer, enabled, assignmentId]);

  const updateField = useCallback(
    <K extends keyof typeof draftState>(field: K, value: (typeof draftState)[K]) => {
      setDraftState((prev) => ({
        ...prev,
        [field]: value,
      }));
      setSaveStatus("idle");
    },
    []
  );

  const updateAnswer = useCallback((questionId: string, content: string) => {
    setDraftState((prev) => {
      const existingIdx = prev.answers.findIndex((a) => a.questionId === questionId);
      let newAnswers = [...prev.answers];
      if (existingIdx >= 0) {
        newAnswers[existingIdx] = { questionId, content };
      } else {
        newAnswers.push({ questionId, content });
      }
      return {
        ...prev,
        answers: newAnswers,
      };
    });
    setSaveStatus("idle");
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignored
    }
  }, [storageKey]);

  return {
    draftState,
    setDraftState,
    updateField,
    updateAnswer,
    saveStatus,
    lastSavedAt,
    hasRestoredLocal,
    saveToServer,
    clearDraft,
  };
};

export default useAssignmentDraft;
