'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { publicConfig } from '../lib/config';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/realtime';
import { useAuth } from './auth-context';

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { revalidate, status, token } = useAuth();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      publicConfig.socketUrl,
      {
        auth: token ? { token } : {},
      },
    );

    socket.on('auth.failed', () => {
      void revalidate().catch(() => undefined);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [revalidate, status, token]);

  return children;
}
