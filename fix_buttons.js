const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('page.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  content = content.replace(
    /bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700/g,
    'bg-indigo-600 hover:bg-indigo-700 border-none'
  );
  
  content = content.replace(
    /bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95/g,
    'bg-emerald-600 hover:bg-emerald-700 border-none'
  );

  content = content.replace(
    /bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700/g,
    'bg-indigo-600 hover:bg-indigo-700 border-none'
  );

  content = content.replace(
    /bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700/g,
    'bg-indigo-600 hover:bg-indigo-700 border-none'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Processed Buttons', filePath);
  }
}

walkDir('./src/app', processFile);
