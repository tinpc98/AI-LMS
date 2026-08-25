import fs from 'fs';

const files = [
  'd:/Dự Án/AI-LMS/Frontend/src/features/attendance/attendanceRoster.ts',
  'd:/Dự Án/AI-LMS/Frontend/src/features/attendance/components/TeacherAttendanceHistoryDrawer.tsx',
  'd:/Dự Án/AI-LMS/Frontend/src/features/class/components/classroom/AttendancePopup.tsx',
  'd:/Dự Án/AI-LMS/Frontend/src/features/class/components/classDetail/attendance/AttendanceStatusTag.tsx',
  'd:/Dự Án/AI-LMS/Frontend/src/features/class/components/classDetail/attendance/AttendanceTimeline.tsx',
  'd:/Dự Án/AI-LMS/Frontend/src/features/class/components/classDetail/attendance/AttendanceToolbar.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/"Present"/g, '"PRESENT"')
                   .replace(/"Absent"/g, '"ABSENT"')
                   .replace(/"Late"/g, '"LATE"')
                   .replace(/"Excused"/g, '"EXCUSED"');
  fs.writeFileSync(f, content);
  console.log('Updated ' + f);
});
