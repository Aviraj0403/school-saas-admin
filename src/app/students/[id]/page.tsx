'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useStudentDetails, useDeleteStudent } from '@/hooks/queries/useStudents';
import { useStudentDues } from '@/hooks/queries/useFee';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { studentsService } from '@/services/students.service';
import { analyticsService } from '@/services/analytics.service';
import { resolveMediaUrl, compressImageForProfile } from '@/lib/media';
import { canManageProfilePhotos } from '@/lib/permissions';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';



export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'personal' | 'guardian' | 'ledger' | 'audit_logs' | 'facilities'>('personal');
  const { data: student, isPending, isError } = useStudentDetails(id);
  const { data: ledgerDuesData, isPending: loadingLedger } = useStudentDues(id);
  const deleteMutation = useDeleteStudent();
  const queryClient = useQueryClient();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const activeUser = useAuthStore((s) => s.activeUser);
  const canEditPhoto = canManageProfilePhotos(activeUser?.role, activeUser?.isSuperAdmin ?? false);

  // Only fetched once the tab is open — the endpoint is school_admin-gated, so
  // firing it on every student page view would 403 for everyone else.
  const { data: activityData, isPending: loadingActivity } = useQuery({
    queryKey: ['activity-log', 'student', id],
    queryFn: () => analyticsService.getActivityLog(1, 50, { subjectId: id }),
    enabled: activeTab === 'audit_logs' && Boolean(id),
  });
  const activityLog = activityData?.items ?? [];

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const blob = await compressImageForProfile(file);
      if (!blob) throw new Error('Image could not be compressed under 100 KB');
      await studentsService.uploadPhoto(id, blob);
      await queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'error', summary: 'Photo Upload Failed', detail: err?.response?.data?.message || err?.message || 'Try a smaller image.', life: 5000 }
      }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Soft-delete this student? Their records will be archived.')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          router.push('/students');
        },
      });
    }
  };

  if (isPending) {
    return (
      <DashboardLayout>
      <PageBreadcrumb title="Students Details" subtitle="Students" />
<div className="p-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md max-w-4xl mx-auto mt-10">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-zinc-500">Loading student details profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !student) {
    return (
      <DashboardLayout>
      <PageBreadcrumb title="Students Details" subtitle="Students" />
<div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md max-w-4xl mx-auto mt-10">
          <i className="pi pi-exclamation-triangle text-4xl text-rose-500 mb-3"></i>
          <p className="text-zinc-900 dark:text-zinc-200 font-bold text-lg">Failed to Load Profile</p>
          <p className="text-zinc-500 text-sm mt-1">Student details could not be found or retrieved.</p>
          <Button label="Back to Directory" className="mt-4 bg-blue-600 text-white p-2.5 px-5 rounded-md font-medium" onClick={() => router.push('/students')} />
        </div>
      </DashboardLayout>
    );
  }

  const fullName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Students Details" subtitle="Students" />
<div className="flex flex-col gap-4 pb-10">
        
        {/* Header Navigation & Breadcrumb */}
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center gap-2 cursor-pointer text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors" onClick={() => router.push('/students')}>
            <i className="pi pi-arrow-left text-xs"></i>
            <span className="text-xs font-semibold uppercase tracking-wider">Back to Directory</span>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <label className={`group/photo relative ${canEditPhoto ? 'cursor-pointer' : ''}`} title={canEditPhoto ? 'Change profile photo' : fullName}>
              {resolveMediaUrl(student.photo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(student.photo)!}
                  alt={fullName}
                  className="w-16 h-16 rounded-md object-cover border border-blue-100 dark:border-blue-800/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black border border-blue-100 dark:border-blue-800/30">
                  {student.firstName ? student.firstName[0] : student.name ? student.name[0] : '?'}
                  {student.lastName ? student.lastName[0] : ''}
                </div>
              )}
              {canEditPhoto && (
                <>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow">
                    {uploadingPhoto ? <i className="pi pi-spinner pi-spin" /> : <i className="pi pi-camera" />}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploadingPhoto} />
                </>
              )}
            </label>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
                <span className="text-xs text-zinc-500 font-medium">
                  Admission No: <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{student.admissionNo}</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:inline-block"></span>
                <span className="text-xs text-zinc-500 font-medium">
                  Class: <span className="font-semibold text-blue-600 dark:text-blue-400">{student.className || 'Not Assigned'}</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:inline-block"></span>
                <span className="text-xs text-zinc-500 font-medium">
                  Academic Year: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{student.academicYear?.name || '—'}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 self-stretch md:self-auto justify-end border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 pt-4 md:pt-0">
            <Tag 
              value={student.status || 'ACTIVE'} 
              severity={student.status === 'ACTIVE' || !student.status ? 'success' : 'warning'} 
              className="px-3 py-1 font-bold rounded-full text-xs shadow-sm"
            />
            <Button 
              icon="pi pi-trash" 
              className="p-button-rounded p-button-text p-button-danger hover:bg-rose-500/10 p-2"
              tooltip="Remove Student" 
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            />
          </div>
        </div>

        {/* Tab switch navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-full">
          {[
            { id: 'personal', label: 'Personal Profile', icon: 'pi-user' },
            { id: 'guardian', label: 'Parent & Guardian Info', icon: 'pi-users' },
            { id: 'facilities', label: 'Transport & Hostel', icon: 'pi-home' },
            { id: 'ledger', label: 'Academic Fee Ledger', icon: 'pi-wallet' },
            { id: 'audit_logs', label: 'Activity Logs', icon: 'pi-list' }
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`p-3 px-5 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tb.id
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              }`}
            >
              <i className={`pi ${tb.icon} text-[10px]`}></i>
              <span>{tb.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic tab contents */}
        {activeTab === 'personal' && (
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Date of Birth</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1">{student.dob ? new Date(student.dob).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Gender</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1 capitalize">{student.gender || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Blood Group</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1 uppercase">{student.bloodGroup || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Aadhar / National ID</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1">{student.aadharNo || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mother Tongue</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1 capitalize">{student.motherTongue || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Previous School Attended</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1">{student.previousSchool || '—'}</p>
              </div>
              <div className="md:col-span-2 border-t border-zinc-100 dark:border-zinc-800 pt-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Permanent Residential Address</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1 leading-relaxed">
                  {student.address || ''} {student.city ? `, ${student.city}` : ''} {student.pincode ? ` - ${student.pincode}` : ''}
                  {!student.address && !student.city && '—'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'guardian' && (
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Parent / Guardian Name</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1">{student.parentName || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Primary contact Phone</label>
                <p className="font-medium text-blue-600 dark:text-blue-400 mt-1">{student.parentPhone || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Guardian Email Address</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1 truncate">{student.parentEmail || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Alternate Phone</label>
                <p className="font-medium text-zinc-900 dark:text-zinc-200 mt-1">{student.alternatePhone || '—'}</p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'ledger' && (
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 overflow-hidden p-4">
            <div className="flex flex-col gap-6">
              {/* Fees quick metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Total Billed (Annual)</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white mt-1 block">₹{((ledgerDuesData?.totalDue || 0) + (ledgerDuesData?.totalPaid || 0)).toLocaleString()}</span>
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-md border border-emerald-200/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider block">Fees Paid</span>
                  <span className="text-lg font-bold mt-1 block">₹{(ledgerDuesData?.totalPaid || 0).toLocaleString()}</span>
                </div>
                <div className="p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200/50 col-span-2 md:col-span-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider block">Outstanding Due</span>
                  <span className="text-lg font-bold mt-1 block">₹{(ledgerDuesData?.totalDue || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              {loadingLedger ? (
                <div className="p-8 text-center text-zinc-400"><i className="pi pi-spin pi-spinner text-2xl"></i></div>
              ) : (
                <DataTable
                  value={[
                    ...(ledgerDuesData?.outstanding || []).map((o: any) => ({
                      id: `out-${o.id}`,
                      term: o.name,
                      invoiced: o.amount,
                      date: o.createdAt,
                      method: '—',
                      status: 'DUE'
                    })),
                    ...(ledgerDuesData?.paid || []).map((p: any) => ({
                      id: `paid-${p.id}`,
                      term: p.feeStructure?.name || 'Fee Collection',
                      invoiced: p.totalAmount,
                      date: p.paidAt,
                      method: p.paymentMethod,
                      status: 'PAID'
                    }))
                  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
                  className="p-datatable-sm mt-2 text-xs"
                  stripedRows
                  emptyMessage="No fee transactions found for this student."
                >
                  <Column field="id" header="Transaction Ref" body={(d) => d.id.replace('out-', '').replace('paid-', '').substring(0,8).toUpperCase()} className="font-mono font-medium text-xs text-zinc-700 dark:text-zinc-300" />
                  <Column field="term" header="Term Particulars" className="font-medium text-zinc-900 dark:text-zinc-200" />
                  <Column field="date" header="Due / Pay Date" body={(d) => new Date(d.date).toLocaleDateString()} />
                  <Column 
                    header="Amount" 
                    body={(d) => <span className="font-medium font-mono">₹{Number(d.invoiced).toLocaleString('en-IN')}</span>} 
                  />
                  <Column field="method" header="Payment Method" />
                  <Column 
                    header="Status" 
                    body={(d) => (
                      <Tag 
                        value={d.status} 
                        severity={d.status === 'PAID' ? 'success' : 'danger'} 
                        className="font-bold text-[9px] rounded-md px-2 py-0.5" 
                      />
                    )} 
                  />
                  <Column 
                    header="Print" 
                    body={(d) => d.status === 'PAID' && (
                      <Button 
                        icon="pi pi-print" 
                        className="p-button-text p-button-sm p-1 text-blue-600 dark:text-blue-400" 
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('show-toast', {
                            detail: {
                              severity: 'success',
                              summary: 'Invoice Receipt Compiled',
                              detail: `Tax receipt generated. Printing queue initialized.`,
                              life: 3000
                            }
                          }));
                        }}
                      />
                    )} 
                    align="center"
                  />
                </DataTable>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'facilities' && (
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Transport Allocation</h3>
                {student.transport && student.transport.length > 0 ? (
                  student.transport.map((t: any) => (
                    <div key={t.id} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2"><i className="pi pi-car text-zinc-400"></i> <span className="font-medium text-zinc-900 dark:text-zinc-200">Route: {t.route?.name || 'N/A'}</span></div>
                      <div className="flex items-center gap-2"><i className="pi pi-map-marker text-zinc-400"></i> <span className="font-medium text-zinc-900 dark:text-zinc-200">Pickup: {t.pickupStop?.stopName || 'N/A'}</span></div>
                      {t.feeAmount && <div className="text-xs text-zinc-500 mt-1 font-semibold text-blue-600">Fee: ₹{t.feeAmount}</div>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-zinc-500 italic mt-1">No transport allocated.</p>
                )}
              </div>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Hostel Allocation</h3>
                {student.hostelBoarder && student.hostelBoarder.length > 0 ? (
                  student.hostelBoarder.map((h: any) => (
                    <div key={h.id} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2"><i className="pi pi-building text-zinc-400"></i> <span className="font-medium text-zinc-900 dark:text-zinc-200">Room: {h.room?.roomNumber || 'N/A'} ({h.room?.roomType || ''})</span></div>
                      <div className="flex items-center gap-2"><i className="pi pi-calendar text-zinc-400"></i> <span className="font-medium text-zinc-900 dark:text-zinc-200">Joined: {new Date(h.joinDate).toLocaleDateString()}</span></div>
                      {h.feeAmount && <div className="text-xs text-zinc-500 mt-1 font-semibold text-blue-600">Fee: ₹{h.feeAmount}</div>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-zinc-500 italic mt-1">No hostel allocated.</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'audit_logs' && (
          <Card className="shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 overflow-hidden p-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Student Academic &amp; System Activity Trail</h3>
                {!loadingActivity && (
                  <span className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {activityLog.length} {activityLog.length === 1 ? 'entry' : 'entries'}
                  </span>
                )}
              </div>

              {/* This list used to be five invented events — a biometric handshake
                  at BIO-01-MAIN, a hostel allocation, a homework submission —
                  rendered under a "Roster Auditing Active" badge for whichever
                  real, named student was open. It now reads the activity_logs
                  table through /analytics/activity-log, filtered to this
                  student, and shows nothing when there is nothing. */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
                {loadingActivity ? (
                  <p className="py-6 text-center text-xs text-zinc-500">Loading activity…</p>
                ) : activityLog.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2">
                    <i className="pi pi-inbox text-2xl text-zinc-300 dark:text-zinc-700"></i>
                    <p className="text-xs text-zinc-500">No recorded activity for this student yet.</p>
                    <p className="text-[10px] text-zinc-400 max-w-xs">
                      Entries appear here as modules write to the audit log.
                    </p>
                  </div>
                ) : (
                  activityLog.map((log: any) => (
                    <div key={log.id} className="py-3 flex justify-between items-start gap-4 text-xs font-medium">
                      <div>
                        <p className="text-zinc-900 dark:text-zinc-200">{log.action}</p>
                        <div className="flex gap-2 items-center text-[10px] text-zinc-500 mt-1">
                          <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                            {log.subject}
                          </span>
                          {log.user?.name && <span>· by {log.user.name}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
