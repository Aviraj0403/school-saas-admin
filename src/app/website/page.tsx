'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

import { 
  useBanners, useCreateBanner, useDeleteBanner,
  useDownloads, useCreateDownload, useDeleteDownload,
  useInquiries, useUpdateInquiry 
} from '@/hooks/queries/useWebsite';

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

  // Live queries
  const { data: bannersData = [], isPending: bannersLoading } = useBanners();
  const { data: downloadsData = [], isPending: downloadsLoading } = useDownloads();
  const { data: inquiriesRes, isPending: inquiriesLoading } = useInquiries();
  
  const banners = Array.isArray(bannersData) ? bannersData : [];
  const downloads = Array.isArray(downloadsData) ? downloadsData : [];
  const inquiries = Array.isArray(inquiriesRes?.data) ? inquiriesRes.data : [];

  // Mutations
  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const createDownload = useCreateDownload();
  const deleteDownload = useDeleteDownload();
  const updateInquiry = useUpdateInquiry();

  // Form states
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
  const [downloadForm, setDownloadForm] = useState({ title: '', category: 'Syllabus', fileSize: '1.5 MB' });

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    createBanner.mutate({
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      imageUrl: bannerForm.imageUrl || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80',
      linkUrl: bannerForm.linkUrl || '/general',
      sortOrder: banners.length + 1,
    }, {
      onSuccess: () => {
        setShowBannerDialog(false);
        setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Banner Added', detail: `Published banner on homepage slider.`, life: 3000 }
        }));
      }
    });
  };

  const handleCreateDownload = (e: React.FormEvent) => {
    e.preventDefault();
    createDownload.mutate({
      title: downloadForm.title,
      category: downloadForm.category,
      fileUrl: 'placeholder-file-url-s3-key', // Hardcoded until we integrate S3 dropzone in UI
      isPublic: true,
    }, {
      onSuccess: () => {
        setShowDownloadDialog(false);
        setDownloadForm({ title: '', category: 'Syllabus', fileSize: '1.5 MB' });
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'File Published', detail: `Successfully uploaded document.`, life: 3000 }
        }));
      }
    });
  };

  const handleInquiryStatusChange = (id: string, status: 'NEW' | 'CONTACTED' | 'ADMITTED' | 'REJECTED') => {
    updateInquiry.mutate({ id, status }, {
      onSuccess: () => {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'info', summary: 'Lead Status Updated', detail: `Inquiry status changed to ${status.toLowerCase()}`, life: 3000 }
        }));
      }
    });
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Website" />
<div className="flex flex-col gap-4 pb-10 font-sans">
        
        {/* Header */}
        <div className="flex justify-end w-full -mt-8 mb-2 z-10 relative">
          
          {activeTab === 'banners' ? (
            <Button label="Add Banner Slide" icon="pi pi-plus" className="bg-primary hover:opacity-95 text-white font-bold p-3 px-5 border-0 rounded-md shadow-md transition-all" onClick={() => setShowBannerDialog(true)} />
          ) : activeTab === 'downloads' ? (
            <Button label="Upload Public Document" icon="pi pi-upload" className="bg-primary hover:opacity-95 text-white font-bold p-3 px-5 border-0 rounded-md shadow-md transition-all" onClick={() => setShowDownloadDialog(true)} />
          ) : null}
        </div>

        {/* Tab Menu */}
        <div className="flex bg-zinc-100/50 dark:bg-zinc-900/60 p-1.5 rounded-md border border-zinc-200/40 dark:border-zinc-800 w-max overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab('banners')} className={`p-2 px-5 rounded-md text-xs font-bold transition-all ${activeTab === 'banners' ? 'bg-white dark:bg-zinc-950 text-primary shadow-sm' : 'text-zinc-500'}`}>
            <i className="pi pi-images mr-2 text-[10px]"></i>
            Homepage Sliders
          </button>
          <button onClick={() => setActiveTab('downloads')} className={`p-2 px-5 rounded-md text-xs font-bold transition-all ${activeTab === 'downloads' ? 'bg-white dark:bg-zinc-950 text-primary shadow-sm' : 'text-zinc-500'}`}>
            <i className="pi pi-download mr-2 text-[10px]"></i>
            Download Center
          </button>
          <button onClick={() => setActiveTab('inquiries')} className={`p-2 px-5 rounded-md text-xs font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white dark:bg-zinc-950 text-primary shadow-sm' : 'text-zinc-500'}`}>
            <i className="pi pi-envelope mr-2 text-[10px]"></i>
            Admission Leads ({inquiries.filter(i => i.status === 'NEW').length})
          </button>
        </div>

        {/* Banners tab */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-850 rounded-md overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="h-44 w-full relative overflow-hidden bg-zinc-100">
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent p-5 flex flex-col justify-end">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary bg-white px-2 py-0.5 rounded-full w-max">
                      Slide {banner.sortOrder}
                    </span>
                    <h3 className="text-white font-bold text-md mt-1.5">{banner.title}</h3>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">{banner.subtitle}</p>
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 flex justify-between items-center text-[10px] text-zinc-450 font-bold uppercase tracking-wider">
                    <span className="truncate max-w-[200px]">Link: {banner.linkUrl}</span>
                    <button className="text-rose-500 hover:text-rose-600 flex items-center gap-1" onClick={() => deleteBanner.mutate(banner.id)}>
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-850 rounded-md shadow-sm overflow-hidden p-5 flex flex-col gap-4 animate-fade-in">
            <h3 className="text-sm font-black text-zinc-800 dark:text-white border-b border-zinc-100 dark:border-zinc-850 pb-3">Active Documents List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-850 text-zinc-400 uppercase font-extrabold text-[9px] tracking-wider">
                    <th className="py-2.5">Document Title</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">File Size</th>
                    <th className="py-2.5">Downloads Count</th>
                    <th className="py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold text-zinc-650 dark:text-zinc-350">
                  {downloads.map((doc) => (
                    <tr key={doc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3 text-zinc-800 dark:text-white font-bold">{doc.title}</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{doc.category}</span></td>
                      <td className="py-3 font-mono">{doc.fileSize}</td>
                      <td className="py-3 font-mono">{doc.downloadCount} dynamic clicks</td>
                      <td className="py-3 text-center">
                        <button className="text-rose-500 hover:text-rose-600" onClick={() => deleteDownload.mutate(doc.id)}>
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-850 rounded-md shadow-sm overflow-hidden p-5 flex flex-col gap-4 animate-fade-in">
            <h3 className="text-sm font-black text-zinc-800 dark:text-white border-b border-zinc-100 dark:border-zinc-850 pb-3">Admission Leads Command Sheet</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-850 text-zinc-400 uppercase font-extrabold text-[9px] tracking-wider">
                    <th className="py-2.5">Student Info</th>
                    <th className="py-2.5">Applying Class</th>
                    <th className="py-2.5">Parent Contact</th>
                    <th className="py-2.5">Follow-Up Date</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold text-zinc-650 dark:text-zinc-350">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3 text-zinc-800 dark:text-white font-bold">{inq.studentName}</td>
                      <td className="py-3">{inq.applyingClass}</td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span>{inq.parentName}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">{inq.parentPhone}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono">{inq.followUpDate}</td>
                      <td className="py-3">
                        <Tag value={inq.status} severity={
                          inq.status === 'NEW' ? 'danger' :
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
        <Dialog header="Add Slider Banner Slide" visible={showBannerDialog} style={{ width: '460px' }} modal onHide={() => setShowBannerDialog(false)} className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800" contentClassName="p-5" headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-800 dark:text-white">
          <form onSubmit={handleCreateBanner} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-zinc-500">Banner Title *</label>
              <InputText value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required placeholder="e.g. Empowering Scientific Minds" className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-zinc-500">Subtitle Description *</label>
              <InputText value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} required placeholder="e.g. Join the admissions process today" className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-zinc-500">Image URL</label>
              <InputText value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} placeholder="https://unsplash.com/..." className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-zinc-500">Redirect Link URL</label>
              <InputText value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} placeholder="e.g. /admissions" className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 text-sm" />
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-3">
              <Button type="button" label="Discard" className="p-button-text p-2.5 px-4 rounded-md text-xs font-bold" onClick={() => setShowBannerDialog(false)} />
              <Button type="submit" label="Publish Slide" icon="pi pi-check" className="bg-primary text-white p-2.5 px-5 rounded-md text-xs font-bold border-0 shadow-md hover:opacity-95" />
            </div>
          </form>
        </Dialog>

        {/* Dialog - Add Download */}
        <Dialog header="Upload Circular Document" visible={showDownloadDialog} style={{ width: '460px' }} modal onHide={() => setShowDownloadDialog(false)} className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800" contentClassName="p-5" headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-800 dark:text-white">
          <form onSubmit={handleCreateDownload} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-zinc-500">Document Title *</label>
              <InputText value={downloadForm.title} onChange={(e) => setDownloadForm({ ...downloadForm, title: e.target.value })} required placeholder="e.g. Quarterly Syllabus Guide" className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-xs uppercase tracking-wider text-zinc-500">Category *</label>
              <Dropdown value={downloadForm.category} options={['Syllabus', 'Transport', 'Admission', 'Calendar']} onChange={(e) => setDownloadForm({ ...downloadForm, category: e.value })} className="border border-zinc-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950" />
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-3">
              <Button type="button" label="Discard" className="p-button-text p-2.5 px-4 rounded-md text-xs font-bold" onClick={() => setShowDownloadDialog(false)} />
              <Button type="submit" label="Publish File" icon="pi pi-check" className="bg-primary text-white p-2.5 px-5 rounded-md text-xs font-bold border-0 shadow-md hover:opacity-95" />
            </div>
          </form>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
