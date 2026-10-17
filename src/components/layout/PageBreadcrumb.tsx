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
    <nav aria-label="Breadcrumb" className="mb-3 print:hidden">
      <ol className="flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400">
        <li>
          <Link
            href={homeUrl}
            className="flex items-center rounded-md p-1 -m-1 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Home"
          >
            <Home className="size-3.5" />
          </Link>
        </li>
        {subtitle && (
          <>
            <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600" />
            <li className="cursor-default">{subtitle}</li>
          </>
        )}
        <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600" />
        <li className="font-medium text-slate-900 dark:text-slate-100 cursor-default">{title}</li>
      </ol>
    </nav>
  );
};

export default PageBreadcrumb;
