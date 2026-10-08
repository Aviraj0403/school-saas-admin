'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteService } from '@/services/website.service';
import { FileText, Image as ImageIcon, Plus, Edit, Trash2 } from 'lucide-react';

export default function WebsiteContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pages' | 'gallery'>('pages');

  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageForm, setPageForm] = useState({ title: '', content: '' });

  const [showCategory, setShowCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaForm, setMediaForm] = useState({ url: '', caption: '' });

  const { data: pages = [], isPending: loadingPages } = useQuery({
    queryKey: ['website-pages'],
    queryFn: websiteService.listPages,
  });
  const { data: categories = [], isPending: loadingCats } = useQuery({
    queryKey: ['website-gallery'],
    queryFn: websiteService.getGallery,
  });
  const { data: media = [] } = useQuery({
    queryKey: ['website-gallery-media', activeCategory],
    queryFn: () => websiteService.getGalleryMedia(activeCategory!),
    enabled: !!activeCategory,
  });

  const savePage = useMutation({
    mutationFn: () => websiteService.upsertPage(editingPage.slug, pageForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      setEditingPage(null);
      toast.success('Page copy updated.');
    },
    onError: () => toast.error('Could not save the page.'),
  });

  const createCategory = useMutation({
    mutationFn: () => websiteService.createGalleryCategory(categoryForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery'] });
      setShowCategory(false);
      setCategoryForm({ name: '', description: '' });
      toast.success('Gallery album created.');
    },
    onError: () => toast.error('Could not create album.'),
  });

  const addMedia = useMutation({
    mutationFn: () => websiteService.addGalleryMedia(activeCategory!, mediaForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery-media', activeCategory] });
      setShowMedia(false);
      setMediaForm({ url: '', caption: '' });
      toast.success('Photo added to album.');
    },
    onError: () => toast.error('Could not add photo.'),
  });

  const deleteMedia = useMutation({
    mutationFn: (id: string) => websiteService.deleteGalleryMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery-media', activeCategory] });
      toast.success('Photo removed.');
    },
    onError: () => toast.error('Could not remove photo.'),
  });

  const openPage = (p: any) => {
    setEditingPage(p);
    setPageForm({ title: p.title ?? '', content: p.content ?? '' });
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Website Content & Gallery" subtitle="Website" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Navigation Tabs */}
        <div className="flex bg-white dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl w-max">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'pages'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Static Pages Copy
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'gallery'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Photo Albums Gallery
          </button>
        </div>

        {/* Tab 1: Pages */}
        {activeTab === 'pages' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-zinc-500">
              Copy for public website pages. Addressed via{' '}
              <code className="font-mono text-brand">/website/pages/&lt;slug&gt;</code>.
            </p>

            <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3.5">Title</th>
                    <th className="px-4 py-3.5">Slug</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loadingPages ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                        <p className="text-xs">Loading page copy...</p>
                      </td>
                    </tr>
                  ) : pages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                        No pages defined yet.
                      </td>
                    </tr>
                  ) : (
                    pages.map((p: any) => (
                      <tr key={p.slug} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {p.title}
                        </td>
                        <td className="px-4 py-3 font-mono text-brand">{p.slug}</td>
                        <td className="px-4 py-3">
                          <Badge variant={p.isPublished ? 'success' : 'secondary'}>
                            {p.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" onClick={() => openPage(p)}>
                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Gallery */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <p className="text-xs text-zinc-500 max-w-2xl">
                Albums and photos displayed on public portal.
              </p>
              <Button onClick={() => setShowCategory(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Album
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 p-4 shadow-sm backdrop-blur-xl">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">
                  Photo Albums
                </h3>
                {loadingCats ? (
                  <p className="text-xs text-zinc-400">Loading albums...</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {categories.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setActiveCategory(c.id)}
                        className={`p-3 rounded-lg text-left text-xs font-semibold transition-all ${
                          activeCategory === c.id
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900/60 p-4 shadow-sm backdrop-blur-xl">
                {!activeCategory ? (
                  <div className="p-12 text-center text-zinc-400">
                    Select an album to view photos.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                        Album Photos
                      </h3>
                      <Button variant="outline" onClick={() => setShowMedia(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Photo
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(media as any[]).length === 0 ? (
                        <p className="col-span-3 text-xs text-zinc-400 text-center py-6">
                          No photos in this album.
                        </p>
                      ) : (
                        (media as any[]).map((m: any) => (
                          <div
                            key={m.id}
                            className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950"
                          >
                            <img
                              src={m.url}
                              alt={m.caption ?? ''}
                              className="w-full h-28 object-cover opacity-80"
                            />
                            <div className="p-2 flex justify-between items-center gap-2 bg-white dark:bg-zinc-900">
                              <span className="text-[10px] text-zinc-500 truncate">
                                {m.caption || '—'}
                              </span>
                              <Button
                                variant="outline"
                                onClick={() => deleteMedia.mutate(m.id)}
                                className="text-rose-600 border-rose-200/80 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Page Dialog */}
      <Dialog
        isOpen={!!editingPage}
        onClose={() => setEditingPage(null)}
        title={editingPage ? `Edit — ${editingPage.slug}` : 'Edit Page'}
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Page Title
            </label>
            <Input
              value={pageForm.title}
              onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Content Copy
            </label>
            <textarea
              value={pageForm.content}
              onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setEditingPage(null)}>
            Cancel
          </Button>
          <Button onClick={() => savePage.mutate()} isLoading={savePage.isPending}>
            Save Copy
          </Button>
        </div>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog isOpen={showCategory} onClose={() => setShowCategory(false)} title="Create Album">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Album Name *
            </label>
            <Input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="e.g. Annual Sports Day 2026"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <Input
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Album description..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowCategory(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createCategory.mutate()}
            isLoading={createCategory.isPending}
            disabled={!categoryForm.name}
          >
            Create Album
          </Button>
        </div>
      </Dialog>

      {/* Add Media Dialog */}
      <Dialog isOpen={showMedia} onClose={() => setShowMedia(false)} title="Add Photo to Album">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Image URL *
            </label>
            <Input
              value={mediaForm.url}
              onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Caption
            </label>
            <Input
              value={mediaForm.caption}
              onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
              placeholder="Photo caption..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowMedia(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => addMedia.mutate()}
            isLoading={addMedia.isPending}
            disabled={!mediaForm.url}
          >
            Add Photo
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
