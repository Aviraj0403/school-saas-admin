const fs = require('fs');

const files = [
  'src/app/academics/classes/page.tsx',
  'src/app/academics/departments/page.tsx',
  'src/app/academics/lesson-plans/page.tsx',
  'src/app/academics/online-classes/page.tsx',
  'src/app/academics/quizzes/page.tsx',
  'src/app/academics/terms/page.tsx',
  'src/app/academics/timetable/page.tsx',
  'src/app/analytics/page.tsx',
  'src/app/attendance/page.tsx',
  'src/app/communication/page.tsx',
  'src/app/error.tsx',
  'src/app/exams/page.tsx',
  'src/app/fee/page.tsx',
  'src/app/hostel/page.tsx',
  'src/app/inventory/page.tsx',
  'src/app/leave/page.tsx',
  'src/app/library/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/staff/page.tsx',
  'src/app/students/admissions/page.tsx',
  'src/app/students/page.tsx',
  'src/app/superadmin/plans/page.tsx',
  'src/app/superadmin/roadmap/page.tsx',
  'src/app/transport/page.tsx',
  'src/app/users/page.tsx',
  'src/app/whatsapp/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> [a-f0-9]+/g;
  
  content = content.replace(regex, (match, head, theirs) => {
    // Check if it is a Filter Bar block (where my script accidentally broke justify-between)
    if (
      head.includes('items-start gap-4 bg-slate-100') || 
      theirs.includes('justify-between items-center') || 
      head.includes('items-start gap-4 bg-white/80') || 
      head.includes('bg-white/80') || 
      theirs.includes('justify-between')
    ) {
      if (!head.includes('text-2xl') && !head.includes('<h1') && !head.includes('pt-4 border-b')) {
        // This is a filter bar. We KEEP THEIRS! Because they styled it properly and kept justify-between.
        return theirs;
      }
    }
    
    // Check if it's the `Add Subject` button conflict in classes/page.tsx
    if (head.includes('bg-slate-900 dark:bg-white hover:bg-slate-800') && !head.includes('text-2xl') && !head.includes('<h1')) {
       // Keep HEAD because it's our newly styled button
       return head;
    }

    // Default for Header blocks and error.tsx: KEEP HEAD
    // We want to keep the Title blocks and our premium button layout!
    return head;
  });

  fs.writeFileSync(f, content, 'utf8');
  console.log(`Resolved ${f}`);
});
