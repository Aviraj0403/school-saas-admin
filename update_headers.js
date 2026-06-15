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

const PREMIUM_BUTTON_CLASSES = 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold border-0 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ring-1 ring-slate-900/5 dark:ring-white/10 px-5 py-3';

const files = walk('d:/JD-Info/School-Saas/school-saas-admin/src/app');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // 1. Refactor Header Layout
  // Looking for something like: className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5"
  content = content.replace(
    /className=(['"])flex flex-col (?:md|lg|sm):flex-row justify-between items-start (?:md|lg|sm):items-center gap-4/g,
    'className=$1flex flex-col items-start gap-4'
  );

  content = content.replace(
    /className=(['"])flex flex-col (?:md|lg|sm):flex-row justify-between items-center gap-4/g,
    'className=$1flex flex-col items-start gap-4'
  );

  // 2. Refactor primary action buttons to the premium dark button aesthetic
  // Most buttons currently use bg-primary, or bg-indigo-700/600/bg-white
  // Match buttons that contain a text like 'New Admission', 'New Class', 'Add Staff', 'Add', etc.
  // Actually, we can look for buttons inside the header blocks that we just modified.
  // But a safer way is to just replace the classes on specific buttons.
  // We'll replace bg-primary hover:opacity-95 text-white ...
  content = content.replace(
    /className=(["'])w-full sm:w-auto px-5 py-3 bg-primary hover:opacity-95 text-white font-bold border-0 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm(["'])/g,
    `className=$1w-full sm:w-auto ${PREMIUM_BUTTON_CLASSES}$2`
  );

  content = content.replace(
    /className=(["'])px-4 py-2\.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs(["'])/g,
    `className=$1w-full sm:w-auto ${PREMIUM_BUTTON_CLASSES}$2`
  );

  // General catch all for other header buttons that might be primary
  content = content.replace(
    /className=(["'])px-4 py-2\.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs(["'])/g,
    `className=$1w-full sm:w-auto ${PREMIUM_BUTTON_CLASSES}$2`
  );

  content = content.replace(
    /className=(["'])px-5 py-2\.5 bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm(["'])/g,
    `className=$1w-full sm:w-auto ${PREMIUM_BUTTON_CLASSES}$2`
  );

  // Staff page Add Staff Member button
  content = content.replace(
    /className=(["'])w-full sm:w-auto px-5 py-3 bg-primary hover:opacity-95 text-white font-bold border-0 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm(["'])/g,
    `className=$1w-full sm:w-auto ${PREMIUM_BUTTON_CLASSES}$2`
  );

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated ${f}`);
  }
});
