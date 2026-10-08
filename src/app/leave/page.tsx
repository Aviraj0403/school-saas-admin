'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useLeavesList,
  useApplyLeave,
  useApproveLeave,
  useRejectLeave,
} from '@/hooks/queries/useLeave';
import { toast } from 'sonner';
import { Calendar, Plus, LayoutGrid, List, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function LeavePage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { data: leavesData, isLoading } = useLeavesList(
    page,
    limit,
    statusFilter ? { status: statusFilter } : undefined
  );
  const applyMutation = useApplyLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState<any>({
    applicantId: '',
    applicantType: 'STUDENT',
    leaveType: 'sick',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const applicantTypes = [
    { label: 'Student', value: 'STUDENT' },
    { label: 'Staff Member', value: 'STAFF' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending Approval', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.applicantId) {
      toast.error('All required fields must be filled.');
      return;
    }
    applyMutation.mutate(
      {
        ...applyForm,
        startDate: new Date(applyForm.startDate).toISOString(),
        endDate: new Date(applyForm.endDate).toISOString(),
      },
      {
        onSuccess: () => {
          setShowApplyDialog(false);
          setApplyForm({
            applicantId: '',
            applicantType: 'STUDENT',
            leaveType: 'sick',
            startDate: '',
            endDate: '',
            reason: '',
          });
          toast.success('Leave application submitted successfully.');
        },
        onError: () => toast.error('Failed to submit leave application.'),
      }
    );
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success('Leave application approved.'),
      onError: () => toast.error('Failed to approve leave.'),
    });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(
      { id, reason: 'Rejected by administrator' },
      {
        onSuccess: () => toast.success('Leave application rejected.'),
        onError: () => toast.error('Failed to reject leave.'),
      }
    );
  };

  const statusBadge = (status: string) => {
    const s = status || 'PENDING';
    let variant: 'warning' | 'success' | 'danger' = 'warning';
    if (s === 'APPROVED') variant = 'success';
    if (s === 'REJECTED') variant = 'danger';
    return <Badge variant={variant}>{s}</Badge>;
  };

  const dateTemplate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr;
    }
  };

  const activeLeaves = leavesData?.items || leavesData?.data?.items || [];
  const totalRecords = leavesData?.meta?.total || leavesData?.data?.meta?.total || 0;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Leave Management" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-brand" />
              Leave Requests & Applications
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Process student and faculty leave applications and review absence records
            </p>
          </div>

          <Button onClick={() => setShowApplyDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Apply Leave
          </Button>
        </div>

        {/* Filter and Control Bar */}
        <div className="flex justify-between items-center flex-wrap gap-4 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center gap-3 w-64">
            <label className="text-xs font-semibold text-zinc-500">Status:</label>
            <Select
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Display Section */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-zinc-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
              <p className="text-xs">Loading leave requests...</p>
            </div>
          ) : activeLeaves.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No Leave Applications
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                There are no leave requests matching your current filter.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                          {leave.applicantType}
                        </p>
                      </div>
                    </div>
                    {statusBadge(leave.status)}
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs flex flex-col gap-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                        {dateTemplate(leave.startDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                        {dateTemplate(leave.endDate)}
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
                    <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        onClick={() => handleReject(leave.id)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(leave.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
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
                        {dateTemplate(d.startDate)}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                        {dateTemplate(d.endDate)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{d.reason}</td>
                      <td className="px-4 py-3">{statusBadge(d.status)}</td>
                      <td className="px-4 py-3 text-center">
                        {d.status === 'PENDING' && (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-rose-600"
                              onClick={() => handleReject(d.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 text-white"
                              onClick={() => handleApprove(d.id)}
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Apply Leave */}
      <Dialog
        isOpen={showApplyDialog}
        onClose={() => setShowApplyDialog(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApply} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Applicant Type *
            </label>
            <Select
              value={applyForm.applicantType}
              options={applicantTypes}
              onChange={(e) => setApplyForm({ ...applyForm, applicantType: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Leave Category *
            </label>
            <Select
              value={applyForm.leaveType}
              options={[
                { label: 'Sick Leave', value: 'sick' },
                { label: 'Casual Leave', value: 'casual' },
                { label: 'Earned Leave', value: 'earned' },
                { label: 'Maternity Leave', value: 'maternity' },
                { label: 'Other', value: 'other' },
              ]}
              onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Student / Staff ID *
            </label>
            <Input
              value={applyForm.applicantId}
              onChange={(e) => setApplyForm({ ...applyForm, applicantId: e.target.value })}
              placeholder="Enter UUID or Admission No..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={applyMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
