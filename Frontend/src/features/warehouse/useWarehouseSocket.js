import { useEffect, useCallback } from 'react';
import { useAuctionSocket } from '../../core/providers/AuctionSocketContext';

const EVENTS = [
  'warehouse_booking_created',
  'warehouse_booking_approved',
  'warehouse_booking_rejected',
  'warehouse_capacity_updated',
];

export function useWarehouseSocket(onEvent) {
  const { socket, isConnected } = useAuctionSocket() ?? {};
  const handler = useCallback((p) => onEvent?.(p), [onEvent]);

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    EVENTS.forEach((ev) => socket.on(ev, handler));
    return () => EVENTS.forEach((ev) => socket.off(ev, handler));
  }, [socket, isConnected, handler]);
}
