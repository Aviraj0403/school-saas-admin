'use client';

import { asList } from '@/lib/utils';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/ui/PermissionGate';
import {
  useLeavesList,
  useApplyLeave,
  useApproveLeave,
  useRejectLeave,
  useCancelLeave,
  useLeaveBalance,
} from '@/hooks/queries/useLeave';
import { useStaffDirectory } from '@/hooks/queries/useStaffDirectory';
import { studentsService } from '@/services/students.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore';
import { apiMessage } from '@/lib/apiMessage';
import { toast } from 'sonner';
import { Calendar, Plus, LayoutGrid, List, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';

const LEAVE_TYPES = [
  { label: 'Sick Leave', value: 'sick' },
  { label: 'Casual Leave', value: 'casual' },
  { label: 'Earned Leave', value: 'earned' },
  { label: 'Maternity Leave', value: 'maternity' },
  { label: 'Other', value: 'other' },
];

const emptyForm = {
  applicantId: '',
  applicantType: 'STAFF' as 'STAFF' | 'STUDENT',
  leaveType: 'sick',
  startDate: '',
  endDate: '',
  reason: '',
};

export default function LeavePage() {
  const { isAdmin } = usePermissions();
  const activeUser = useAuthStore((s) => s.activeUser);
  const myId = activeUser?.id ?? '';

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const {
    data: leavesData,
    isLoading,
    isError,
    error,
  } = useLeavesList(page, limit, statusFilter ? { status: statusFilter } : undefined);
  const applyMutation = useApplyLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();
  const cancelMutation = useCancelLeave();
  const { data: balance } = useLeaveBalance(myId);

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState({ ...emptyForm });
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending Approval', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  // Name lookups: staff directory is readable by every staff role; the student
  // list is admin-only (students.read) so it is only fetched for admins.
  const { data: staffDir = [] } = useStaffDirectory();
  const { data: studentsData } = useQuery({
    queryKey: ['students', { page: 1, limit: 100, forLeave: true }],
    queryFn: () => studentsService.getStudents(1, 100),
    enabled: isAdmin,
    retry: false,
  });
  const students = asList<any>(studentsData);

  const nameFor = (leave: any): string => {
    if (leave.applicantName) return leave.applicantName;
    if (leave.applicantId === myId) return activeUser?.name || 'Me';
    const isStudent = String(leave.applicantType).toUpperCase() === 'STUDENT';
    const match = isStudent
      ? students.find((p: any) => p.id === leave.applicantId || p.userId === leave.applicantId)
      : staffDir.find((p) => p.id === leave.applicantId);
    return match?.name || (isStudent ? 'Student' : 'Staff member');
  };

  const openApply = () => {
    setApplyForm({
      ...emptyForm,
      applicantType: 'STAFF',
      applicantId: myId,
    });
    setShowApplyDialog(true);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const applicantId =
      applyForm.applicantType === 'STAFF' && !isAdmin ? myId : applyForm.applicantId;
    if (!applyForm.startDate || !applyForm.endDate || !applicantId || !applyForm.reason.trim()) {
      toast.error('All required fields must be filled.');
      return;
    }
    if (applyForm.endDate < applyForm.startDate) {
      toast.error('End date cannot be before the start date.');
      return;
    }
    applyMutation.mutate(
      {
        applicantId,
        applicantType: applyForm.applicantType,
        leaveType: applyForm.leaveType,
        reason: applyForm.reason.trim(),
        startDate: new Date(applyForm.startDate).toISOString(),
        endDate: new Date(applyForm.endDate).toISOString(),
      },
      {
        onSuccess: () => {
          setShowApplyDialog(false);
          setApplyForm({ ...emptyForm });
          toast.success('Leave application submitted successfully.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to submit leave application.')),
      }
    );
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success('Leave application approved.'),
      onError: (err) => toast.error(apiMessage(err, 'Failed to approve leave.')),
    });
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error('Please give a reason for rejecting.');
      return;
    }
    rejectMutation.mutate(
      { id: rejectTarget.id, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          toast.success('Leave application rejected.');
          setRejectTarget(null);
          setRejectReason('');
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to reject leave.')),
      }
    );
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    cancelMutation.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast.success('Leave application cancelled.');
        setCancelTarget(null);
      },
      onError: (err) => toast.error(apiMessage(err, 'Failed to cancel leave.')),
    });
  };

  const statusBadge = (status: string) => {
    const s = status || 'PENDING';
    let variant: 'warning' | 'success' | 'danger' | 'secondary' = 'warning';
    if (s === 'APPROVED') variant = 'success';
    if (s === 'REJECTED') variant = 'danger';
    if (s === 'CANCELLED') variant = 'secondary';
    return <Badge variant={variant}>{s}</Badge>;
  };

  const dateTemplate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr;
    }
  };

  const canCancel = (l: any) =>
    l.status === 'PENDING' &&
    (isAdmin || (l.applicantId === myId && String(l.applicantType).toUpperCase() === 'STAFF'));

  const activeLeaves = asList(leavesData).map((l: any) => ({ ...l, applicantName: nameFor(l) }));
  const totalRecords = leavesData?.meta?.total ?? 0;
  const totalPages = leavesData?.meta?.totalPages ?? 1;

  const rowActions = (leave: any, compact: boolean) => {
    if (leave.status !== 'PENDING') return null;
    return (
      <div className={`flex ${compact ? 'justify-center' : 'justify-end'} gap-2 flex-wrap`}>
        {canCancel(leave) && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setCancelTarget(leave)}
          >
            <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
        )}
        <PermissionGate roles={['school_admin']}>
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-rose-600 hover:text-rose-700 border-rose-200"
            onClick={() => {
              setRejectTarget(leave);
              setRejectReason('');
            }}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
          </Button>
          <Button
            size="sm"
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleApprove(leave.id)}
            disabled={approveMutation.isPending}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
        </PermissionGate>
      </div>
    );
  };

  const leaveCards = (cls: string) => (
    <div className={cls}>
      {activeLeaves.map((leave: any) => (
        <div
          key={leave.id}
          className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
                {leave.applicantName ? leave.applicantName[0].toUpperCase() : 'L'}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-snug">
                  {leave.applicantName}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  {leave.applicantType} · {leave.leaveType}
                </p>
              </div>
            </div>
            {statusBadge(leave.status)}
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs flex flex-col gap-1.5 border border-zinc-100 dark:border-zinc-800 text-muted-foreground dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Start Date:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                {dateTemplate(leave.startDate ?? leave.fromDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>End Date:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                {dateTemplate(leave.endDate ?? leave.toDate)}
              </span>
            </div>
          </div>

          <div className="text-xs text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold text-zinc-400 block text-[10px] uppercase tracking-wider mb-0.5">
              Reason:
            </span>
            {leave.reason}
          </div>

          {leave.status === 'PENDING' && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1">
              {rowActions(leave, false)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Leave Management" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <PageHeader
          title="Leave Requests & Applications"
          description={
            isAdmin
              ? 'Process student and staff leave applications and review absence records'
              : 'Apply for leave and track the status of your applications'
          }
          actions={
            <Button className="h-11 w-full sm:h-10 sm:w-auto" onClick={openApply}>
              <Plus className="w-4 h-4 mr-2" /> Apply Leave
            </Button>
          }
        />

        {balance && (
          <div className="surface-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              My leave taken in {balance.year}
            </p>
            <div className="flex flex-wrap gap-3 items-center text-sm">
              <Badge variant="primary">{balance.totalDaysTaken ?? 0} days total</Badge>
              <Badge variant="secondary">{balance.applications ?? 0} approved applications</Badge>
              {Object.entries(balance.byType ?? {}).map(([type, days]) => (
                <Badge key={type} variant="info">
                  {type}: {String(days)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex w-full items-center gap-3 sm:w-64">
            <label className="shrink-0 whitespace-nowrap text-xs font-semibold text-muted-foreground">
              Status:
            </label>
            <Select
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="hidden items-center gap-1 rounded-lg bg-muted p-1 md:flex">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm' : 'text-zinc-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm' : 'text-zinc-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="surface-card p-3 sm:p-6">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
              <p className="text-xs">Loading leave requests...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-rose-600 text-sm">
              {apiMessage(error, 'Could not load leave applications.')}
            </div>
          ) : activeLeaves.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No Leave Applications
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                There are no leave requests matching your current filter.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            leaveCards('grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3')
          ) : (
            <>
              {leaveCards('grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden')}
              <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-muted-foreground font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Applicant Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Start Date</th>
                      <th className="px-4 py-3">End Date</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {activeLeaves.map((d: any) => (
                      <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {d.applicantName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{d.applicantType}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                          {dateTemplate(d.startDate ?? d.fromDate)}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                          {dateTemplate(d.endDate ?? d.toDate)}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{d.reason}</td>
                        <td className="px-4 py-3">{statusBadge(d.status)}</td>
                        <td className="px-4 py-3 text-center">{rowActions(d, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {totalRecords > limit && (
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages} · {totalRecords} applications
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave */}
      <Dialog
        isOpen={showApplyDialog}
        onClose={() => setShowApplyDialog(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApply} className="flex flex-col gap-4 py-2">
          {isAdmin && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Applicant Type *
              </label>
              <Select
                value={applyForm.applicantType}
                options={[
                  { label: 'Staff Member', value: 'STAFF' },
                  { label: 'Student', value: 'STUDENT' },
                ]}
                onChange={(e) =>
                  setApplyForm({
                    ...applyForm,
                    applicantType: e.target.value as 'STAFF' | 'STUDENT',
                    applicantId: e.target.value === 'STAFF' ? myId : '',
                  })
                }
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              {applyForm.applicantType === 'STUDENT' ? 'Student *' : 'Staff Member *'}
            </label>
            {!isAdmin ? (
              <Input value={activeUser?.name ?? ''} disabled readOnly />
            ) : applyForm.applicantType === 'STUDENT' ? (
              <Select
                value={applyForm.applicantId}
                placeholder="Select student"
                options={[
                  { label: 'Select student', value: '' },
                  ...students.map((s: any) => ({
                    label: `${s.name}${s.admissionNo ? ` (${s.admissionNo})` : ''}`,
                    value: s.id,
                  })),
                ]}
                onChange={(e) => setApplyForm({ ...applyForm, applicantId: e.target.value })}
              />
            ) : (
              <Select
                value={applyForm.applicantId}
                options={[
                  { label: 'Select staff member', value: '' },
                  ...staffDir.map((s) => ({ label: s.name, value: s.id })),
                ]}
                onChange={(e) => setApplyForm({ ...applyForm, applicantId: e.target.value })}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Leave Category *
            </label>
            <Select
              value={applyForm.leaveType}
              options={LEAVE_TYPES}
              onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Start Date *
              </label>
              <Input
                type="date"
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                End Date *
              </label>
              <Input
                type="date"
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Reason *
            </label>
            <textarea
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              placeholder="Describe reason for leave..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={applyMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Reject with reason */}
      <Dialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Leave Application"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Rejecting the application of <b>{rejectTarget?.applicantName}</b>. The applicant will
            see this reason.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            placeholder="Reason for rejection..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Back
            </Button>
            <Button variant="danger" onClick={confirmReject} isLoading={rejectMutation.isPending}>
              Reject
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Cancel confirm */}
      <Dialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Leave Application"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Cancel this pending leave application? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmCancel} isLoading={cancelMutation.isPending}>
              Cancel application
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
