const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/JD-Info/School-Saas/school-saas-admin/src/app');
let affectedFiles = [];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.match(/className=[\"']flex flex-col (?:md|lg|sm):flex-row justify-between items-start/)) {
    affectedFiles.push(f.replace(/\\/g, '/').replace('d:/JD-Info/School-Saas/school-saas-admin/', ''));
  }
});
console.log(affectedFiles.join('\n'));
