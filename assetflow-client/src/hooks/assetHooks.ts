import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../services/assetService';

export function useAssets(params?: {
  search?: string;
  status?: string;
  department?: string;
  category?: string;
  condition?: string;
  location?: string;
  shared?: string;
  isBookable?: string;
  warranty?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => assetService.getAssets(params)
  });
}

export function useAssetDetail(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetService.getAssetById(id),
    enabled: !!id
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assetService.createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => 
      assetService.updateAsset(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['assetHistory', variables.id] });
    }
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assetService.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
}

export function useImportAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assetService.importAssets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
}

export function useAssetHistory(id: string) {
  return useQuery({
    queryKey: ['assetHistory', id],
    queryFn: () => assetService.getAssetHistory(id),
    enabled: !!id
  });
}
