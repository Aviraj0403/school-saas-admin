'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteService } from '@/services/website.service';

/**
 * Website content — page copy and photo gallery.
 *
 * The CMS shipped with banners, downloads and admission inquiries wired up,
 * but the page editor and gallery endpoints had no UI at all: a school could
 * not edit a word of its own website copy or publish a single photo, despite
 * both being public-facing and fully implemented server-side.
 */
export default function WebsiteContentPage() {
  const toast = React.useRef<Toast>(null);
  const queryClient = useQueryClient();

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

  const notify = (severity: 'success' | 'error', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'error' ? 'Error' : 'Saved', detail, life: 3000 });

  const savePage = useMutation({
    mutationFn: () => websiteService.upsertPage(editingPage.slug, pageForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      setEditingPage(null);
      notify('success', 'Page updated.');
    },
    onError: () => notify('error', 'Could not save the page.'),
  });

  const createCategory = useMutation({
    mutationFn: () => websiteService.createGalleryCategory(categoryForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery'] });
      setShowCategory(false);
      setCategoryForm({ name: '', description: '' });
      notify('success', 'Album created.');
    },
    onError: () => notify('error', 'Could not create the album.'),
  });

  const addMedia = useMutation({
    mutationFn: () => websiteService.addGalleryMedia(activeCategory!, mediaForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery-media', activeCategory] });
      setShowMedia(false);
      setMediaForm({ url: '', caption: '' });
      notify('success', 'Photo added.');
    },
    onError: () => notify('error', 'Could not add the photo.'),
  });

  const deleteMedia = useMutation({
    mutationFn: (id: string) => websiteService.deleteGalleryMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery-media', activeCategory] });
      notify('success', 'Photo removed.');
    },
    onError: () => notify('error', 'Could not remove the photo.'),
  });

  const openPage = (p: any) => {
    setEditingPage(p);
    setPageForm({ title: p.title ?? '', content: p.content ?? '' });
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Website Content" subtitle="Website" />
      <Toast ref={toast} />

      <div className="pb-10 animate-fade-in">
        <TabView>
          <TabPanel header="Pages">
            <p className="text-xs text-zinc-500 mb-4 max-w-2xl">
              Copy for the public site. Pages are addressed by slug — the public route is
              <code className="mx-1 font-mono">/website/pages/&lt;slug&gt;</code>.
            </p>
            <DataTable value={pages} loading={loadingPages} emptyMessage="No pages defined yet." dataKey="slug">
              <Column field="title" header="Title" />
              <Column header="Slug" body={(p: any) => <code className="text-xs font-mono text-zinc-500">{p.slug}</code>} />
              <Column header="Status" body={(p: any) => (
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${p.isPublished ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500'}`}>
                  {p.isPublished ? 'Published' : 'Draft'}
                </span>
              )} />
              <Column header="" body={(p: any) => (
                <Button label="Edit" onClick={() => openPage(p)} className="p-2 px-3 text-xs rounded-md border border-zinc-200 dark:border-zinc-700" />
              )} />
            </DataTable>
          </TabPanel>

          <TabPanel header="Gallery">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-zinc-500 max-w-2xl">
                Albums and photos shown on the public site.
              </p>
              <Button label="New Album" icon="pi pi-plus" onClick={() => setShowCategory(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 px-5 rounded-md border-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <DataTable value={categories} loading={loadingCats} emptyMessage="No albums yet." dataKey="id" selectionMode="single"
                  onSelectionChange={(e: any) => setActiveCategory(e.value?.id ?? null)}>
                  <Column field="name" header="Album" />
                </DataTable>
              </div>

              <div className="md:col-span-2">
                {!activeCategory ? (
                  <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md p-10 text-center text-sm text-zinc-500">
                    Select an album to see its photos.
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-3">
                      <Button label="Add Photo" icon="pi pi-image" onClick={() => setShowMedia(true)} className="p-2 px-4 text-xs rounded-md border border-zinc-200 dark:border-zinc-700" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(media as any[]).length === 0 && (
                        <p className="col-span-full text-sm text-zinc-500">No photos in this album.</p>
                      )}
                      {(media as any[]).map((m: any) => (
                        <div key={m.id} className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.url} alt={m.caption ?? ''} className="w-full h-28 object-cover" />
                          <div className="p-2 flex justify-between items-center gap-2">
                            <span className="text-[10px] text-zinc-500 truncate">{m.caption || '—'}</span>
                            <button onClick={() => deleteMedia.mutate(m.id)} className="text-[10px] font-bold text-rose-600">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <Dialog header={editingPage ? `Edit — ${editingPage.slug}` : 'Edit page'} visible={!!editingPage} onHide={() => setEditingPage(null)} style={{ width: '640px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Title</label>
            <InputText value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Content</label>
            <InputTextarea value={pageForm.content} onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })} rows={12} className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md font-mono text-xs" />
          </div>
          <Button label="Save Page" loading={savePage.isPending} onClick={() => savePage.mutate()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md border-0 mt-2" />
        </div>
      </Dialog>

      <Dialog header="New Album" visible={showCategory} onHide={() => setShowCategory(false)} style={{ width: '420px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <InputText value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Annual Day 2026" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          <InputText value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Description (optional)" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          <Button label="Create" loading={createCategory.isPending} disabled={!categoryForm.name} onClick={() => createCategory.mutate()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md border-0" />
        </div>
      </Dialog>

      <Dialog header="Add Photo" visible={showMedia} onHide={() => setShowMedia(false)} style={{ width: '460px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <InputText value={mediaForm.url} onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })} placeholder="https://…/photo.jpg" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          <InputText value={mediaForm.caption} onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })} placeholder="Caption (optional)" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md" />
          <Button label="Add" loading={addMedia.isPending} disabled={!mediaForm.url} onClick={() => addMedia.mutate()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md border-0" />
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
