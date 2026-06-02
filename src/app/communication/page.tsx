'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { useAnnouncements, useCreateAnnouncement, useEvents, useCreateEvent } from '@/hooks/queries/useCommunication';

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showAnnounceDialog, setShowAnnounceDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  const activeAnnouncements = announcements?.data?.items || [];
  const totalAnnouncements = announcements?.data?.meta?.total || 0;
  const activeEvents = (events as any)?.data || events || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">School Communication</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Broadcast critical bulletins, publish announcement newsletters, and schedule calendar events.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setShowAnnounceDialog(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2 cursor-pointer"
            >
              <i className="pi pi-megaphone"></i>
              Post Broadcast
            </button>
            <button 
              onClick={() => setShowEventDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2 cursor-pointer border-none"
            >
              <i className="pi pi-calendar-plus"></i>
              Schedule Event
            </button>
          </div>
        </div>

        {/* View mode bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Grid Cards"
          >
            <i className="pi pi-th-large text-lg"></i>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'table' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Tabular View"
          >
            <i className="pi pi-list text-lg"></i>
          </button>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <style>{`
            .p-tabview, .p-tabview-nav, .p-tabview-panels, .p-datatable, .p-datatable-wrapper, .p-paginator {
              background: transparent !important;
            }
            .p-datatable-thead > tr > th, .p-datatable-tbody > tr, .p-datatable-tbody > tr > td {
              background: transparent !important;
            }
            .p-tabview-nav li .p-tabview-nav-link {
              background: transparent !important;
            }
          `}</style>
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            {/* Announcements Panel */}
            <TabPanel header="Announcements Bulletin">
              <div className="p-4">
                {loadingAnnouncements ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading bulletins...</span>
                  </div>
                ) : activeAnnouncements.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No announcements posted yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {activeAnnouncements.map((bulletin: any) => (
                      <div 
                        key={bulletin.id} 
                        className="border border-slate-100 dark:border-slate-800 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-extrabold text-slate-850 dark:text-white text-base leading-snug">{bulletin.title}</h3>
                            <span className="text-[9px] text-indigo-650 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/40 p-1 px-2.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/20 shrink-0">
                              {bulletin.createdAt ? new Date(bulletin.createdAt).toLocaleDateString() : 'Today'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{bulletin.content}</p>
                        </div>
                        <div className="flex items-center gap-2 border-t border-slate-100/50 dark:border-slate-800/40 pt-3 mt-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[8px]">
                            {bulletin.authorName ? bulletin.authorName[0].toUpperCase() : 'A'}
                          </div>
                          <span>Posted by {bulletin.authorName || 'School Admin'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable 
                    value={activeAnnouncements} 
                    lazy 
                    paginator 
                    first={lazyState.first}
                    rows={lazyState.rows}
                    totalRecords={totalAnnouncements}
                    onPage={onPage}
                    loading={loadingAnnouncements} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="title" header="Title" className="font-semibold text-slate-850 dark:text-white"></Column>
                    <Column field="content" header="Message Copy"></Column>
                    <Column field="createdAt" header="Date Broadcasted" body={(d) => d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}></Column>
                    <Column field="authorName" header="Author" body={(data) => data.authorName || 'School Admin'}></Column>
                  </DataTable>
                )}
              </div>
            </TabPanel>

            {/* School Events Panel */}
            <TabPanel header="Calendar Events">
              <div className="p-4">
                {loadingEvents ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading events calendar...</span>
                  </div>
                ) : activeEvents.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No events scheduled.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {activeEvents.map((evt: any) => (
                      <div 
                        key={evt.id} 
                        className="border border-slate-105 dark:border-slate-800 p-5 rounded-3xl bg-slate-50/30 dark:bg-slate-900/40 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-650 flex items-center justify-center border border-indigo-500/20">
                              <i className="pi pi-calendar text-xs animate-pulse"></i>
                            </div>
                            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm leading-snug">{evt.title}</h3>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-450 mt-2.5 leading-relaxed">{evt.description || 'No description provided.'}</p>
                        </div>

                        <div className="bg-slate-100/50 dark:bg-slate-850 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex flex-col gap-1.5 border border-slate-150/40 text-slate-400 mt-4">
                          <div className="flex justify-between">
                            <span>Start:</span>
                            <span className="text-slate-800 dark:text-slate-300">{evt.startDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ends:</span>
                            <span className="text-slate-800 dark:text-slate-300">{evt.endDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable 
                    value={activeEvents} 
                    loading={loadingEvents} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="title" header="Event Title" className="font-semibold text-slate-800 dark:text-white"></Column>
                    <Column field="description" header="Description"></Column>
                    <Column field="startDate" header="Starts On" sortable></Column>
                    <Column field="endDate" header="Ends On" sortable></Column>
                  </DataTable>
                )}
              </div>
            </TabPanel>

          </TabView>
        </div>

      </div>

      {/* Dialog: Add Announcement */}
      <Dialog 
        header="Publish Announcement Bulletin" 
        visible={showAnnounceDialog} 
        style={{ width: '450px' }} 
        modal 
        onHide={() => setShowAnnounceDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAnnounceDialog(false)} />
            <Button 
              label="Post Broadcast" 
              icon="pi pi-send" 
              onClick={handleCreateAnnouncement} 
              loading={createAnnounceMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-none cursor-pointer" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Announcement Title *</label>
            <InputText 
              value={newAnnouncement.title} 
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
              placeholder="e.g. Summer Vacation Holidays Notice"
              className="p-3 border border-gray-255 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Message Content *</label>
            <InputTextarea 
              value={newAnnouncement.content} 
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} 
              placeholder="Write bulletin broadcast message details..."
              rows={5}
              className="p-3 border border-gray-255 dark:border-slate-700 dark:bg-slate-955 rounded-xl w-full outline-none focus:ring-1 focus:ring-indigo-500"
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
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowEventDialog(false)} />
            <Button 
              label="Schedule Event" 
              icon="pi pi-check" 
              onClick={handleCreateEvent} 
              loading={createEventMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-none cursor-pointer" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Title *</label>
            <InputText 
              value={newEvent.title} 
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} 
              placeholder="e.g. Annual Science Exhibition 2026"
              className="p-3 border border-gray-255 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Description</label>
            <InputTextarea 
              value={newEvent.description} 
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} 
              placeholder="Detail coordinates, venues, guidelines..."
              rows={3}
              className="p-3 border border-gray-255 dark:border-slate-700 dark:bg-slate-955 rounded-xl w-full outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Date *</label>
            <Calendar 
              value={newEvent.startDate ? new Date(newEvent.startDate) : null} 
              onChange={(e) => setNewEvent({ ...newEvent, startDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
              dateFormat="yy-mm-dd"
              showIcon
              className="border border-gray-200 dark:border-slate-700 dark:bg-slate-955 rounded-xl w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Date *</label>
            <Calendar 
              value={newEvent.endDate ? new Date(newEvent.endDate) : null} 
              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
              dateFormat="yy-mm-dd"
              showIcon
              className="border border-gray-200 dark:border-slate-700 dark:bg-slate-955 rounded-xl w-full"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
