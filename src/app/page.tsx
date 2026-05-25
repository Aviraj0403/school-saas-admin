import { redirect } from 'next/navigation';

// Root page: redirect to dashboard (DashboardLayout handles auth check → shows login if not authenticated)
export default function RootPage() {
  redirect('/dashboard');
}
