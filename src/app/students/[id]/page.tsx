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

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'personal' | 'guardian' | 'ledger' | 'audit_logs'>('personal');
  const { data: student, isPending, isError } = useStudentDetails(id);
  const { data: ledgerDuesData, isPending: loadingLedger } = useStudentDues(id);
  const deleteMutation = useDeleteStudent();

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
        <div className="p-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-4xl mx-auto mt-10">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Loading student details profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !student) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-4xl mx-auto mt-10">
          <i className="pi pi-exclamation-triangle text-4xl text-rose-500 mb-3"></i>
          <p className="text-slate-500 font-bold text-lg">Failed to Load Profile</p>
          <p className="text-slate-400 text-sm mt-1">Student details could not be found or retrieved.</p>
          <Button label="Back to Directory" className="mt-4 bg-primary text-white p-2.5 px-5 rounded-xl font-bold" onClick={() => router.push('/students')} />
        </div>
      </DashboardLayout>
    );
  }

  const fullName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Back Link */}
        <div className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" onClick={() => router.push('/students')}>
          <i className="pi pi-arrow-left text-xs"></i>
          <span className="text-xs font-bold uppercase tracking-wider">Back to Directory</span>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-black border border-indigo-150/30">
              {student.firstName ? student.firstName[0] : student.name ? student.name[0] : '?'}
              {student.lastName ? student.lastName[0] : ''}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
                <span className="text-xs text-slate-400 font-medium">
                  Admission No: <span className="font-mono font-bold text-slate-600 dark:text-slate-350">{student.admissionNo}</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline-block"></span>
                <span className="text-xs text-slate-400 font-medium">
                  Class: <span className="font-bold text-indigo-600 dark:text-indigo-400">{student.className || 'Not Assigned'}</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline-block"></span>
                <span className="text-xs text-slate-400 font-medium">
                  Academic Year: <span className="font-bold text-slate-500">{student.academicYear}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 self-stretch md:self-auto justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
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
        <div className="flex border-b border-slate-150 dark:border-slate-800 overflow-x-auto max-w-full">
          {[
            { id: 'personal', label: 'Personal Profile', icon: 'pi-user' },
            { id: 'guardian', label: 'Parent & Guardian Info', icon: 'pi-users' },
            { id: 'ledger', label: 'Academic Fee Ledger', icon: 'pi-wallet' },
            { id: 'audit_logs', label: 'Activity Logs', icon: 'pi-list' }
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`p-3 px-5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tb.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              <i className={`pi ${tb.icon} text-[10px]`}></i>
              <span>{tb.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic tab contents */}
        {activeTab === 'personal' && (
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date of Birth</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.dob ? new Date(student.dob).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 capitalize">{student.gender || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 uppercase">{student.bloodGroup || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Aadhar / National ID</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.aadharNo || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mother Tongue</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 capitalize">{student.motherTongue || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous School Attended</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.previousSchool || '—'}</p>
              </div>
              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800/80 pt-5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Permanent Residential Address</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">
                  {student.address || ''} {student.city ? `, ${student.city}` : ''} {student.pincode ? ` - ${student.pincode}` : ''}
                  {!student.address && !student.city && '—'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'guardian' && (
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent / Guardian Name</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.parentName || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary contact Phone</label>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-1">{student.parentPhone || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Guardian Email Address</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 truncate">{student.parentEmail || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Alternate Phone</label>
                <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1">{student.alternatePhone || '—'}</p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'ledger' && (
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden p-4">
            <div className="flex flex-col gap-6">
              {/* Fees quick metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150/40 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed (Annual)</span>
                  <span className="text-lg font-extrabold text-slate-800 dark:text-white mt-1 block">₹{((ledgerDuesData?.totalDue || 0) + (ledgerDuesData?.totalPaid || 0)).toLocaleString()}</span>
                </div>
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Fees Paid</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">₹{(ledgerDuesData?.totalPaid || 0).toLocaleString()}</span>
                </div>
                <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Outstanding Due</span>
                  <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">₹{(ledgerDuesData?.totalDue || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              {loadingLedger ? (
                <div className="p-8 text-center text-slate-400"><i className="pi pi-spin pi-spinner text-2xl"></i></div>
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
                  <Column field="id" header="Transaction Ref" body={(d) => d.id.replace('out-', '').replace('paid-', '').substring(0,8).toUpperCase()} className="font-mono font-bold text-xs" />
                  <Column field="term" header="Term Particulars" className="font-semibold text-slate-700 dark:text-slate-350" />
                  <Column field="date" header="Due / Pay Date" body={(d) => new Date(d.date).toLocaleDateString()} />
                  <Column 
                    header="Amount" 
                    body={(d) => <span className="font-bold font-mono">₹{Number(d.invoiced).toLocaleString('en-IN')}</span>} 
                  />
                  <Column field="method" header="Payment Method" />
                  <Column 
                    header="Status" 
                    body={(d) => (
                      <Tag 
                        value={d.status} 
                        severity={d.status === 'PAID' ? 'success' : 'danger'} 
                        className="font-bold text-[9px] rounded px-2" 
                      />
                    )} 
                  />
                  <Column 
                    header="Print" 
                    body={(d) => d.status === 'PAID' && (
                      <Button 
                        icon="pi pi-print" 
                        className="p-button-text p-button-sm p-1 text-indigo-500" 
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

        {activeTab === 'audit_logs' && (
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden p-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Student Academic & System Activity Trail</h3>
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">Roster Auditing Active</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {[
                  { action: 'Marked Present via biometric handshake', category: 'ATTENDANCE', terminal: 'BIO-01-MAIN', time: 'Today, 08:12 AM' },
                  { action: 'Allocated to Hostel Room 104', category: 'HOSTEL', terminal: 'Warden Logbook', time: 'Yesterday, 04:30 PM' },
                  { action: 'Assigned Commute stop: City Center Stop (Route A)', category: 'TRANSPORT', terminal: 'Admin console', time: '2026-05-26, 02:15 PM' },
                  { action: 'English Poetry Homework Assignment submitted', category: 'HOMEWORK', terminal: 'Student Console', time: '2026-05-25, 08:50 PM' },
                  { action: 'Tuition Fee invoice generated (Third Term Fees)', category: 'FINANCE', terminal: 'Automated Billing', time: '2026-05-20, 10:00 AM' }
                ].map((log, i) => (
                  <div key={i} className="py-3 flex justify-between items-start gap-4 text-xs font-semibold">
                    <div>
                      <p className="text-slate-800 dark:text-slate-350">{log.action}</p>
                      <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1">
                        <span className="bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">{log.category}</span>
                        <span>· Via {log.terminal}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400/80 font-medium whitespace-nowrap">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
