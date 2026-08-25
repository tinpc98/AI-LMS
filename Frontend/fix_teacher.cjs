const fs = require('fs');
let content = fs.readFileSync('src/features/report/components/ReportOverview.tsx', 'utf8');
content = content.replace(/teachers\.filter\(\(t\) => t\.status === "OPEN"\)/g, 'teachers.filter((t) => t.status === "Active")');
fs.writeFileSync('src/features/report/components/ReportOverview.tsx', content);
