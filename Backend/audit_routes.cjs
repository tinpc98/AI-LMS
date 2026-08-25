const fs = require('fs');
const path = require('path');
const glob = require('glob');

const modulesDir = path.join(__dirname, 'src', 'modules');
const routesFiles = glob.sync(path.join(modulesDir, '**', '*.routes.js').replace(/\\/g, '/'));
const inventory = [];

routesFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const routeRegex = /(?:router|route)\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]\s*,\s*(.*?)(?=\);)/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const url = match[2];
    const middlewares = match[3];
    inventory.push(`${path.basename(file)} | ${method} ${url} | ${middlewares}`);
  }
});

fs.writeFileSync('audit_inventory.txt', inventory.join('\n'));
console.log('Done!');
