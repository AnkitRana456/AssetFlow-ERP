import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationService } from '../services/allocationService';

export function useAllocations(params?: {
  search?: string;
  status?: string;
  department?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ['allocations', params],
    queryFn: () => allocationService.getAllocations(params)
  });
}

export function useAllocationDetail(id: string) {
  return useQuery({
    queryKey: ['allocation', id],
    queryFn: () => allocationService.getAllocationById(id),
    enabled: !!id
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocationService.createAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      allocationService.updateAllocation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['allocation', variables.id] });
    }
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: () => allocationService.getTransfers()
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocationService.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    }
  });
}

export function useApproveTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) => 
      allocationService.approveTransfer(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) => 
      allocationService.rejectTransfer(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocationService.completeTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
}

export function useReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: () => allocationService.getReturns()
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocationService.createReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    }
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) => 
      allocationService.approveReturn(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    }
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) => 
      allocationService.rejectReturn(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    }
  });
}

export function useAssetTimeline(assetId: string) {
  return useQuery({
    queryKey: ['assetTimeline', assetId],
    queryFn: () => allocationService.getAssetTimeline(assetId),
    enabled: !!assetId
  });
}
