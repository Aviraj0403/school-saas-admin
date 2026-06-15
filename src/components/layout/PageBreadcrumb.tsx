import React from 'react';
import Link from 'next/link';

interface PageBreadcrumbProps {
  title: string;
  subtitle?: string;
  homeUrl?: string;
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ 
  title, 
  subtitle, 
  homeUrl = '/dashboard' 
}) => {
  return (
    <div className="flex flex-col gap-1.5 mb-2 print:hidden">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest">
        <Link href={homeUrl} className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <i className="pi pi-home" />
        </Link>
        <i className="pi pi-angle-right text-[10px] opacity-70" />
        {subtitle && (
          <>
            <span className="cursor-default">{subtitle}</span>
            <i className="pi pi-angle-right text-[10px] opacity-70" />
          </>
        )}
        <span className="text-blue-600 dark:text-blue-400 cursor-default">
          {title}
        </span>
      </div>
    </div>
  );
};

export default PageBreadcrumb;
