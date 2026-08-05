import React, { useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  FileImageOutlined,
  LinkOutlined,
  FileUnknownOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EyeOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {
  Spin as AntSpin,
  Button as AntButton,
  Tag as AntTag,
  Input as AntInput,
  Empty as AntEmpty,
  Popconfirm,
} from "antd";

import { classApi } from "../../../api/classApi";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { YouTubeLessonPlayer } from "../components/YouTubeLessonPlayer";
import { PDFViewer } from "../components/PDFViewer";
import { DocxViewer } from "../components/DocxViewer";
import { GenericMaterialViewer } from "../components/GenericMaterialViewer";
import { classifyResource, triggerFileDownload } from "../utils/resourceUtils";
import type { ILearningMaterial } from "../../../types/learningMaterial";

export const ResourceViewPage: React.FC = () => {
  const { classId = "", resourceId = "" } = useParams<{
    classId?: string;
    resourceId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận diện portal (Teacher hay Student)
  const isTeacherPortal = location.pathname.startsWith("/teacher");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isStudentPreviewMode, setIsStudentPreviewMode] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Đường dẫn động theo vai trò
  const baseClassPath = isTeacherPortal
    ? `/teacher/classroom-detail/${classId}`
    : `/student/classdetail/${classId}`;

  const getResourcePath = (resId: string) =>
    isTeacherPortal
      ? `/teacher/classroom-detail/${classId}/resource/${resId}`
      : `/student/classdetail/${classId}/resource/${resId}`;

  // 1. Fetch thông tin lớp học và danh sách tài nguyên
  const { data: classData, isLoading, isError } = useQuery({
    queryKey: ["classDetail", classId],
    queryFn: async () => {
      if (!classId) return null;
      const res = await classApi.getClassById(classId);
      const rawData = (res as { data?: { data?: any } })?.data?.data ?? (res as { data?: any })?.data ?? null;
      return rawData;
    },
    enabled: !!classId,
  });

  const resources: ILearningMaterial[] = useMemo(() => {
    return (classData?.resources || []) as ILearningMaterial[];
  }, [classData]);

  // 2. Tìm tài nguyên hiện tại
  const currentResource = useMemo(() => {
    if (!resourceId || resources.length === 0) return null;
    const found = resources.find((r) => String(r._id) === String(resourceId)) || null;
    if (!found && classData) {
      console.error(
        `[ResourceViewPage] Không tìm thấy resourceId: "${resourceId}" trong lớp "${classId}". ` +
          `Danh sách resource IDs hiện có:`,
        resources.map((r) => String(r._id))
      );
    }
    return found;
  }, [resources, resourceId, classData, classId]);

  // 3. Lấy URL đã ký cho file upload (có publicId). Với link ngoài, bỏ qua.
  const hasPublicId = Boolean((currentResource as any)?.publicId);
  const [accessUrlKey, setAccessUrlKey] = useState(0); // tăng để trigger refetch

  const {
    data: accessData,
    isLoading: isLoadingAccess,
    isError: isAccessError,
    error: accessError,
  } = useQuery({
    queryKey: ["resourceAccess", classId, resourceId, accessUrlKey],
    queryFn: async () => {
      const res = await classApi.getResourceAccessUrl(classId, resourceId);
      return (res as { data?: any })?.data?.data ?? null;
    },
    enabled: !!classId && !!resourceId && hasPublicId && !!currentResource,
    staleTime: 90 * 60 * 1000, // 90 phút — URL hiệu lực 2 giờ
    retry: false,
  });

  // URL thực tế đưa vào viewer:
  // - File upload (publicId) → signedUrl từ Cloudinary
  // - Link ngoài (không có publicId) → url trực tiếp
  const viewerUrl: string = hasPublicId
    ? (accessData?.signedUrl ?? "")
    : ((currentResource as any)?.url ?? "");

  // Xử lý khi URL hết hạn giữa chừng (PDF.js range request trả 403)
  const hasRefetched = useRef(false);
  const handleAccessExpired = useCallback(() => {
    if (!hasRefetched.current) {
      hasRefetched.current = true;
      setAccessUrlKey((k) => k + 1); // trigger refetch signed URL
    } else {
      toast.error("URL xem tài liệu đã hết hạn. Vui lòng tải lại trang.");
    }
  }, []);

  // Ngưỡng: khi URL mới về, reset cờ refetch
  React.useEffect(() => {
    if (accessData?.signedUrl) {
      hasRefetched.current = false;
    }
  }, [accessData?.signedUrl]);

  // 4. Phân loại tài nguyên hiện tại dựa trên format/tên file/loại
  const resourceMeta = useMemo(() => {
    return classifyResource(currentResource);
  }, [currentResource]);

  // Lọc tài nguyên cho sidebar
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const q = searchQuery.toLowerCase().trim();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [resources, searchQuery]);

  // Tải tài liệu an toàn
  const handleDownload = async () => {
    const downloadUrl = viewerUrl || currentResource?.url;
    if (!downloadUrl) {
      toast.error("Tài liệu chưa sẵn sàng hoặc không có đường dẫn hợp lệ.");
      return;
    }

    try {
      toast.info(`Đang tải tệp "${currentResource?.title || "tài liệu"}"...`, "Tải tài liệu");
      const filename =
        currentResource?.originalFilename ||
        `${currentResource?.title || "tai_lieu"}${
          currentResource?.format ? `.${currentResource.format}` : ""
        }`;
      await triggerFileDownload(downloadUrl, filename);
    } catch (err) {
      console.error("[ResourceViewPage] Lỗi tải tài liệu:", err);
      toast.error("Không thể tải tài liệu về máy. Vui lòng thử lại sau.");
    }
  };

  // Xóa tài liệu (dành cho Giáo viên)
  const handleDeleteResource = async () => {
    if (!classId || !resourceId) return;
    setIsDeleting(true);
    try {
      await classApi.removeResource(classId, resourceId);
      toast.success("Đã xóa tài liệu khỏi lớp học!");
      navigate(baseClassPath);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Lỗi khi xóa tài liệu!"));
      setIsDeleting(false);
    }
  };

  // Helper file icon trong sidebar
  const getSidebarIcon = (item: ILearningMaterial) => {
    const meta = classifyResource(item);
    switch (meta.kind) {
      case "youtube":
      case "video":
        return <VideoCameraOutlined className="text-primary text-base" />;
      case "pdf":
        return <FilePdfOutlined className="text-error text-base" />;
      case "docx":
        return <FileWordOutlined className="text-blue-500 text-base" />;
      case "excel":
        return <FileExcelOutlined className="text-green-600 text-base" />;
      case "slide":
        return <FilePptOutlined className="text-warning text-base" />;
      case "image":
        return <FileImageOutlined className="text-cyan-500 text-base" />;
      case "zip":
        return <FileZipOutlined className="text-purple-500 text-base" />;
      case "link":
        return <LinkOutlined className="text-cyan-500 text-base" />;
      default:
        return <FileUnknownOutlined className="text-secondary text-base" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-4">
        <AntSpin size="large" />
        <p className="text-sm text-secondary">Đang tải thông tin tài liệu học tập...</p>
      </div>
    );
  }

  if (isError || !currentResource) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <AntEmpty
          description="Không tìm thấy tài liệu học tập này hoặc bạn không có quyền truy cập."
          image={AntEmpty.PRESENTED_IMAGE_SIMPLE}
        />
        <AntButton
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(baseClassPath)}
          className="mt-6 rounded-xl"
        >
          Quay về lớp học
        </AntButton>
      </div>
    );
  }

  const uploaderName =
    typeof currentResource.uploadedBy === "object" && currentResource.uploadedBy?.fullName
      ? currentResource.uploadedBy.fullName
      : classData?.teacherId?.fullName || "Giáo viên phụ trách";

  const formattedDate = currentResource.uploadedAt
    ? new Date(currentResource.uploadedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Đã cập nhật";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 min-w-0">
          <AntButton
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(baseClassPath)}
            className="text-secondary hover:text-on-surface flex-shrink-0"
          >
            Quay lại
          </AntButton>
          <div className="h-4 w-[1px] bg-outline-variant hidden sm:block" />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider truncate">
                {classData?.title || classData?.className || "Lớp học"}
              </span>
              <span className="text-xs text-secondary">• Tài liệu học tập</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-on-surface truncate leading-tight mt-0.5">
              {currentResource.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Nút xem thử dành cho Teacher */}
          {isTeacherPortal && (
            <AntButton
              type={isStudentPreviewMode ? "primary" : "default"}
              icon={<EyeOutlined />}
              onClick={() => setIsStudentPreviewMode(!isStudentPreviewMode)}
              className="rounded-xl font-medium"
            >
              <span className="hidden sm:inline">
                {isStudentPreviewMode ? "Thoát xem học viên" : "Xem như học viên"}
              </span>
            </AntButton>
          )}

          {/* Nút Xóa dành cho Teacher (Ẩn khi bật chế độ xem như học viên) */}
          {isTeacherPortal && !isStudentPreviewMode && (
            <Popconfirm
              title="Xóa tài liệu này?"
              description="Hành động này sẽ gỡ tài liệu khỏi lớp học. Bạn sẽ được điều hướng về danh sách tài liệu."
              onConfirm={handleDeleteResource}
              okText="Xóa tài liệu"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: isDeleting }}
            >
              <AntButton
                danger
                type="default"
                icon={<DeleteOutlined />}
                className="rounded-xl font-medium"
              >
                <span className="hidden sm:inline">Xóa tài liệu</span>
              </AntButton>
            </Popconfirm>
          )}

          {/* Nút Tải về - Chỉ hiển thị khi có URL hợp lệ */}
          {(Boolean(viewerUrl) || Boolean(currentResource.url)) && (
            <AntButton
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              className="rounded-xl font-medium"
            >
              <span className="hidden sm:inline">Tải về máy</span>
            </AntButton>
          )}
        </div>
      </header>

      {/* Banner thông báo Chế độ xem như học viên cho Giáo viên */}
      {isTeacherPortal && isStudentPreviewMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 text-xs sm:text-sm text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <EyeOutlined className="text-amber-600" />
            <span>
              Đang ở <strong>Chế độ xem như học viên</strong> (các nút thao tác chỉnh sửa/xóa của Giáo viên đã được ẩn).
            </span>
          </div>
          <AntButton
            size="small"
            type="link"
            onClick={() => setIsStudentPreviewMode(false)}
            className="text-amber-900 font-semibold"
          >
            Quay lại chế độ Giáo viên
          </AntButton>
        </div>
      )}

      {/* Main 70/30 Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (70%): Resource Viewer Content */}
        <section className="lg:col-span-8 flex flex-col space-y-6 min-w-0">
          {/* Phân nhánh trình đọc tài liệu */}
          {/* Hiện spinner nếu đang fetch signed URL cho file upload */}
          {hasPublicId && isLoadingAccess ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
              <AntSpin size="large" />
              <p className="text-sm text-secondary">Đang xác thực quyền truy cập tài liệu...</p>
            </div>
          ) : hasPublicId && isAccessError ? (
            <div
              className="flex flex-col items-center justify-center min-h-[300px] space-y-4 p-6 rounded-2xl border"
              style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error-base)" }}
            >
              <LockOutlined style={{ fontSize: 40, color: "var(--color-error-base)" }} />
              <div className="text-center">
                <h3 className="text-base font-bold mb-1" style={{ color: "var(--color-error-text)" }}>
                  Không có quyền truy cập
                </h3>
                <p className="text-sm text-secondary">
                  {(accessError as any)?.response?.status === 403
                    ? "Bạn không có quyền xem tài liệu này."
                    : "Không thể tải tài liệu. Vui lòng thử lại sau."}
                </p>
              </div>
              <AntButton type="default" onClick={() => setAccessUrlKey((k) => k + 1)}>
                Thử lại
              </AntButton>
            </div>
          ) : resourceMeta.kind === "youtube" ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              <YouTubeLessonPlayer
                videoUrl={viewerUrl || currentResource.url || ""}
                lessonTitle={currentResource.title}
              />
            </div>
          ) : resourceMeta.kind === "video" ? (
            <div className="bg-black rounded-2xl overflow-hidden shadow-sm flex items-center justify-center min-h-[420px]">
              <video controls className="w-full max-h-[600px]" src={viewerUrl || currentResource.url || ""}>
                Trình duyệt của bạn không hỗ trợ thẻ phát video.
              </video>
            </div>
          ) : resourceMeta.kind === "pdf" ? (
            <PDFViewer
              url={viewerUrl || ""}
              title={currentResource.title}
              onDownload={handleDownload}
            />
          ) : resourceMeta.kind === "docx" ? (
            <DocxViewer
              url={viewerUrl || ""}
              title={currentResource.title}
              onDownload={handleDownload}
            />
          ) : (
            <GenericMaterialViewer
              type={currentResource.type}
              format={currentResource.format}
              originalFilename={currentResource.originalFilename}
              url={viewerUrl || currentResource.url}
              title={currentResource.title}
              description={currentResource.description}
              uploaderName={uploaderName}
              onDownload={handleDownload}
            />
          )}

          {/* Chi tiết thông tin tài nguyên */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-outline-variant">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                  {currentResource.title}
                </h2>
                <div className="flex items-center space-x-4 mt-2 text-xs text-secondary">
                  <span className="flex items-center space-x-1.5">
                    <UserOutlined />
                    <span>Đăng bởi: <strong>{uploaderName}</strong></span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <CalendarOutlined />
                    <span>{formattedDate}</span>
                  </span>
                </div>
              </div>

              <AntTag
                color={
                  resourceMeta.kind === "youtube" || resourceMeta.kind === "video"
                    ? "blue"
                    : resourceMeta.kind === "pdf"
                    ? "red"
                    : resourceMeta.kind === "docx"
                    ? "geekblue"
                    : resourceMeta.kind === "excel"
                    ? "green"
                    : resourceMeta.kind === "slide"
                    ? "orange"
                    : resourceMeta.kind === "image"
                    ? "cyan"
                    : resourceMeta.kind === "zip"
                    ? "purple"
                    : "default"
                }
                className="rounded-full px-3 py-1 font-semibold text-xs"
              >
                {resourceMeta.label}
              </AntTag>
            </div>

            {/* Mô tả / Ghi chú */}
            <div>
              <h3 className="text-xs font-bold uppercase text-secondary tracking-wider mb-2">
                Mô tả & Hướng dẫn học tập
              </h3>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                {currentResource.description || "Không có ghi chú bổ sung nào cho tài liệu này."}
              </p>
            </div>
          </div>
        </section>

        {/* Right Column (30%): Sidebar danh sách tài liệu trong lớp */}
        <aside className="lg:col-span-4 bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm sticky top-20">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface text-sm sm:text-base">
                Tài liệu của lớp
              </h3>
              <span className="text-xs font-semibold text-secondary px-2 py-0.5 bg-surface-container-high rounded-full">
                {resources.length} tệp
              </span>
            </div>

            <AntInput
              size="middle"
              placeholder="Tìm kiếm tài liệu..."
              prefix={<SearchOutlined className="text-secondary" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="rounded-xl"
            />
          </div>

          <div className="max-h-[calc(100vh-280px)] overflow-y-auto divide-y divide-outline-variant/60">
            {filteredResources.length === 0 ? (
              <div className="p-8 text-center text-secondary text-xs">
                Không tìm thấy tài liệu phù hợp.
              </div>
            ) : (
              filteredResources.map((res) => {
                const isActive = String(res._id) === String(resourceId);

                return (
                  <div
                    key={res._id}
                    onClick={() => navigate(getResourcePath(res._id))}
                    className={`p-4 flex items-start space-x-3 cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-surface-container-high flex-shrink-0 mt-0.5">
                      {getSidebarIcon(res)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isActive ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {res.title}
                      </h4>
                      <p className="text-xs text-secondary line-clamp-1 mt-0.5">
                        {res.description || "Tài liệu học tập lớp"}
                      </p>
                      <span className="text-[11px] text-secondary/80 mt-1 inline-block">
                        {res.uploadedAt
                          ? new Date(res.uploadedAt).toLocaleDateString("vi-VN")
                          : "Đã đăng"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ResourceViewPage;

