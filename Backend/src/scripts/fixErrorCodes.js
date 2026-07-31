import fs from "fs";
import path from "path";

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk("c:/CODE/AI-LMS/Backend/src", (filePath) => {
  if (filePath.endsWith(".js")) {
    let content = fs.readFileSync(filePath, "utf8");
    let original = content;

    content = content.replace(/AIErrorCode\.INVALID_INPUT/g, "AIErrorCode.AI_INVALID_INPUT");
    content = content.replace(/AIErrorCode\.AI_INVALID_OUTPUT/g, "AIErrorCode.AI_OUTPUT_INVALID");
    content = content.replace(
      /AIErrorCode\.UNAUTHORIZED_ACCESS/g,
      "AIErrorCode.AI_FEATURE_DISABLED"
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
