'use client';

import { useEffect } from 'react';
import { useRealtime } from '../contexts/realtime-context';

export function useAuctionRoom(auctionId: string | null): void {
  const { socket } = useRealtime();

  useEffect(() => {
    if (!socket || !auctionId) {
      return;
    }

    const payload = { auctionId };
    const joinRoom = () => socket.emit('auction.join', payload);

    socket.on('connect', joinRoom);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off('connect', joinRoom);

      if (socket.connected) {
        socket.emit('auction.leave', payload);
      }
    };
  }, [auctionId, socket]);
}
