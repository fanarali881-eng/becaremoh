import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPC7qtYhJJdlLeiChl82RmWGf5wb5U_mc",
  authDomain: "becaremoh.firebaseapp.com",
  projectId: "becaremoh",
  storageBucket: "becaremoh.firebasestorage.app",
  messagingSenderId: "524319660438",
  appId: "1:524319660438:web:c5e0cd6a0ec6edeeafe5b7",
  measurementId: "G-YNZGFC0527"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const VAPID_KEY = "BGSoG4ye_zYuEHhwXbpFQGmsUCNmRI-HFRHIxcqlomTAaSQgRPtPGgW8QTwvpBx4EdGJEj8lY0mKyPWEGM1VG9k";

export async function requestNotificationPermission() {
  try {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/admin/firebase-messaging-sw.js');
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Get FCM token
          const currentToken = await getToken(messaging, { 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
          });
          
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // Send token to server
            await sendTokenToServer(currentToken);
            return true;
          } else {
            console.log('No registration token available. Request permission to generate one.');
            return false;
          }
        } catch (err) {
          console.error('Service Worker registration failed:', err);
          return false;
        }
      }
    } else {
      console.log('Unable to get permission to notify.');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

async function sendTokenToServer(token) {
  try {
    const response = await fetch('/admin/fcm/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });
    console.log('Token sent to server:', await response.json());
  } catch (error) {
    console.error('Error sending token to server:', error);
  }
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received in foreground:', payload);
  try {
    // Read from payload.notification OR payload.data (data-only messages)
    const title = payload.notification?.title || payload.data?.title || 'إشعار جديد';
    const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/admin/favicon.ico'
      });
    }
  } catch (e) {
    console.error('Error showing foreground notification:', e);
  }
});
