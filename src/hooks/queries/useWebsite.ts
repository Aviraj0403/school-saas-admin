import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteService, CreateBannerDto, CreateDownloadDto } from '@/services/website.service';

export const useBanners = () => {
  return useQuery({
    queryKey: ['website-banners'],
    queryFn: () => websiteService.listBanners(),
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBannerDto) => websiteService.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-banners'] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websiteService.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-banners'] });
    },
  });
};

export const useDownloads = () => {
  return useQuery({
    queryKey: ['website-downloads'],
    queryFn: () => websiteService.listDownloads(),
  });
};

export const useCreateDownload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDownloadDto) => websiteService.createDownload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-downloads'] });
    },
  });
};

export const useDeleteDownload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websiteService.deleteDownload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-downloads'] });
    },
  });
};

export const useInquiries = () => {
  return useQuery({
    queryKey: ['website-inquiries'],
    queryFn: () => websiteService.listInquiries(),
  });
};

export const useUpdateInquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => websiteService.updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-inquiries'] });
    },
  });
};
