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

  // Replace Header Block wrapping div
  content = content.replace(
    /<div className="flex flex-col (?:md|lg):flex-row justify-between items-start (?:md|lg):items-center gap-4 bg-gradient-to-r from-[a-z0-9-]+ (?:via-[a-z0-9-]+ )?to-[a-z0-9-]+ p-6(?: sm:p-8)? rounded-(?:2xl|3xl) shadow-xl text-white(?: relative overflow-hidden)?"/g,
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4"'
  );

  // Remove absolute orbs
  content = content.replace(
    /<div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1\/2 translate-x-1\/3"><\/div>\n\s*<div className="relative z-10">/g,
    '<div>'
  );

  // If there's a relative z-10 left without orb
  content = content.replace(/<div className="relative z-10">/g, '<div>');

  // Fix h1
  content = content.replace(
    /<h1 className="text-(?:2xl|3xl)(?: sm:text-3xl lg:text-4xl)? font-(?:extrabold|black)(?: tracking-tight)?(?: text-slate-[0-9]+ dark:text-white tracking-tight bg-gradient-to-r from-[a-z0-9-]+ (?:via-[a-z0-9-]+ )?to-[a-z0-9-]+ bg-clip-text text-transparent)?"/g,
    '<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"'
  );

  content = content.replace(
    /<h1 className="text-(?:2xl|3xl)(?: sm:text-3xl lg:text-4xl)? font-(?:extrabold|black) tracking-tight"/g,
    '<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"'
  );

  // Fix p description
  content = content.replace(
    /<p className="text-blue-100 mt-2 text-sm(?: sm:text-base)? max-w-xl"/g,
    '<p className="text-slate-500 mt-1 text-sm"'
  );
  
  content = content.replace(
    /<p className="text-blue-100 mt-2 text-sm"/g,
    '<p className="text-slate-500 mt-1 text-sm"'
  );

  // Fix buttons in header (often "w-full sm:w-auto px-6 py-3 bg-white text-indigo-[0-9]+ hover:bg-slate-50 hover:shadow-lg font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm")
  content = content.replace(
    /<button className="w-full (?:sm:w-auto )?px-6 py-3 bg-white text-indigo-[0-9]+ hover:bg-slate-50 hover:shadow-lg font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"/g,
    '<button className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-sm"'
  );
  
  content = content.replace(
    /<button\s+onClick=\{([^\}]+)\}\s+className="relative z-10 w-full sm:w-auto mt-2 lg:mt-0 px-6 py-3 bg-white text-indigo-700 hover:bg-blue-50 hover:shadow-lg font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"/g,
    '<button \nonClick={$1}\nclassName="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-sm"'
  );

  // Fix Stats Row
  content = content.replace(
    /<div className="bg-(?:white\/60|emerald-50\/60|amber-50\/60|violet-50\/60) dark:bg-(?:slate-900\/60|emerald-950\/20|amber-950\/20|violet-950\/20) backdrop-blur-md border border-(?:slate-200\/60|emerald-200\/50|amber-200\/50|violet-200\/50) dark:border-(?:slate-700\/60|emerald-800\/40|amber-800\/40|violet-800\/40) p-5(?: sm:p-6)? rounded-3xl shadow-sm hover:shadow-md transition-shadow"/g,
    '<div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between"'
  );

  // Fix text classes in stats row
  content = content.replace(
    /<span className="text-xs sm:text-sm font-semibold text-(?:slate-500|emerald-600|amber-600|violet-600) dark:text-(?:slate-400|emerald-400|amber-400|violet-400)"/g,
    (match) => {
      let color = match.includes('emerald') ? 'emerald' : match.includes('amber') ? 'amber' : match.includes('violet') ? 'violet' : 'slate';
      return `<span className="text-sm font-medium text-${color}-600 dark:text-${color}-400"`;
    }
  );

  content = content.replace(
    /<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-(?:slate-800|emerald-700|amber-700|violet-700) dark:text-(?:white|emerald-400|amber-400|violet-400) mt-2 tracking-tight"/g,
    '<h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight"'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Processed', filePath);
  }
}

walkDir('./src/app', processFile);
