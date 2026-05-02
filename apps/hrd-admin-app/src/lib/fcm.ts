import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (e) {
  console.warn('Firebase init failed:', e);
}

export async function initFCM(
  onNotification: (title: string, body: string) => void,
): Promise<void> {
  if (!messaging) return;

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await api.post('/notifications/fcm-token', { token });
    }

    // In-app notifications
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'Notification';
      const body = payload.notification?.body ?? '';
      onNotification(title, body);
    });
  } catch (e) {
    console.warn('FCM setup failed:', e);
  }
}
