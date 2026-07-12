import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import type { BookingPayload } from '../services/bookingService';


export function useBookings(params?: {
  search?: string;
  status?: string;
  department?: string;
  resourceType?: string;
  bookedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => bookingService.getBookings(params)
  });
}

export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id
  });
}

export function useBookingCalendar(params?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: ['bookingCalendar', params],
    queryFn: () => bookingService.getBookingCalendar(params)
  });
}

export function useResourceAvailability(params: {
  resourceId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
}) {
  return useQuery({
    queryKey: ['resourceAvailability', params],
    queryFn: () => bookingService.getResourceAvailability(params),
    enabled: !!params.date
  });
}

export function useBookingHistory(bookingId?: string) {
  return useQuery({
    queryKey: ['bookingHistory', bookingId],
    queryFn: () => bookingService.getBookingHistory({ bookingId }),
    enabled: true
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['resourceAvailability'] });
    }
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookingPayload> }) =>
      bookingService.updateBooking(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bookingHistory', variables.id] });
    }
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.rescheduleBooking,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookingHistory', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['resourceAvailability'] });
    }
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { cancellationReason: string; cancelSeries?: boolean } }) =>
      bookingService.cancelBooking(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bookingHistory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['resourceAvailability'] });
    }
  });
}
