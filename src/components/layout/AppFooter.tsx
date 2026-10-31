import React from 'react';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6 lg:px-8">
        <p>© {currentYear} EduNexus. All rights reserved.</p>
        <a
          href="/academics/guide"
          className="hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Help &amp; user guide
        </a>
      </div>
    </footer>
  );
}
