import { api } from './api';

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
}

export interface CreateBannerDto {
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
}

export interface Download {
  id: string;
  title: string;
  category: string;
  fileSize: number;
  downloadCount: number;
  isPublic: boolean;
  fileUrl: string;
}

export interface CreateDownloadDto {
  title: string;
  category: string;
  fileUrl: string;
  isPublic?: boolean;
}

export interface Inquiry {
  id: string;
  studentName: string;
  applyingClass: string;
  parentName: string;
  parentPhone: string;
  status: 'NEW' | 'CONTACTED' | 'ADMITTED' | 'REJECTED';
  followUpDate?: string;
}

export const websiteService = {
  // Banners
  listBanners: async (): Promise<Banner[]> => {
    const res = await api.get('/website/banners');
    return res.data;
  },
  createBanner: async (data: CreateBannerDto): Promise<Banner> => {
    const res = await api.post('/website/admin/banners', data);
    return res.data;
  },
  deleteBanner: async (id: string): Promise<void> => {
    await api.delete(`/website/admin/banners/${id}`);
  },

  // Downloads
  listDownloads: async (): Promise<Download[]> => {
    const res = await api.get('/website/downloads');
    return res.data;
  },
  createDownload: async (data: CreateDownloadDto): Promise<Download> => {
    const res = await api.post('/website/admin/downloads', data);
    return res.data;
  },
  deleteDownload: async (id: string): Promise<void> => {
    await api.delete(`/website/admin/downloads/${id}`);
  },

  // Inquiries
  listInquiries: async (): Promise<{ data: Inquiry[], meta: any }> => {
    const res = await api.get('/website/admin/inquiries');
    return res.data;
  },
  updateInquiryStatus: async (id: string, status: string): Promise<Inquiry> => {
    const res = await api.patch(`/website/admin/inquiries/${id}`, { status });
    return res.data;
  }
};
