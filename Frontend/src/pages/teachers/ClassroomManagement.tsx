import React, { useEffect, useState } from "react";
import { classApi } from "../../api/classApi";
import CreateClassModal from "../../components/features/CreateClassModal";
import type { IClass } from "../../interface/ClassInterface";

const ClassManagement = () => {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const res = await classApi.getMyClasses();
        setClasses(res.data.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách lớp:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleClassCreated = (newClass: IClass) => {
    setClasses((prev) => [newClass, ...prev]);
  };

  return (
    <main className="ml-[280px] flex-1 flex flex-col relative min-w-0 pt-16">
      <div className="p-margin-desktop max-w-max-content-width mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Quản lý lớp học</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Tạo lớp học mới
          </button>
        </div>

        {isLoading && <p>Đang tải danh sách lớp...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {classes.map((cls) => (
            <div key={cls._id} className="bg-surface border border-outline-variant rounded-xl p-5">
              <h3 className="font-bold">{cls.className}</h3>
              <p className="text-sm text-on-surface-variant">Mã lớp: {cls.joinCode}</p>
              <p className="text-sm text-on-surface-variant">{cls.students.length} học sinh</p>
            </div>
          ))}
        </div>
      </div>

      <CreateClassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleClassCreated} />
    </main>
  );
};

export default ClassManagement;
