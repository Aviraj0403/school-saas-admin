'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
}

interface Download {
  id: string;
  title: string;
  category: string;
  fileSize: string;
  downloadCount: number;
  isPublic: boolean;
}

interface Inquiry {
  id: string;
  studentName: string;
  applyingClass: string;
  parentName: string;
  parentPhone: string;
  status: 'PENDING' | 'CONTACTED' | 'ADMITTED' | 'REJECTED';
  followUpDate: string;
}

export default function WebsiteCMSPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'downloads' | 'inquiries'>('banners');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'banners') setActiveTab('banners');
      else if (tabParam === 'downloads') setActiveTab('downloads');
      else if (tabParam === 'inquiries') setActiveTab('inquiries');
    }
  }, []);
  
  // Modals state
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // Hardcoded premium mock datasets
  const [banners, setBanners] = useState<Banner[]>([
    { id: '1', title: 'Empowering Future Leaders', subtitle: 'Onboard admissions are open for the academic session 2026-27', imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80', linkUrl: '/admissions', sortOrder: 1 },
    { id: '2', title: 'State-of-the-Art Science Labs', subtitle: 'Inspiring young minds through scientific discoveries', imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80', linkUrl: '/labs', sortOrder: 2 },
  ]);

  const [downloads, setDownloads] = useState<Download[]>([
    { id: '1', title: 'Annual Curriculum & Syllabus 2026', category: 'Syllabus', fileSize: '2.4 MB', downloadCount: 142, isPublic: true },
    { id: '2', title: 'School Bus Routes Guide', category: 'Transport', fileSize: '1.2 MB', downloadCount: 88, isPublic: true },
    { id: '3', title: 'Onboarding Enrollment Application Form', category: 'Admission', fileSize: '850 KB', downloadCount: 310, isPublic: true },
  ]);

  const [inquiries, setInquiries] = useState<Inquiry[]>([
    { id: '1', studentName: 'Aarav Mehta', applyingClass: 'Grade 9-A', parentName: 'Sanjay Mehta', parentPhone: '+91 98765 43210', status: 'PENDING', followUpDate: '2026-06-01' },
    { id: '2', studentName: 'Riya Sen', applyingClass: 'Grade 11-B', parentName: 'Priya Sen', parentPhone: '+91 91234 56789', status: 'CONTACTED', followUpDate: '2026-05-30' },
    { id: '3', studentName: 'Kabir Dev', applyingClass: 'Grade 10-A', parentName: 'Amit Dev', parentPhone: '+91 95432 10987', status: 'ADMITTED', followUpDate: 'Completed' },
  ]);

  // Form states
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
  const [downloadForm, setDownloadForm] = useState({ title: '', category: 'Syllabus', fileSize: '1.5 MB' });

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const newBanner: Banner = {
      id: String(banners.length + 1),
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      imageUrl: bannerForm.imageUrl || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80',
      linkUrl: bannerForm.linkUrl || '/general',
      sortOrder: banners.length + 1,
    };
    setBanners([...banners, newBanner]);
    setShowBannerDialog(false);
    setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'success', summary: 'Banner Added', detail: `Published banner "${newBanner.title}" on homepage slider.`, life: 3000 }
    }));
  };

  const handleCreateDownload = (e: React.FormEvent) => {
    e.preventDefault();
    const newDownload: Download = {
      id: String(downloads.length + 1),
      title: downloadForm.title,
      category: downloadForm.category,
      fileSize: downloadForm.fileSize,
      downloadCount: 0,
      isPublic: true,
    };
    setDownloads([newDownload, ...downloads]);
    setShowDownloadDialog(false);
    setDownloadForm({ title: '', category: 'Syllabus', fileSize: '1.5 MB' });
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'success', summary: 'File Published', detail: `Successfully uploaded "${newDownload.title}" to the Download Center.`, life: 3000 }
    }));
  };

  const handleInquiryStatusChange = (id: string, status: Inquiry['status']) => {
    setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status } : inq));
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'info', summary: 'Lead Status Updated', detail: `Inquiry status changed to ${status.toLowerCase()}`, life: 3000 }
    }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-10 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Headless Website CMS Portal
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Headless Content Management — Edit public sliders, publish circular downloads, and track incoming parent admission leads.
            </p>
          </div>
          {activeTab === 'banners' ? (
            <Button label="Add Banner Slide" icon="pi pi-plus" className="bg-primary hover:opacity-95 text-white font-bold p-3 px-5 border-0 rounded-xl shadow-md transition-all" onClick={() => setShowBannerDialog(true)} />
          ) : activeTab === 'downloads' ? (
            <Button label="Upload Public Document" icon="pi pi-upload" className="bg-primary hover:opacity-95 text-white font-bold p-3 px-5 border-0 rounded-xl shadow-md transition-all" onClick={() => setShowDownloadDialog(true)} />
          ) : null}
        </div>

        {/* Tab Menu */}
        <div className="flex bg-slate-100/50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800 w-max overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab('banners')} className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${activeTab === 'banners' ? 'bg-white dark:bg-slate-950 text-primary shadow-sm' : 'text-slate-500'}`}>
            <i className="pi pi-images mr-2 text-[10px]"></i>
            Homepage Sliders
          </button>
          <button onClick={() => setActiveTab('downloads')} className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${activeTab === 'downloads' ? 'bg-white dark:bg-slate-950 text-primary shadow-sm' : 'text-slate-500'}`}>
            <i className="pi pi-download mr-2 text-[10px]"></i>
            Download Center
          </button>
          <button onClick={() => setActiveTab('inquiries')} className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white dark:bg-slate-950 text-primary shadow-sm' : 'text-slate-500'}`}>
            <i className="pi pi-envelope mr-2 text-[10px]"></i>
            Admission Leads ({inquiries.filter(i => i.status === 'PENDING').length})
          </button>
        </div>

        {/* Banners tab */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent p-5 flex flex-col justify-end">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary bg-white px-2 py-0.5 rounded-full w-max">
                      Slide {banner.sortOrder}
                    </span>
                    <h3 className="text-white font-bold text-md mt-1.5">{banner.title}</h3>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{banner.subtitle}</p>
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex justify-between items-center text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                    <span className="truncate max-w-[200px]">Link: {banner.linkUrl}</span>
                    <button className="text-rose-500 hover:text-rose-600 flex items-center gap-1" onClick={() => setBanners(banners.filter(b => b.id !== banner.id))}>
                      <i className="pi pi-trash"></i> Delete Slide
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab === 'downloads' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden p-5 flex flex-col gap-4 animate-fade-in">
            <h3 className="text-sm font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3">Active Documents List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase font-extrabold text-[9px] tracking-wider">
                    <th className="py-2.5">Document Title</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">File Size</th>
                    <th className="py-2.5">Downloads Count</th>
                    <th className="py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-650 dark:text-slate-350">
                  {downloads.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 text-slate-800 dark:text-white font-bold">{doc.title}</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{doc.category}</span></td>
                      <td className="py-3 font-mono">{doc.fileSize}</td>
                      <td className="py-3 font-mono">{doc.downloadCount} dynamic clicks</td>
                      <td className="py-3 text-center">
                        <button className="text-rose-500 hover:text-rose-600" onClick={() => setDownloads(downloads.filter(d => d.id !== doc.id))}>
                          <i className="pi pi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admission Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden p-5 flex flex-col gap-4 animate-fade-in">
            <h3 className="text-sm font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3">Admission Leads Command Sheet</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase font-extrabold text-[9px] tracking-wider">
                    <th className="py-2.5">Student Info</th>
                    <th className="py-2.5">Applying Class</th>
                    <th className="py-2.5">Parent Contact</th>
                    <th className="py-2.5">Follow-Up Date</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-650 dark:text-slate-350">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 text-slate-800 dark:text-white font-bold">{inq.studentName}</td>
                      <td className="py-3">{inq.applyingClass}</td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span>{inq.parentName}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{inq.parentPhone}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono">{inq.followUpDate}</td>
                      <td className="py-3">
                        <Tag value={inq.status} severity={
                          inq.status === 'PENDING' ? 'danger' :
                          inq.status === 'CONTACTED' ? 'warning' :
                          inq.status === 'ADMITTED' ? 'success' : 'secondary'
                        } className="text-[9px] font-bold" />
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500/20 text-[10px]" onClick={() => handleInquiryStatusChange(inq.id, 'ADMITTED')}>Admit</button>
                          <button className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded hover:bg-amber-500/20 text-[10px]" onClick={() => handleInquiryStatusChange(inq.id, 'CONTACTED')}>Contact</button>
                          <button className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20 text-[10px]" onClick={() => handleInquiryStatusChange(inq.id, 'REJECTED')}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dialog - Add Banner */}
        <Dialog header="Add Slider Banner Slide" visible={showBannerDialog} style={{ width: '460px' }} modal onHide={() => setShowBannerDialog(false)} className="rounded-2xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800" contentClassName="p-5" headerClassName="border-b border-slate-100 dark:border-slate-800 p-5 font-bold text-slate-800 dark:text-white">
          <form onSubmit={handleCreateBanner} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Banner Title *</label>
              <InputText value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required placeholder="e.g. Empowering Scientific Minds" className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Subtitle Description *</label>
              <InputText value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} required placeholder="e.g. Join the admissions process today" className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Image URL</label>
              <InputText value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} placeholder="https://unsplash.com/..." className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Redirect Link URL</label>
              <InputText value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} placeholder="e.g. /admissions" className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-3">
              <Button type="button" label="Discard" className="p-button-text p-2.5 px-4 rounded-xl text-xs font-bold" onClick={() => setShowBannerDialog(false)} />
              <Button type="submit" label="Publish Slide" icon="pi pi-check" className="bg-primary text-white p-2.5 px-5 rounded-xl text-xs font-bold border-0 shadow-md hover:opacity-95" />
            </div>
          </form>
        </Dialog>

        {/* Dialog - Add Download */}
        <Dialog header="Upload Circular Document" visible={showDownloadDialog} style={{ width: '460px' }} modal onHide={() => setShowDownloadDialog(false)} className="rounded-2xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800" contentClassName="p-5" headerClassName="border-b border-slate-100 dark:border-slate-800 p-5 font-bold text-slate-800 dark:text-white">
          <form onSubmit={handleCreateDownload} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Document Title *</label>
              <InputText value={downloadForm.title} onChange={(e) => setDownloadForm({ ...downloadForm, title: e.target.value })} required placeholder="e.g. Quarterly Syllabus Guide" className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Category *</label>
              <Dropdown value={downloadForm.category} options={['Syllabus', 'Transport', 'Admission', 'Calendar']} onChange={(e) => setDownloadForm({ ...downloadForm, category: e.value })} className="border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-3">
              <Button type="button" label="Discard" className="p-button-text p-2.5 px-4 rounded-xl text-xs font-bold" onClick={() => setShowDownloadDialog(false)} />
              <Button type="submit" label="Publish File" icon="pi pi-check" className="bg-primary text-white p-2.5 px-5 rounded-xl text-xs font-bold border-0 shadow-md hover:opacity-95" />
            </div>
          </form>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
