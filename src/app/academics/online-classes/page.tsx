'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useClasses, useOnlineClasses, useCreateOnlineClass } from '@/hooks/queries/useAcademics';
import { useAuthStore } from '@/store/useAuthStore';

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
  const { activeTenant, user } = useAuthStore();
  const activeModules = activeTenant?.activeModules || [];
  
  const { data: classesData, isPending: loading } = useOnlineClasses();
  const classesList = classesData || [];
  const createMutation = useCreateOnlineClass();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeJitsiRoom, setActiveJitsiRoom] = useState<OnlineClass | null>(null);
  const [search, setSearch] = useState('');
  
  const filteredClasses = classesList.filter((c: any) => 
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
    scheduledAt: null as Date | null,
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
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'warn', summary: 'Validation', detail: 'Class, Title and Schedule date are required.', life: 3000 }
      }));
      return;
    }

    createMutation.mutate({
      classId: form.classId,
      subjectId: form.subjectId || undefined,
      title: form.title,
      description: form.description || undefined,
      scheduledAt: form.scheduledAt.toISOString(),
      duration: Number(form.duration),
    }, {
      onSuccess: () => {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: '🎓 Room Scheduled!', detail: `Online class room "${form.title}" created successfully. Jitsi link generated!`, life: 4000 }
        }));
        setShowCreateDialog(false);
        setForm({ classId: '', subjectId: '', title: '', description: '', scheduledAt: null, duration: 60 });
      }
    });
  };

  const getStatusTag = (status: OnlineClass['status']) => {
    const map = {
      LIVE: { label: 'LIVE / ACTIVE', severity: 'success' },
      SCHEDULED: { label: 'SCHEDULED', severity: 'info' },
      COMPLETED: { label: 'COMPLETED', severity: 'secondary' },
      CANCELLED: { label: 'CANCELLED', severity: 'danger' },
    };
    const s = map[status] || map.SCHEDULED;
    return <Tag value={s.label} severity={s.severity as any} className="font-extrabold text-[10px]" />;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10 animate-fade-in">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Jitsi Meet Online Classrooms</h1>
            <p className="text-slate-400 mt-1.5 text-sm md:text-base">
              Schedule premium zero-latency video lectures, track live attendance telemetry, and share records with students.
            </p>
          </div>
          <button 
            onClick={() => setShowCreateDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs"
          >
            <i className="pi pi-video"></i>
            Schedule Online Class
          </button>
        </div>

        {/* Live Classroom Embedded Frame (Overlay/View Pane) */}
        {activeJitsiRoom && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-1 flex flex-col gap-3 animate-fade-in relative z-20">
            <div className="flex justify-between items-center px-4 py-2 text-white bg-slate-900">
              <div>
                <span className="text-[10px] font-extrabold text-pink-500 uppercase tracking-widest">Live Room Active</span>
                <h3 className="font-bold text-sm">{activeJitsiRoom.title} ({activeJitsiRoom.className})</h3>
              </div>
              <button 
                onClick={() => setActiveJitsiRoom(null)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
              >
                <i className="pi pi-power-off"></i> Disconnect
              </button>
            </div>
            
            {/* Jitsi Meet Secure Embedded Sandbox Iframe */}
            <div className="w-full aspect-video md:h-[500px] bg-black relative">
              <iframe
                src={`${activeJitsiRoom.embedUrl || activeJitsiRoom.joinUrl || `https://meet.jit.si/${activeJitsiRoom.jitsiRoomName}`}#userInfo.displayName="${user?.name || 'Educator'}"`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0 rounded-2xl"
              />
            </div>
            
            <div className="flex justify-between items-center px-4 py-2 text-xs text-slate-450 font-semibold bg-slate-900/50">
              <span>Platform: meet.jit.si</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Connection secure & verified
              </span>
            </div>
          </div>
        )}

        {/* Classes List section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Active Room Rosters</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Join Room" to launch Jitsi Meet secure video stream.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms..." 
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <i className="pi pi-spin pi-spinner text-3xl text-primary"></i>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <i className="pi pi-video text-4xl mb-2"></i>
              <p className="text-sm font-bold">No Classes Found</p>
              <p className="text-xs opacity-75 mt-0.5">Try a different search term or schedule a new class.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((c: any) => (
                <div key={c.id} className="border border-slate-150 dark:border-slate-800/85 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 rounded-2xl p-5 bg-slate-50/20 dark:bg-slate-950/20 shadow-sm transition-all duration-300 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-md border border-indigo-200/30">
                        {c.subjectName || 'Study Room'}
                      </span>
                      {getStatusTag(c.status)}
                    </div>
                    
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-150 mt-1 leading-snug">{c.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{c.description || 'No class summary description provided.'}</p>
                  </div>

                  <div className="border-t border-slate-150/50 dark:border-slate-800/60 pt-4 mt-1 flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <div className="flex justify-between items-center">
                      <span>Grade:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{c.className || 'General'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Schedule:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {new Date(c.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Host Teacher:</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-40">{c.teacher?.name || 'System Faculty'}</span>
                    </div>
                  </div>

                  <div className="mt-2">
                    {c.status === 'LIVE' ? (
                      <button 
                        onClick={() => {
                          setActiveJitsiRoom(c);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 border-none text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs border-0 transition-all active:scale-[0.98]"
                      >
                        <i className="pi pi-video animate-pulse"></i> Join Classroom Now
                      </button>
                    ) : c.status === 'SCHEDULED' ? (
                      <button 
                        onClick={() => {
                          setActiveJitsiRoom(c);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs border-0 transition-all active:scale-[0.98]"
                      >
                        <i className="pi pi-external-link"></i> Launch Room
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 text-xs border-0 cursor-not-allowed"
                      >
                        <i className="pi pi-check"></i> Session Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Dialog: Schedule Class ─────────────────────────────────── */}
      <Dialog
        header="Schedule Online Jitsi Lecture"
        visible={showCreateDialog}
        style={{ width: '480px' }}
        modal
        onHide={() => setShowCreateDialog(false)}
        className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        contentClassName="p-6"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-extrabold text-slate-800 dark:text-white"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button label="Cancel" className="p-button-text p-2 font-bold text-xs" onClick={() => setShowCreateDialog(false)} />
            <Button 
              label="Schedule Room" 
              icon="pi pi-check" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-0 font-bold text-xs" 
              onClick={handleCreateClass} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class Title / Topic *</label>
            <InputText 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-sm" 
              placeholder="e.g. Advanced Trigonometry Session" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Class *</label>
              <Dropdown 
                value={form.classId} 
                options={classOptions} 
                onChange={(e) => setForm({ ...form, classId: e.value })} 
                placeholder="Select Class"
                className="border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration (Mins)</label>
              <Dropdown 
                value={form.duration} 
                options={[
                  { label: '30 Mins', value: 30 },
                  { label: '45 Mins', value: 45 },
                  { label: '60 Mins', value: 60 },
                  { label: '90 Mins', value: 90 },
                ]} 
                onChange={(e) => setForm({ ...form, duration: e.value })} 
                className="border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Schedule Time *</label>
            <Calendar
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.value as Date })}
              showTime
              hourFormat="24"
              className="w-full"
              inputClassName="p-2.5 border border-gray-250 dark:border-slate-750 dark:bg-slate-950 rounded-xl text-sm"
              placeholder="Select Date and Time"
              minDate={new Date()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lecture Agenda / Details</label>
            <InputTextarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-sm resize-none" 
              rows={3}
              placeholder="e.g. Please bring textbook and solved assignments." 
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
