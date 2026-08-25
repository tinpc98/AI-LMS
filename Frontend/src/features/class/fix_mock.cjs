const fs = require('fs');
const files = ['class.mock.ts', 'mockClasses.ts'];
const mapping = {
  'Thứ 2': 'Monday',
  'Thứ 3': 'Tuesday',
  'Thứ 4': 'Wednesday',
  'Thứ 5': 'Thursday',
  'Thứ 6': 'Friday',
  'Thứ 7': 'Saturday',
  'Chủ nhật': 'Sunday'
};
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [vn, en] of Object.entries(mapping)) {
      content = content.replace(new RegExp('"' + vn + '"', 'g'), '"' + en + '"');
    }
    fs.writeFileSync(file, content);
  }
});
