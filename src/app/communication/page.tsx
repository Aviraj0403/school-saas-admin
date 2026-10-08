'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useAnnouncements,
  useCreateAnnouncement,
  useEvents,
  useCreateEvent,
} from '@/hooks/queries/useCommunication';
import { toast } from 'sonner';
import {
  Megaphone,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Plus,
  Send,
  Clock,
  User,
} from 'lucide-react';

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');
  const [showAnnounceDialog, setShowAnnounceDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;

  // Queries
  const { data: announcements, isPending: loadingAnnouncements } = useAnnouncements(page, limit);
  const { data: events, isPending: loadingEvents } = useEvents();

  const createAnnounceMutation = useCreateAnnouncement();
  const createEventMutation = useCreateEvent();

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Title and message content are required.');
      return;
    }
    createAnnounceMutation.mutate(newAnnouncement, {
      onSuccess: () => {
        setShowAnnounceDialog(false);
        setNewAnnouncement({ title: '', content: '' });
        toast.success('Announcement broadcast published successfully.');
      },
      onError: () => toast.error('Failed to post announcement.'),
    });
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.startDate) {
      toast.error('Title and start date are required.');
      return;
    }
    createEventMutation.mutate(newEvent, {
      onSuccess: () => {
        setShowEventDialog(false);
        setNewEvent({ title: '', description: '', startDate: '', endDate: '' });
        toast.success('Event scheduled successfully.');
      },
      onError: () => toast.error('Failed to schedule event.'),
    });
  };

  const activeAnnouncements = announcements?.data?.items || [];
  const activeEvents = (events as any)?.data || events || [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Communication" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-brand" />
              School Communication
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Broadcast bulletins, announcements, and school events
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowAnnounceDialog(true)}>
              <Megaphone className="w-4 h-4 mr-2" />
              Post Broadcast
            </Button>
            <Button onClick={() => setShowEventDialog(true)}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Event
            </Button>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex justify-between items-center flex-wrap gap-4 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
                activeTab === 'announcements'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-brand" /> Bulletins & Announcements
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
                activeTab === 'events'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" /> Calendar Events
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
              title="Grid View"
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
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
          {activeTab === 'announcements' && (
            <div>
              {loadingAnnouncements ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent" />
                  <span className="text-xs text-zinc-500">Loading bulletins...</span>
                </div>
              ) : activeAnnouncements.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                  No announcements posted yet.
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeAnnouncements.map((bulletin: any) => (
                    <div
                      key={bulletin.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                            {bulletin.title}
                          </h3>
                          <Badge variant="secondary">
                            {bulletin.createdAt
                              ? new Date(bulletin.createdAt).toLocaleDateString()
                              : 'Today'}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {bulletin.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-400 font-medium">
                        <User className="w-3.5 h-3.5 text-brand" />
                        <span>Posted by {bulletin.authorName || 'School Admin'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Message Content</th>
                        <th className="px-6 py-4">Date Broadcasted</th>
                        <th className="px-6 py-4">Author</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeAnnouncements.map((bulletin: any) => (
                        <tr
                          key={bulletin.id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            {bulletin.title}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-md truncate">
                            {bulletin.content}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {bulletin.createdAt
                              ? new Date(bulletin.createdAt).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                            {bulletin.authorName || 'School Admin'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              {loadingEvents ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent" />
                  <span className="text-xs text-zinc-500">Loading events calendar...</span>
                </div>
              ) : activeEvents.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                  No events scheduled.
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeEvents.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {evt.title}
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 leading-relaxed">
                          {evt.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs font-medium flex flex-col gap-1.5 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                        <div className="flex justify-between">
                          <span>Starts:</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                            {evt.startDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ends:</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                            {evt.endDate || evt.startDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4">Event Title</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Starts On</th>
                        <th className="px-6 py-4">Ends On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeEvents.map((evt: any) => (
                        <tr
                          key={evt.id}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            {evt.title}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-md truncate">
                            {evt.description || '-'}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {evt.startDate}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {evt.endDate || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Add Announcement */}
      <Dialog
        isOpen={showAnnounceDialog}
        onClose={() => setShowAnnounceDialog(false)}
        title="Publish Announcement Bulletin"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Announcement Title *
            </label>
            <Input
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              placeholder="e.g. Summer Vacation Holidays Notice"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Message Content *
            </label>
            <textarea
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              placeholder="Write bulletin broadcast message details..."
              rows={5}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAnnounceDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateAnnouncement} isLoading={createAnnounceMutation.isPending}>
            <Send className="w-4 h-4 mr-2" /> Post Broadcast
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Add Event */}
      <Dialog
        isOpen={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        title="Schedule Calendar Event"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Event Title *
            </label>
            <Input
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="e.g. Annual Science Exhibition 2026"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Event Description
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Detail coordinates, venues, guidelines..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Start Date *
              </label>
              <Input
                type="date"
                value={newEvent.startDate}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                End Date
              </label>
              <Input
                type="date"
                value={newEvent.endDate}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowEventDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateEvent} isLoading={createEventMutation.isPending}>
            Schedule Event
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
