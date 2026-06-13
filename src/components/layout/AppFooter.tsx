import React from 'react';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto flex items-center py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
      <div className="lg:px-8 px-6 w-full flex md:justify-between justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase text-center sm:text-left">
          Copyright© EDUMANAGE SYSTEMS {currentYear} All Rights Reserved.
        </div>
        <div className="md:flex hidden gap-2 items-center md:justify-end">
          Design &amp; Develop by School SaaS
        </div>
      </div>
    </footer>
  );
}
