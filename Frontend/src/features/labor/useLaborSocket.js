import { useEffect, useCallback } from 'react';
import { useAuctionSocket } from '../../core/providers/AuctionSocketContext';

const EVENTS = [
  'labor_request_created',
  'labor_request_accepted',
  'labor_request_rejected',
  'labor_job_completed',
];

export function useLaborSocket(onEvent) {
  const { socket, isConnected } = useAuctionSocket() ?? {};

  const stableHandler = useCallback(
    (payload) => onEvent?.(payload),
    [onEvent]
  );

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    EVENTS.forEach((ev) => socket.on(ev, stableHandler));
    return () => {
      EVENTS.forEach((ev) => socket.off(ev, stableHandler));
    };
  }, [socket, isConnected, stableHandler]);
}
