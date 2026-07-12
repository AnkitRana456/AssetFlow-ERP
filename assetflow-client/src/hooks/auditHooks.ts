import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import type { AuditCyclePayload, VerificationPayload } from '../services/auditService';



export function useAudits(params?: {
  search?: string;
  status?: string;
  department?: string;
  auditor?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['audits', params],
    queryFn: () => auditService.getAudits(params)
  });
}

export function useAuditDetail(id: string) {
  return useQuery({
    queryKey: ['auditDetail', id],
    queryFn: () => auditService.getAuditById(id),
    enabled: !!id
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auditService.createAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['auditAnalytics'] });
    }
  });
}

export function useUpdateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AuditCyclePayload> }) =>
      auditService.updateAudit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditDetail', variables.id] });
    }
  });
}

export function useDeleteAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auditService.deleteAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    }
  });
}

export function useStartAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auditService.startAudit,
    onSuccess: (_, auditId) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditDetail', auditId] });
      queryClient.invalidateQueries({ queryKey: ['auditDashboard'] });
    }
  });
}

export function useVerifyAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, data }: { auditId: string; data: VerificationPayload }) =>
      auditService.verifyAsset(auditId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auditDetail', variables.auditId] });
      queryClient.invalidateQueries({ queryKey: ['auditDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['auditAnalytics'] });
    }
  });
}

export function useBulkVerifyAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, data }: { auditId: string; data: { itemIds: string[]; verificationStatus: string; auditorNotes?: string } }) =>
      auditService.bulkVerifyAssets(auditId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auditDetail', variables.auditId] });
      queryClient.invalidateQueries({ queryKey: ['auditDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['auditAnalytics'] });
    }
  });
}

export function useCloseAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { resolutionNotes: string } }) =>
      auditService.closeAudit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditDetail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['auditDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['auditAnalytics'] });
      // Invalidate core assets cache because closing status changes propagated to assets!
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
}

export function useAuditDashboard() {
  return useQuery({
    queryKey: ['auditDashboard'],
    queryFn: () => auditService.getAuditDashboard()
  });
}

export function useAuditAnalytics() {
  return useQuery({
    queryKey: ['auditAnalytics'],
    queryFn: () => auditService.getAuditAnalytics()
  });
}
