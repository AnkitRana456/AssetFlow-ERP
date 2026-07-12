import { apiClient } from '../lib/axios';

export interface BookingPayload {
  title: string;
  resource: string;
  startTime: string;
  endTime: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  remarks?: string;
  participants?: string[];
  isRecurring?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceUntil?: string | null;
  attachment?: string;
}

export interface ReschedulePayload {
  bookingId: string;
  startTime: string;
  endTime: string;
  resourceId?: string;
  rescheduleSeries?: boolean;
}

export const bookingService = {
  async getBookings(params?: {
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
    const response = await apiClient.get('/bookings', { params });
    return response.data;
  },

  async getBookingCalendar(params?: { start?: string; end?: string }) {
    const response = await apiClient.get('/bookings/calendar', { params });
    return response.data;
  },

  async getResourceAvailability(params?: {
    resourceId?: string;
    date: string;
    startTime?: string;
    endTime?: string;
  }) {
    const response = await apiClient.get('/bookings/availability', { params });
    return response.data;
  },

  async getBookingHistory(params?: { bookingId?: string }) {
    const response = await apiClient.get('/bookings/history', { params });
    return response.data;
  },

  async getBookingById(id: string) {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  async createBooking(data: BookingPayload) {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  async updateBooking(id: string, data: Partial<BookingPayload>) {
    const response = await apiClient.patch(`/bookings/${id}`, data);
    return response.data;
  },

  async rescheduleBooking(data: ReschedulePayload) {
    const response = await apiClient.post('/bookings/reschedule', data);
    return response.data;
  },

  async cancelBooking(id: string, data: { cancellationReason: string; cancelSeries?: boolean }) {
    const response = await apiClient.delete(`/bookings/${id}`, { data });
    return response.data;
  }
};
