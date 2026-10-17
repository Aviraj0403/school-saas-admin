import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface PageBreadcrumbProps {
  title: string;
  subtitle?: string;
  homeUrl?: string;
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  title,
  subtitle,
  homeUrl = '/dashboard',
}) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-3.5 print:hidden">
      <ol className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 overflow-x-auto no-scrollbar py-0.5 max-w-full">
        <li className="shrink-0">
          <Link
            href={homeUrl}
            className="flex items-center justify-center size-6 sm:size-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-all shadow-2xs"
            aria-label="Home"
          >
            <Home className="size-3 sm:size-3.5" />
          </Link>
        </li>
        {subtitle && (
          <>
            <li className="shrink-0 flex items-center text-zinc-300 dark:text-zinc-600">
              <ChevronRight className="size-3 sm:size-3.5" />
            </li>
            <li className="shrink-0 max-w-[110px] sm:max-w-[160px] truncate text-zinc-500 dark:text-zinc-400 font-medium">
              {subtitle}
            </li>
          </>
        )}
        <li className="shrink-0 flex items-center text-zinc-300 dark:text-zinc-600">
          <ChevronRight className="size-3 sm:size-3.5" />
        </li>
        <li className="min-w-0 max-w-[150px] sm:max-w-[280px] md:max-w-none truncate font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </li>
      </ol>
    </nav>
  );
};

export default PageBreadcrumb;
