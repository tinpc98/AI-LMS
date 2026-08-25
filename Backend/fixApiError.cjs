const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'classEnrollment', 'classEnrollment.service.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace new ApiError(xxx, "yyy") with new Error("yyy")
content = content.replace(/new ApiError\(\d+,\s*([^)]+)\)/g, 'new Error($1)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed ApiError');
