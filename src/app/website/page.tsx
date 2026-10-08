'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import {
  useBanners,
  useCreateBanner,
  useDeleteBanner,
  useDownloads,
  useCreateDownload,
  useDeleteDownload,
  useInquiries,
  useUpdateInquiry,
} from '@/hooks/queries/useWebsite';
import {
  Image as ImageIcon,
  Download,
  Mail,
  Plus,
  Trash2,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function WebsiteCMSPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'downloads' | 'inquiries'>('banners');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (pathname.includes('/banners') || tabParam === 'banners') setActiveTab('banners');
      else if (pathname.includes('/downloads') || tabParam === 'downloads')
        setActiveTab('downloads');
      else if (pathname.includes('/inquiries') || tabParam === 'inquiries')
        setActiveTab('inquiries');
    }
  }, []);

  const selectTab = (tab: 'banners' | 'downloads' | 'inquiries') => {
    setActiveTab(tab);
    window.history.pushState({}, '', `/website/${tab}`);
  };

  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  const { data: bannersData = [] } = useBanners();
  const { data: downloadsData = [] } = useDownloads();
  const { data: inquiriesRes } = useInquiries();

  const banners = Array.isArray(bannersData) ? bannersData : [];
  const downloads = Array.isArray(downloadsData) ? downloadsData : [];
  const inquiries = Array.isArray(inquiriesRes?.data) ? inquiriesRes.data : [];

  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const createDownload = useCreateDownload();
  const deleteDownload = useDeleteDownload();
  const updateInquiry = useUpdateInquiry();

  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
  });
  const [downloadForm, setDownloadForm] = useState({
    title: '',
    category: 'Syllabus',
    fileSize: '1.5 MB',
  });

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    createBanner.mutate(
      {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        imageUrl:
          bannerForm.imageUrl ||
          'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80',
        linkUrl: bannerForm.linkUrl || '/general',
        sortOrder: banners.length + 1,
      },
      {
        onSuccess: () => {
          setShowBannerDialog(false);
          setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '' });
          toast.success('Published banner slide to home slider.');
        },
      }
    );
  };

  const handleCreateDownload = (e: React.FormEvent) => {
    e.preventDefault();
    createDownload.mutate(
      {
        title: downloadForm.title,
        category: downloadForm.category,
        fileUrl: 'placeholder-file-url-s3-key',
        isPublic: true,
      },
      {
        onSuccess: () => {
          setShowDownloadDialog(false);
          setDownloadForm({ title: '', category: 'Syllabus', fileSize: '1.5 MB' });
          toast.success('Public document uploaded successfully.');
        },
      }
    );
  };

  const handleInquiryStatusChange = (
    id: string,
    status: 'NEW' | 'CONTACTED' | 'ADMITTED' | 'REJECTED'
  ) => {
    updateInquiry.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.info(`Inquiry lead status changed to ${status.toLowerCase()}`);
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Website CMS" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-brand" /> Portal Website & Lead Manager
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Configure homepage hero sliders, manage public downloads, and respond to admission
              inquiry leads.
            </p>
          </div>

          <div>
            {activeTab === 'banners' ? (
              <Button onClick={() => setShowBannerDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Banner Slide
              </Button>
            ) : activeTab === 'downloads' ? (
              <Button onClick={() => setShowDownloadDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Upload Document
              </Button>
            ) : null}
          </div>
        </div>

        {/* Tab Menu */}
        <div className="flex bg-white dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl w-max">
          <button
            onClick={() => selectTab('banners')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'banners'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Hero Sliders
          </button>
          <button
            onClick={() => selectTab('downloads')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'downloads'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Download Center
          </button>
          <button
            onClick={() => selectTab('inquiries')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'inquiries'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Admission Leads (
            {inquiries.filter((i) => i.status === 'NEW').length})
          </button>
        </div>

        {/* Banners tab */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {banners.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No Banners Configured</p>
              </div>
            ) : (
              banners.map((banner) => (
                <div
                  key={banner.id}
                  className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between backdrop-blur-xl"
                >
                  <div className="h-44 w-full relative overflow-hidden bg-zinc-950">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent p-4 flex flex-col justify-end">
                      <Badge variant="info">Slide {banner.sortOrder}</Badge>
                      <h3 className="text-white font-bold text-base mt-1.5">{banner.title}</h3>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs text-zinc-500">{banner.subtitle}</p>
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center text-xs">
                      <span className="font-mono text-zinc-400 truncate flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {banner.linkUrl}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => deleteBanner.mutate(banner.id)}
                        className="text-rose-600 border-rose-200/80 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab === 'downloads' && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-3.5">Document Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">File Size</th>
                  <th className="px-4 py-3.5">Downloads</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {downloads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                      No public documents published.
                    </td>
                  </tr>
                ) : (
                  downloads.map((doc) => (
                    <tr key={doc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {doc.title}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{doc.category}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-500">{doc.fileSize}</td>
                      <td className="px-4 py-3 font-mono text-zinc-500">
                        {doc.downloadCount} clicks
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          onClick={() => deleteDownload.mutate(doc.id)}
                          className="text-rose-600 border-rose-200/80 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Admission Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Applying Class</th>
                  <th className="px-4 py-3.5">Parent Contact</th>
                  <th className="px-4 py-3.5">Follow-Up Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                      No admission leads recorded.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {inq.studentName}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {inq.applyingClass}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span>{inq.parentName}</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {inq.parentPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-500">{inq.followUpDate}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            inq.status === 'NEW'
                              ? 'danger'
                              : inq.status === 'CONTACTED'
                                ? 'warning'
                                : inq.status === 'ADMITTED'
                                  ? 'success'
                                  : 'secondary'
                          }
                        >
                          {inq.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            onClick={() => handleInquiryStatusChange(inq.id, 'ADMITTED')}
                          >
                            Admit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleInquiryStatusChange(inq.id, 'CONTACTED')}
                          >
                            Contact
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleInquiryStatusChange(inq.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dialog: Add Banner */}
        <Dialog
          isOpen={showBannerDialog}
          onClose={() => setShowBannerDialog(false)}
          title="Add Banner Slide"
        >
          <form onSubmit={handleCreateBanner} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Banner Title *
              </label>
              <Input
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                placeholder="e.g. Empowering Scientific Minds"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subtitle Description *
              </label>
              <Input
                value={bannerForm.subtitle}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                placeholder="e.g. Join admissions process today"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Image URL
              </label>
              <Input
                value={bannerForm.imageUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Redirect Link URL
              </label>
              <Input
                value={bannerForm.linkUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                placeholder="e.g. /admissions"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" type="button" onClick={() => setShowBannerDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createBanner.isPending}>
                <Check className="w-4 h-4 mr-1.5" /> Publish Slide
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Dialog: Add Download */}
        <Dialog
          isOpen={showDownloadDialog}
          onClose={() => setShowDownloadDialog(false)}
          title="Upload Circular Document"
        >
          <form onSubmit={handleCreateDownload} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Document Title *
              </label>
              <Input
                value={downloadForm.title}
                onChange={(e) => setDownloadForm({ ...downloadForm, title: e.target.value })}
                placeholder="e.g. Quarterly Syllabus Guide"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Category *
              </label>
              <Select
                value={downloadForm.category}
                options={[
                  { label: 'Syllabus', value: 'Syllabus' },
                  { label: 'Transport', value: 'Transport' },
                  { label: 'Admission', value: 'Admission' },
                  { label: 'Calendar', value: 'Calendar' },
                ]}
                onChange={(e) => setDownloadForm({ ...downloadForm, category: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" type="button" onClick={() => setShowDownloadDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createDownload.isPending}>
                <Check className="w-4 h-4 mr-1.5" /> Publish File
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
