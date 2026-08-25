import fs from "fs";
import path from "path";

const replaceInFile = (filePath, replacements) => {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;
  for (const { from, to } of replacements) {
    if (content.includes(from) || new RegExp(from).test(content)) {
      content = content.replace(new RegExp(from, "g"), to);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated ${filePath}`);
  }
};

const frontendSrc = path.join(process.cwd(), "src");

// Specific files from TSC output
const filesToUpdate = [
  "features/class/components/classes/ClassCard.tsx",
  "features/class/components/classes/ClassCardActions.tsx",
  "features/class/components/classes/TeacherClassCard.tsx",
  "features/class/pages/ClassDetail.tsx",
  "features/class/pages/ClassroomDetail.tsx",
  "features/class/utils/studentClassFilter.ts",
  "features/exam/pages/TeacherGlobalExamsPage.tsx",
];

const generalReplacements = [
  { from: "\\bclassName\\b(?!:)", to: "name" }, // Wait, this will replace <div className="xxx">! DANGEROUS!
];

// So we do strict replacements!
const strictReplacements = [
  { from: "\\.className\\b", to: ".name" },
  { from: "\\.classCode\\b", to: ".code" },
  { from: "\\.maxStudents\\b", to: ".capacity" },
  { from: "\\.learningMode\\b", to: ".mode" },
  { from: "classData\\?.className", to: "classData?.name" },
  { from: "classData\\.className", to: "classData.name" },
  { from: "classRecord\\.className", to: "classRecord.name" },
  { from: "classItem\\.className", to: "classItem.name" },
  { from: "item\\.className", to: "item.name" },
  { from: "c\\.className", to: "c.name" },
  { from: "\\{ className: ", to: "{ name: " },
  { from: "className:\\s*classData", to: "name: classData" },
  { from: "className:\\s*c\\.className", to: "name: c.name" },
  { from: "className \\|\\|", to: "name ||" },
  { from: "className \\?\\?", to: "name ??" },
];

for (const relPath of filesToUpdate) {
  const fullPath = path.join(frontendSrc, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf-8");
    let modified = false;
    
    for (const { from, to } of strictReplacements) {
      const regex = new RegExp(from, "g");
      if (regex.test(content)) {
        content = content.replace(regex, to);
        modified = true;
      }
    }
    
    // Manual replacements for destructuring
    if (content.includes("const { className } =")) {
      content = content.replace("const { className } =", "const { name } =");
      modified = true;
    }
    if (content.includes("const { className, classCode } =")) {
      content = content.replace("const { className, classCode } =", "const { name, code } =");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, "utf-8");
      console.log(`Updated ${relPath}`);
    } else {
      console.log(`No matches in ${relPath}`);
    }
  } else {
    console.log(`Not found: ${relPath}`);
  }
}
