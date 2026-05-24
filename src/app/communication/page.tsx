'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { useAnnouncements, useCreateAnnouncement, useEvents, useCreateEvent, useDeleteAnnouncement, useDeleteEvent } from '@/hooks/queries/useCommunication';

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showAnnounceDialog, setShowAnnounceDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', startDate: '', endDate: '' });

  // Pagination states
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });

  // Queries
  const { data: announcements, isPending: loadingAnnouncements } = useAnnouncements(lazyState.page, lazyState.rows);
  const { data: events, isPending: loadingEvents } = useEvents();

  const createAnnounceMutation = useCreateAnnouncement();
  const createEventMutation = useCreateEvent();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    }));
  };

  const handleCreateAnnouncement = () => {
    createAnnounceMutation.mutate(newAnnouncement, {
      onSuccess: () => {
        setShowAnnounceDialog(false);
        setNewAnnouncement({ title: '', content: '' });
      }
    });
  };

  const handleCreateEvent = () => {
    createEventMutation.mutate(newEvent, {
      onSuccess: () => {
        setShowEventDialog(false);
        setNewEvent({ title: '', description: '', startDate: '', endDate: '' });
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Communication</h1>
            <p className="text-gray-500 mt-1">Broadcast urgent announcements and post public events onto parent portals.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              label="Post Announcement" 
              icon="pi pi-megaphone" 
              className="bg-primary text-white p-2 px-4" 
              onClick={() => setShowAnnounceDialog(true)} 
            />
            <Button 
              label="Schedule Event" 
              icon="pi pi-calendar-plus" 
              className="p-button-secondary bg-slate-700 text-white p-2 px-4" 
              onClick={() => setShowEventDialog(true)} 
            />
          </div>
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            <TabPanel header="Announcements Board">
              <DataTable 
                value={announcements?.data?.items || []} 
                lazy 
                paginator 
                first={lazyState.first}
                rows={lazyState.rows}
                totalRecords={announcements?.data?.meta.total || 0}
                onPage={onPage}
                loading={loadingAnnouncements} 
                className="p-datatable-sm mt-3" 
                emptyMessage="No announcements posted."
              >
                <Column field="title" header="Announcement Title" className="font-semibold text-gray-950 dark:text-white"></Column>
                <Column field="content" header="Content"></Column>
                <Column field="createdAt" header="Date Posted"></Column>
                <Column field="authorName" header="Posted By" body={(data) => data.authorName || 'Admin'}></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="School Events">
              <DataTable 
                value={events?.data || []} 
                loading={loadingEvents} 
                className="p-datatable-sm mt-3" 
                emptyMessage="No calendar events scheduled."
              >
                <Column field="title" header="Event Title"></Column>
                <Column field="description" header="Description"></Column>
                <Column field="startDate" header="Starts On"></Column>
                <Column field="endDate" header="Ends On"></Column>
              </DataTable>
            </TabPanel>

          </TabView>
        </Card>

        {/* Dialog: Add Announcement */}
        <Dialog 
          header="Publish Announcement" 
          visible={showAnnounceDialog} 
          style={{ width: '450px' }} 
          modal 
          onHide={() => setShowAnnounceDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowAnnounceDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Post" 
                icon="pi pi-send" 
                onClick={handleCreateAnnouncement} 
                loading={createAnnounceMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Title</label>
              <InputText 
                value={newAnnouncement.title} 
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
                placeholder="e.g. Summer Vacation Holidays Notice"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Message Content</label>
              <InputTextarea 
                value={newAnnouncement.content} 
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} 
                placeholder="Write message copy here..."
                rows={5}
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Dialog>

        {/* Dialog: Add Event */}
        <Dialog 
          header="Schedule Calendar Event" 
          visible={showEventDialog} 
          style={{ width: '400px' }} 
          modal 
          onHide={() => setShowEventDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowEventDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Schedule" 
                icon="pi pi-check" 
                onClick={handleCreateEvent} 
                loading={createEventMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Event Title</label>
              <InputText 
                value={newEvent.title} 
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} 
                placeholder="e.g. Annual Science Exhibition 2026"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Event Description</label>
              <InputTextarea 
                value={newEvent.description} 
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} 
                placeholder="Detail of coordinates, guidelines..."
                rows={3}
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
              <Calendar 
                value={newEvent.startDate ? new Date(newEvent.startDate) : null} 
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
                dateFormat="yy-mm-dd"
                showIcon
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">End Date</label>
              <Calendar 
                value={newEvent.endDate ? new Date(newEvent.endDate) : null} 
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
                dateFormat="yy-mm-dd"
                showIcon
                className="border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
