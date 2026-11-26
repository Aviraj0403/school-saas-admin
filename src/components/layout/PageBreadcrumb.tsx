import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface PageBreadcrumbProps {
  title: string;
  subtitle?: string;
  homeUrl?: string;
}

/** Central-style breadcrumb pill: home chip, optional parent, highlighted current page. */
const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  title,
  subtitle,
  homeUrl = '/dashboard',
}) => (
  <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 print:hidden">
    <div className="crumb-shell">
      <ol className="crumb-list">
        <li>
          <Link href={homeUrl} className="crumb-home" aria-label="Home">
            <Home className="size-3.5" />
          </Link>
        </li>
        {subtitle && (
          <>
            <li aria-hidden="true">
              <ChevronRight className="crumb-sep size-3.5" />
            </li>
            <li>
              <span className="crumb-link">{subtitle}</span>
            </li>
          </>
        )}
        <li aria-hidden="true">
          <ChevronRight className="crumb-sep size-3.5" />
        </li>
        <li>
          <span className="crumb-current" aria-current="page">
            {title}
          </span>
        </li>
      </ol>
    </div>
  </nav>
);

export default PageBreadcrumb;
