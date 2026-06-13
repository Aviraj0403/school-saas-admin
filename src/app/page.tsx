import { redirect } from 'next/navigation';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';


// Root page: redirect to dashboard (DashboardLayout handles auth check → shows login if not authenticated)
export default function RootPage() {
  redirect('/dashboard');
}
