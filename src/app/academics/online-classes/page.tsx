'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useClasses, useOnlineClasses, useCreateOnlineClass } from '@/hooks/queries/useAcademics';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Video, Plus, Search, ExternalLink, Power, CheckCircle } from 'lucide-react';

interface OnlineClass {
  id: string;
  title: string;
  description?: string;
  jitsiRoomName: string;
  jitsiPassword?: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  teacherId: string;
  teacherName?: string;
  className?: string;
  subjectName?: string;
  joinUrl?: string;
  teacherUrl?: string;
  embedUrl?: string;
}

export default function OnlineClassesPage() {
  const { user } = useAuthStore();

  const { data: classesData, isPending: loading } = useOnlineClasses();
  const classesList = classesData || [];
  const createMutation = useCreateOnlineClass();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeJitsiRoom, setActiveJitsiRoom] = useState<OnlineClass | null>(null);
  const [search, setSearch] = useState('');

  const filteredClasses = classesList.filter(
    (c: any) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.className?.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectName?.toLowerCase().includes(search.toLowerCase())
  );

  // Form state
  const [form, setForm] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
  });

  const { data: schoolClasses } = useClasses(1, 100);
  const classOptions = (schoolClasses?.items || schoolClasses?.data?.items || []).map((c: any) => ({
    label: `${c.name} — ${c.section}`,
    value: c.id,
  }));

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId || !form.title || !form.scheduledAt) {
      toast.error('Class, Title and Schedule date are required.');
      return;
    }

    createMutation.mutate(
      {
        classId: form.classId,
        subjectId: form.subjectId || undefined,
        title: form.title,
        description: form.description || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: Number(form.duration),
      },
      {
        onSuccess: () => {
          toast.success(`Online class room "${form.title}" created successfully!`);
          setShowCreateDialog(false);
          setForm({
            classId: '',
            subjectId: '',
            title: '',
            description: '',
            scheduledAt: '',
            duration: 60,
          });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to schedule class.');
        },
      }
    );
  };

  const getStatusBadge = (status: OnlineClass['status']) => {
    const map = {
      LIVE: { label: 'LIVE', variant: 'success' as const },
      SCHEDULED: { label: 'SCHEDULED', variant: 'info' as const },
      COMPLETED: { label: 'COMPLETED', variant: 'secondary' as const },
      CANCELLED: { label: 'CANCELLED', variant: 'danger' as const },
    };
    const s = map[status] || map.SCHEDULED;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Online Classes" subtitle="Academics" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Area */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Video className="w-6 h-6 text-brand" />
              Online Classrooms
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Schedule zero-latency video lectures with live attendance
            </p>
          </div>

          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Online Class
          </Button>
        </div>

        {/* Live Classroom Embedded Frame (Overlay/View Pane) */}
        {activeJitsiRoom && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-fade-in relative z-20">
            <div className="flex justify-between items-center px-4 py-3 text-white bg-zinc-900 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Room
                  Active
                </span>
                <h3 className="font-semibold text-sm mt-0.5">
                  {activeJitsiRoom.title} ({activeJitsiRoom.className})
                </h3>
              </div>
              <Button variant="danger" size="sm" onClick={() => setActiveJitsiRoom(null)}>
                <Power className="w-3.5 h-3.5 mr-1" /> Disconnect
              </Button>
            </div>

            {/* Jitsi Meet Secure Embedded Sandbox Iframe */}
            <div className="w-full aspect-video md:h-[500px] bg-black relative">
              <iframe
                src={`${activeJitsiRoom.embedUrl || activeJitsiRoom.joinUrl || `https://${process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'}/${activeJitsiRoom.jitsiRoomName}`}#userInfo.displayName="${user?.name || 'Educator'}"`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
              />
            </div>

            <div className="flex justify-between items-center px-4 py-2 text-xs text-zinc-400 font-medium bg-zinc-900 border-t border-zinc-800">
              <span>Platform: {process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'}</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                Connection secure & verified
              </span>
            </div>
          </div>
        )}

        {/* Classes List section */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Active Room Rosters
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Launch rooms for live interactive video streams.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms..."
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-zinc-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Video className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No Classes Found</p>
              <p className="text-xs mt-0.5 text-zinc-500">
                Try a different search term or schedule a new class.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((c: any) => (
                <div
                  key={c.id}
                  className="border border-zinc-200/80 dark:border-zinc-800/80 hover:border-brand/40 rounded-xl p-5 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="secondary">{c.subjectName || 'Study Room'}</Badge>
                      {getStatusBadge(c.status)}
                    </div>

                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mt-1 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {c.description || 'No class summary description provided.'}
                    </p>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-1 flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <div className="flex justify-between items-center">
                      <span>Grade:</span>
                      <span className="text-zinc-900 dark:text-zinc-300 font-semibold">
                        {c.className || 'General'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Schedule:</span>
                      <span className="text-zinc-900 dark:text-zinc-300">
                        {new Date(c.scheduledAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        at{' '}
                        {new Date(c.scheduledAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Host Teacher:</span>
                      <span className="text-zinc-900 dark:text-zinc-300 truncate max-w-40">
                        {c.teacher?.name || 'System Faculty'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    {c.status === 'LIVE' ? (
                      <Button
                        variant="gradient"
                        className="w-full"
                        onClick={() => {
                          setActiveJitsiRoom(c);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Video className="w-4 h-4 mr-2" /> Join Classroom Now
                      </Button>
                    ) : c.status === 'SCHEDULED' ? (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => {
                          setActiveJitsiRoom(c);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" /> Launch Room
                      </Button>
                    ) : (
                      <Button disabled variant="ghost" className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2 text-zinc-400" /> Session Completed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Class Dialog */}
      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Schedule Online Lecture"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Class Title / Topic *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Advanced Trigonometry Session"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Target Class *
              </label>
              <Select
                value={form.classId}
                options={[{ label: 'Select Class', value: '' }, ...classOptions]}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Duration (Mins)
              </label>
              <Select
                value={form.duration.toString()}
                options={[
                  { label: '30 Mins', value: '30' },
                  { label: '45 Mins', value: '45' },
                  { label: '60 Mins', value: '60' },
                  { label: '90 Mins', value: '90' },
                ]}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Schedule Date & Time *
            </label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Lecture Agenda / Details
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
              rows={3}
              placeholder="e.g. Please bring textbook and solved assignments."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateClass} isLoading={createMutation.isPending}>
            Schedule Room
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
