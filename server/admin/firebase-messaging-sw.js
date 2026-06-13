importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// We will inject the config dynamically or hardcode it here.

const firebaseConfig = {
  apiKey: "AIzaSyAPC7qtYhJJdlLeiChl82RmWGf5wb5U_mc",
  authDomain: "becaremoh.firebaseapp.com",
  projectId: "becaremoh",
  storageBucket: "becaremoh.firebasestorage.app",
  messagingSenderId: "524319660438",
  appId: "1:524319660438:web:c5e0cd6a0ec6edeeafe5b7",
  measurementId: "G-YNZGFC0527"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Extract title and body from payload.notification or payload.data
  const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'لديك إشعار جديد في لوحة التحكم',
    icon: '/admin/favicon.ico',
    badge: '/admin/favicon.ico',
    data: payload.data,
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/admin/')
  );
});
