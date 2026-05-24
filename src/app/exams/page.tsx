'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { useExamsList, useCreateExam, useAutoAssignSeating, useSeatingChart } from '@/hooks/queries/useExams';
import { useClasses } from '@/hooks/queries/useAcademics';

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSeatingDialog, setShowSeatingDialog] = useState(false);
  
  // States
  const [newExam, setNewExam] = useState({ name: '', classId: '', startDate: '', endDate: '' });
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Queries
  const { data: exams, isPending: loadingExams } = useExamsList();
  const { data: classes } = useClasses(1, 100);
  const { data: seatingChart, isPending: loadingSeating } = useSeatingChart(selectedExamId);

  const createMutation = useCreateExam();
  const autoAssignMutation = useAutoAssignSeating();

  const handleCreateExam = () => {
    createMutation.mutate(newExam, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewExam({ name: '', classId: '', startDate: '', endDate: '' });
      }
    });
  };

  const handleAutoAssign = () => {
    autoAssignMutation.mutate({ examId: selectedExamId, classIds: selectedClassIds }, {
      onSuccess: () => {
        setShowSeatingDialog(false);
        setSelectedClassIds([]);
      }
    });
  };

  const statusBodyTemplate = (rowData: any) => {
    const status = rowData.status || 'DRAFT';
    return <Tag value={status} severity={status === 'COMPLETED' ? 'success' : status === 'PUBLISHED' ? 'info' : 'warning'} />;
  };

  const classOptions = classes?.data?.items?.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })) || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exams & Results</h1>
            <p className="text-gray-500 mt-1">Manage exam calendars, classroom rankings, and print student hall tickets.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              label="Schedule Exam" 
              icon="pi pi-calendar-plus" 
              className="bg-primary text-white p-2 px-4" 
              onClick={() => setShowAddDialog(true)} 
            />
            <Button 
              label="Assign Seatings" 
              icon="pi pi-sitemap" 
              className="p-button-secondary bg-slate-700 text-white p-2 px-4" 
              onClick={() => {
                if (exams?.data?.length) {
                  setSelectedExamId(exams.data[0].id);
                }
                setShowSeatingDialog(true);
              }} 
            />
          </div>
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            <TabPanel header="Active Exams">
              <DataTable 
                value={exams?.data || []} 
                loading={loadingExams} 
                className="p-datatable-sm mt-3" 
                emptyMessage="No exams scheduled yet."
              >
                <Column field="name" header="Exam Name"></Column>
                <Column field="className" header="Class" body={(data) => data.className || 'All Classes'}></Column>
                <Column field="startDate" header="Starts On"></Column>
                <Column field="endDate" header="Ends On"></Column>
                <Column field="status" header="Status" body={statusBodyTemplate}></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Seating Arrangements">
              <div className="flex items-center gap-3 mb-4 mt-3">
                <label className="font-semibold text-gray-700">Select Scheduled Exam:</label>
                <Dropdown 
                  value={selectedExamId} 
                  options={exams?.data?.map((e: any) => ({ label: e.name, value: e.id })) || []} 
                  onChange={(e) => setSelectedExamId(e.value)} 
                  placeholder="Select Scheduled Exam"
                  className="border border-gray-200 rounded-md"
                />
              </div>

              <DataTable 
                value={seatingChart || []} 
                loading={loadingSeating} 
                className="p-datatable-sm" 
                emptyMessage="Select an exam to view seating plans, or trigger seating auto-assignment."
              >
                <Column field="studentName" header="Student Name"></Column>
                <Column field="admissionNo" header="Roll No."></Column>
                <Column field="hallName" header="Exam Hall"></Column>
                <Column field="seatNo" header="Seat Number"></Column>
              </DataTable>
            </TabPanel>

          </TabView>
        </Card>

        {/* Dialog: Schedule Exam */}
        <Dialog 
          header="Schedule New Exam" 
          visible={showAddDialog} 
          style={{ width: '400px' }} 
          modal 
          onHide={() => setShowAddDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowAddDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Schedule" 
                icon="pi pi-check" 
                onClick={handleCreateExam} 
                loading={createMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Exam Term Name</label>
              <InputText 
                value={newExam.name} 
                onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} 
                placeholder="e.g. Mid-Term 2026, Annual Exam"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Target Class</label>
              <Dropdown 
                value={newExam.classId} 
                options={classOptions} 
                onChange={(e) => setNewExam({ ...newExam, classId: e.value })} 
                placeholder="Select Class"
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
              <Calendar 
                value={newExam.startDate ? new Date(newExam.startDate) : null} 
                onChange={(e) => setNewExam({ ...newExam, startDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
                dateFormat="yy-mm-dd"
                showIcon
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">End Date</label>
              <Calendar 
                value={newExam.endDate ? new Date(newExam.endDate) : null} 
                onChange={(e) => setNewExam({ ...newExam, endDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
                dateFormat="yy-mm-dd"
                showIcon
                className="border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Dialog>

        {/* Dialog: Assign Seating */}
        <Dialog 
          header="Auto-Allocate Seating Chart" 
          visible={showSeatingDialog} 
          style={{ width: '400px' }} 
          modal 
          onHide={() => setShowSeatingDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowSeatingDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Assign" 
                icon="pi pi-check" 
                onClick={handleAutoAssign} 
                loading={autoAssignMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Select Exam</label>
              <Dropdown 
                value={selectedExamId} 
                options={exams?.data?.map((e: any) => ({ label: e.name, value: e.id })) || []} 
                onChange={(e) => setSelectedExamId(e.value)} 
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Select Class (Hold Ctrl for multiple)</label>
              <select 
                multiple 
                className="w-full p-2 border border-gray-200 rounded-md h-32"
                value={selectedClassIds}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedClassIds(options);
                }}
              >
                {classOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
