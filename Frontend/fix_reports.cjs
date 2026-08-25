const fs = require('fs');
const files = [
  'src/features/report/components/ClassReport.tsx',
  'src/features/report/components/ReportOverview.tsx',
  'src/features/class/class.mock.ts',
  'src/features/class/mockClasses.ts'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/status === "Active"/g, 'status === "OPEN"');
    content = content.replace(/status === "Upcoming"/g, 'status === "DRAFT"');
    content = content.replace(/status === "Completed"/g, 'status === "CLOSED"');
    
    // In mock files:
    content = content.replace(/status: "Active"/g, 'status: "OPEN"');
    content = content.replace(/status: "Upcoming"/g, 'status: "DRAFT"');
    content = content.replace(/status: "Completed"/g, 'status: "CLOSED"');
    
    fs.writeFileSync(file, content);
  }
});
