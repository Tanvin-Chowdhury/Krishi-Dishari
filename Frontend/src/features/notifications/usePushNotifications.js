import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '../../shared/services/notificationApi';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(enabled = true) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = useCallback(async () => {
    if (!enabled || !VAPID_PUBLIC || !('serviceWorker' in navigator)) return false;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      await notificationApi.subscribePush(sub);
      setSubscribed(true);
      return true;
    } catch (err) {
      console.warn('[push]', err.message);
      return false;
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled && permission === 'default') {
      subscribe();
    }
  }, [enabled, permission, subscribe]);

  return { permission, subscribed, subscribe };
}
