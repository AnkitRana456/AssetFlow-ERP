import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { useAuthStore } from '../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export function useSocketSetup() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }

    socket.connect();

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      
      // Join individual user and role rooms for targeted messaging
      socket.emit('join_user', user.userId);
      socket.emit('join_role', user.role);
    });

    socket.on('notification', (data) => {
      console.log('🔔 New Notification:', data);
      // Invalidate notifications queries to fetch latest alerts
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('dashboard_update', (data) => {
      console.log('📊 Dashboard Update Triggered:', data);
      // Invalidate relevant queries to refresh list views in real-time
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    return () => {
      socket.off('connect');
      socket.off('notification');
      socket.off('dashboard_update');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [user, queryClient]);
}
