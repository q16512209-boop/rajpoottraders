const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2];
let content = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  content += chunk;
});
process.stdin.on('end', () => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully wrote: ' + targetPath);
});
