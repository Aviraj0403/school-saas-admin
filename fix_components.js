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

  // Filter Bar
  content = content.replace(
    /<div className="bg-white\/70 dark:bg-slate-900\/70 backdrop-blur-xl p-4(?: sm:p-5)? rounded-3xl border border-slate-200\/70 dark:border-slate-700\/70 shadow-lg shadow-slate-200\/20 dark:shadow-none flex flex-col md:flex-row justify-between items-center gap-4"/g,
    '<div className="flex flex-col md:flex-row justify-between items-center gap-4"'
  );
  
  content = content.replace(
    /<div className="relative w-full md:w-96">/g,
    '<div className="relative w-full md:w-80">'
  );

  content = content.replace(
    /<i className="pi pi-search absolute left-4 top-1\/2 -translate-y-1\/2 text-slate-400"><\/i>/g,
    '<i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>'
  );

  content = content.replace(
    /className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900\/50 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500\/10 transition-all text-sm shadow-inner"/g,
    'className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"'
  );

  content = content.replace(
    /<div className="flex gap-2 w-full md:w-auto justify-end bg-slate-100\/50 dark:bg-slate-800\/50 p-1\.5 rounded-2xl border border-slate-200\/50 dark:border-slate-700\/50">/g,
    '<div className="flex gap-2 w-full md:w-auto justify-end bg-slate-100 dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800">'
  );
  
  content = content.replace(
    /className={`p-2\.5 px-4 rounded-xl transition-all font-medium flex items-center gap-2 \$\{/g,
    'className={`p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm ${'
  );

  content = content.replace(
    /viewMode === 'grid'\s*\n\s*\? 'bg-white text-indigo-600 dark:bg-slate-700 dark:text-indigo-400 shadow-sm'\s*\n\s*: 'hover:bg-slate-200\/50 dark:hover:bg-slate-700\/50 text-slate-500'/g,
    `viewMode === 'grid' \n                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' \n                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'`
  );
  
  content = content.replace(
    /viewMode === 'table'\s*\n\s*\? 'bg-white text-indigo-600 dark:bg-slate-700 dark:text-indigo-400 shadow-sm'\s*\n\s*: 'hover:bg-slate-200\/50 dark:hover:bg-slate-700\/50 text-slate-500'/g,
    `viewMode === 'table' \n                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' \n                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'`
  );

  content = content.replace(
    /<i className="pi pi-th-large text-lg"><\/i>/g,
    '<i className="pi pi-th-large text-sm"></i>'
  );
  content = content.replace(
    /<i className="pi pi-list text-lg"><\/i>/g,
    '<i className="pi pi-list text-sm"></i>'
  );
  
  // Clean up grid items backgrounds
  content = content.replace(
    /className="bg-white\/80 dark:bg-slate-900\/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-\[2rem\] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-5 group"/g,
    'className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between gap-4"'
  );

  // Clean up icons container in grid
  content = content.replace(
    /className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900\/40 dark:to-purple-900\/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-lg border border-white\/50 dark:border-slate-700\/50 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"/g,
    'className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-800"'
  );

  content = content.replace(
    /className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1"/g,
    'className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1"'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Processed Components', filePath);
  }
}

walkDir('./src/app', processFile);
