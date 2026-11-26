'use client';

import { asList } from '@/lib/utils';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useOnlineClasses,
  useCreateOnlineClass,
  useStartOnlineClass,
  useEndOnlineClass,
  useOnlineClassDetail,
  useMarkOnlineClassAttendance,
  useSubjects,
} from '@/hooks/queries/useAcademics';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { PermissionGate } from '@/components/ui/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore';
import { apiMessage } from '@/lib/apiMessage';
import { toast } from 'sonner';
import {
  Video,
  Plus,
  Search,
  ExternalLink,
  Power,
  CheckCircle,
  Play,
  Square,
  ClipboardCheck,
} from 'lucide-react';

type Status = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

const blankForm = () => ({
  classId: '',
  subjectId: '',
  title: '',
  description: '',
  scheduledAt: '',
  duration: 60,
});

/** Adds the display name to a Jitsi URL that may already carry a #config fragment. */
function withDisplayName(url: string, name: string) {
  const info = `userInfo.displayName=${encodeURIComponent(JSON.stringify(name))}`;
  return url.includes('#') ? `${url}&${info}` : `${url}#${info}`;
}

export default function OnlineClassesPage() {
  const activeUser = useAuthStore((s) => s.activeUser);
  const myId = activeUser?.id ?? '';
  const { isAdmin } = usePermissions();

  const { data: classesData, isPending: loading, isError, error } = useOnlineClasses();
  const { classes, isTeacher } = useScopedClasses();
  const allowedClassIds = useMemo(() => new Set(classes.map((c) => c.id)), [classes]);
  const classesList = useMemo(
    () => asList<any>(classesData).filter((c) => !isTeacher || allowedClassIds.has(c.classId)),
    [classesData, isTeacher, allowedClassIds]
  );

  const createMutation = useCreateOnlineClass();
  const startMutation = useStartOnlineClass();
  const endMutation = useEndOnlineClass();
  const attendanceMutation = useMarkOnlineClassAttendance();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(blankForm());
  const { data: classSubjects = [], isLoading: loadingSubjects } = useSubjects(form.classId);
  const [endTarget, setEndTarget] = useState<any | null>(null);

  const classOptions = classes.map((c) => ({ label: c.label, value: c.id }));

  const filteredClasses = classesList.filter(
    (c: any) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.class?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.subject?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId || !form.title.trim() || !form.scheduledAt) {
      toast.error('Class, Title and Schedule date are required.');
      return;
    }
    createMutation.mutate(
      {
        classId: form.classId,
        subjectId: form.subjectId || undefined,
        title: form.title.trim(),
        description: form.description || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: Number(form.duration),
      },
      {
        onSuccess: () => {
          toast.success(`Online class "${form.title}" scheduled.`);
          setShowCreateDialog(false);
          setForm(blankForm());
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to schedule class.')),
      }
    );
  };

  const handleStart = (c: any) => {
    startMutation.mutate(c.id, {
      onSuccess: () => toast.success('Class is now live.'),
      onError: (err) => toast.error(apiMessage(err, 'Could not start the class.')),
    });
  };

  const confirmEnd = () => {
    if (!endTarget) return;
    endMutation.mutate(endTarget.id, {
      onSuccess: () => {
        toast.success('Class ended and attendance synced.');
        if (activeRoom?.id === endTarget.id) setActiveRoom(null);
        setEndTarget(null);
      },
      onError: (err) => toast.error(apiMessage(err, 'Could not end the class.')),
    });
  };

  const roomUrl = (c: any) => {
    const host = c.teacherId === myId;
    return (host && c.teacherUrl) || c.joinUrl || '';
  };

  const launch = (c: any) => {
    const url = roomUrl(c);
    if (!url) {
      toast.error('The server did not return a room link for this class.');
      return;
    }
    setActiveRoom(c);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status: Status) => {
    const map = {
      LIVE: { label: 'LIVE', variant: 'success' as const },
      SCHEDULED: { label: 'SCHEDULED', variant: 'info' as const },
      COMPLETED: { label: 'COMPLETED', variant: 'secondary' as const },
      CANCELLED: { label: 'CANCELLED', variant: 'danger' as const },
    };
    const s = map[status] || map.SCHEDULED;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  // ── Attendance dialog ──────────────────────────────────────
  const [attendanceFor, setAttendanceFor] = useState<any | null>(null);
  const { data: attendanceDetail } = useOnlineClassDetail(attendanceFor?.id);
  const { data: rosterRaw, isPending: loadingRoster } = useStudentsList(
    1,
    100,
    undefined,
    attendanceFor?.classId
  );
  const roster = asList<any>(rosterRaw);
  const [attDraft, setAttDraft] = useState<Record<string, { present: boolean; minutes: string }>>(
    {}
  );

  useEffect(() => {
    if (!attendanceFor) return;
    const d: Record<string, { present: boolean; minutes: string }> = {};
    for (const s of roster)
      d[s.id] = { present: false, minutes: String(attendanceFor.duration ?? 60) };
    for (const a of (attendanceDetail as any)?.attendance ?? []) {
      if (d[a.studentId])
        d[a.studentId] = {
          present: !!a.isPresent,
          minutes: String(Math.round((a.duration ?? 0) / 60)),
        };
    }
    setAttDraft(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    attendanceFor?.id,
    roster.map((s) => s.id).join(','),
    JSON.stringify((attendanceDetail as any)?.attendance ?? []),
  ]);

  const saveAttendance = () => {
    if (!attendanceFor) return;
    const records = roster.map((s) => {
      const d = attDraft[s.id] ?? { present: false, minutes: '0' };
      const minutes = d.present ? Math.max(Number(d.minutes) || 0, 10) : 0;
      return { studentId: s.id, duration: minutes * 60 };
    });
    attendanceMutation.mutate(
      { id: attendanceFor.id, records },
      {
        onSuccess: () => {
          toast.success('Attendance saved and synced to the class register.');
          setAttendanceFor(null);
        },
        onError: (err) => toast.error(apiMessage(err, 'Failed to save attendance.')),
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Online Classes" subtitle="Academics" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-page-title flex items-center gap-2">
              <Video className="w-6 h-6 text-brand" />
              Online Classrooms
            </h1>
            <p className="text-sm text-muted-foreground">
              Schedule video lectures and mark live attendance
            </p>
          </div>

          <PermissionGate roles={['school_admin', 'teacher']}>
            <Button onClick={() => setShowCreateDialog(true)} disabled={classes.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Online Class
            </Button>
          </PermissionGate>
        </div>

        {activeRoom && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-fade-in relative z-20">
            <div className="flex justify-between items-center px-4 py-3 text-white bg-zinc-900 border-b border-zinc-800 gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Room{' '}
                  {activeRoom.status === 'LIVE' ? 'live' : 'open'}
                </span>
                <h3 className="font-semibold text-sm mt-0.5">
                  {activeRoom.title} ({activeRoom.class?.name} {activeRoom.class?.section})
                </h3>
              </div>
              <div className="flex gap-2">
                <a
                  href={roomUrl(activeRoom)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                </a>
                <Button variant="danger" size="sm" onClick={() => setActiveRoom(null)}>
                  <Power className="w-3.5 h-3.5 mr-1" /> Disconnect
                </Button>
              </div>
            </div>
            <div className="w-full aspect-video md:h-[500px] bg-black relative">
              <iframe
                title="Online class room"
                src={withDisplayName(roomUrl(activeRoom), activeUser?.name || 'Educator')}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        <div className="surface-card p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Classrooms</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hosts start and end their own classes; ending a class syncs attendance.
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
            <div className="flex justify-center items-center py-20 text-muted-foreground text-sm">
              Loading classes...
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-sm text-rose-600">
              {apiMessage(error, 'Could not load online classes.')}
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Video className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No Classes Found</p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                Try a different search term or schedule a new class.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((c: any) => {
                const isHost = c.teacherId === myId;
                return (
                  <div
                    key={c.id}
                    className="border border-zinc-200/80 dark:border-zinc-800/80 hover:border-brand/40 rounded-xl p-5 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <Badge variant="secondary">{c.subject?.name || 'Study Room'}</Badge>
                        {getStatusBadge(c.status)}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mt-1 leading-snug">
                        {c.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {c.description || 'No class summary description provided.'}
                      </p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-1 flex flex-col gap-2 text-xs text-muted-foreground font-medium">
                      <div className="flex justify-between items-center">
                        <span>Class:</span>
                        <span className="text-zinc-900 dark:text-zinc-300 font-semibold">
                          {c.class ? `${c.class.name} ${c.class.section ?? ''}` : 'General'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Schedule:</span>
                        <span className="text-zinc-900 dark:text-zinc-300">
                          {new Date(c.scheduledAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {c.duration} min
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Present so far:</span>
                        <span className="text-zinc-900 dark:text-zinc-300">
                          {c._count?.attendance ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-col gap-2">
                      {c.status === 'SCHEDULED' && (
                        <>
                          {isHost && (
                            <Button
                              variant="gradient"
                              className="w-full"
                              onClick={() => handleStart(c)}
                              isLoading={
                                startMutation.isPending && startMutation.variables === c.id
                              }
                            >
                              <Play className="w-4 h-4 mr-2" /> Start Class
                            </Button>
                          )}
                          <Button variant="outline" className="w-full" onClick={() => launch(c)}>
                            <ExternalLink className="w-4 h-4 mr-2" /> Launch Room
                          </Button>
                        </>
                      )}
                      {c.status === 'LIVE' && (
                        <>
                          <Button variant="gradient" className="w-full" onClick={() => launch(c)}>
                            <Video className="w-4 h-4 mr-2" /> Join Classroom Now
                          </Button>
                          {isHost && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setEndTarget(c)}
                            >
                              <Square className="w-4 h-4 mr-2" /> End Class
                            </Button>
                          )}
                        </>
                      )}
                      {(c.status === 'LIVE' || c.status === 'COMPLETED') && (isHost || isAdmin) && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setAttendanceFor(c)}
                        >
                          <ClipboardCheck className="w-4 h-4 mr-2" /> Attendance
                        </Button>
                      )}
                      {c.status === 'COMPLETED' && (
                        <Button disabled variant="ghost" className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2 text-zinc-400" /> Session Completed
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule */}
      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Schedule Online Lecture"
      >
        <form onSubmit={handleCreateClass} className="flex flex-col gap-4 py-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Target Class *
              </label>
              <Select
                value={form.classId}
                options={[{ label: 'Select Class', value: '' }, ...classOptions]}
                onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: '' })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subject
              </label>
              <Select
                value={form.subjectId}
                disabled={!form.classId || loadingSubjects}
                options={[
                  { label: !form.classId ? 'Pick a class first' : 'Any / none', value: '' },
                  ...(classSubjects as any[]).map((s) => ({ label: s.name, value: s.id })),
                ]}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                Duration
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
              Lecture Agenda / Details
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
              rows={3}
              placeholder="e.g. Please bring textbook and solved assignments."
            />
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Schedule Room
            </Button>
          </div>
        </form>
      </Dialog>

      {/* End confirm */}
      <Dialog isOpen={!!endTarget} onClose={() => setEndTarget(null)} title="End Class">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            End <b>{endTarget?.title}</b>? Recorded attendance will be synced to the class register.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEndTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmEnd} isLoading={endMutation.isPending}>
              End Class
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Attendance */}
      <Dialog
        isOpen={!!attendanceFor}
        onClose={() => setAttendanceFor(null)}
        title={attendanceFor ? `Attendance - ${attendanceFor.title}` : 'Attendance'}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Mark who attended and for how many minutes. Students present for 10 minutes or more
            count as present in the class register.
          </p>
          {loadingRoster ? (
            <p className="text-sm text-muted-foreground">Loading students...</p>
          ) : roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students in this class.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2 pr-3">Student</th>
                    <th className="py-2 pr-3">Present</th>
                    <th className="py-2">Minutes attended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {roster.map((s: any) => {
                    const d = attDraft[s.id] ?? { present: false, minutes: '0' };
                    return (
                      <tr key={s.id}>
                        <td className="py-2 pr-3 font-semibold">{s.name}</td>
                        <td className="py-2 pr-3">
                          <input
                            type="checkbox"
                            checked={d.present}
                            onChange={(e) =>
                              setAttDraft((p) => ({
                                ...p,
                                [s.id]: { ...d, present: e.target.checked },
                              }))
                            }
                          />
                        </td>
                        <td className="py-2">
                          <Input
                            type="number"
                            min={0}
                            disabled={!d.present}
                            className="h-9 w-24"
                            value={d.minutes}
                            onChange={(e) =>
                              setAttDraft((p) => ({
                                ...p,
                                [s.id]: { ...d, minutes: e.target.value },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setAttendanceFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveAttendance}
              isLoading={attendanceMutation.isPending}
              disabled={roster.length === 0}
            >
              Save Attendance
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
