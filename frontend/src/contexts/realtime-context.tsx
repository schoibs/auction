'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { publicConfig } from '../lib/config';
import type {
  AuctionOutbidPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/realtime';
import { useAuth } from './auth-context';

export type RealtimeSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export interface OutbidNotification extends AuctionOutbidPayload {
  id: string;
}

interface RealtimeContextValue {
  socket: RealtimeSocket | null;
  outbidNotifications: OutbidNotification[];
  dismissOutbidNotification(id: string): void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { revalidate, status, token } = useAuth();
  const [socket, setSocket] = useState<RealtimeSocket | null>(null);
  const [outbidNotifications, setOutbidNotifications] = useState<
    OutbidNotification[]
  >([]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const nextSocket: RealtimeSocket = io(
      publicConfig.socketUrl,
      {
        auth: token ? { token } : {},
      },
    );

    setSocket(nextSocket);
    setOutbidNotifications([]);

    nextSocket.on('auth.failed', () => {
      void revalidate().catch(() => undefined);
    });

    nextSocket.on('auction.outbid', (payload) => {
      setOutbidNotifications((current) => {
        if (
          current.some((notification) => notification.id === payload.newBidId)
        ) {
          return current;
        }

        return [...current, { ...payload, id: payload.newBidId }];
      });
    });

    return () => {
      setSocket((current) => (current === nextSocket ? null : current));
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
    };
  }, [revalidate, status, token]);

  const dismissOutbidNotification = useCallback((id: string) => {
    setOutbidNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      socket,
      outbidNotifications,
      dismissOutbidNotification,
    }),
    [dismissOutbidNotification, outbidNotifications, socket],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider.');
  }

  return context;
}
