const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\71607cb2-93f4-4122-821b-8fe34853e77d\\.system_generated\\logs\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('USER_INPUT') && line.includes('xung đột thang điểm')) {
      const data = JSON.parse(line);
      console.log(data.content);
    }
  }
}

processLineByLine();
