import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function enablePush() {
  if (
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    throw new Error('Push non supporté sur cet appareil/navigateur.');
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permission refusée');

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
  });

  const { data: { user } } = await supabase.auth.getUser();
  const keys = sub.toJSON().keys || {};

  await supabase.from('push_subscriptions').upsert(
    {
      user_id: user ? user.id : null,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      platform: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'android',
      user_agent: navigator.userAgent
    },
    { onConflict: 'endpoint' }
  );
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await sub.unsubscribe();
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', sub.endpoint);
  }
}
