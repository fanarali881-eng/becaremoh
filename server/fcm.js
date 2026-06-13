const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin
let isFirebaseInitialized = false;
let messaging = null;
try {
  const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
    messaging = getMessaging();
    isFirebaseInitialized = true;
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.log("Firebase service account file not found. Push notifications disabled.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// Store FCM tokens (persisted via index.js)
const fcmTokens = new Set();

// Function to initialize tokens from index.js
function setTokens(tokens) {
  if (Array.isArray(tokens)) {
    tokens.forEach(token => fcmTokens.add(token));
    console.log(`Loaded ${fcmTokens.size} FCM tokens from main data`);
  }
}

// Function to get current tokens for saving in index.js
function getTokens() {
  return Array.from(fcmTokens);
}

function addToken(token) {
  if (token && !fcmTokens.has(token)) {
    fcmTokens.add(token);
    console.log(`Added new FCM token. Total: ${fcmTokens.size}`);
  }
}

function removeToken(token) {
  if (fcmTokens.has(token)) {
    fcmTokens.delete(token);
    console.log(`Removed FCM token. Total: ${fcmTokens.size}`);
  }
}

async function sendNotification(title, body, data = {}) {
  if (!isFirebaseInitialized || fcmTokens.size === 0) return;

  // Convert all data values to strings (FCM requirement)
  const stringData = {};
  Object.keys(data).forEach(k => {
    stringData[k] = String(data[k]);
  });

  const message = {
    notification: {
      title,
      body
    },
    data: {
      ...stringData,
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    webpush: {
      fcmOptions: {
        link: "/admin/"
      },
      notification: {
        title,
        body,
        icon: "/admin/favicon.ico",
        requireInteraction: true,
        vibrate: [200, 100, 200]
      }
    },
    tokens: Array.from(fcmTokens)
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} messages; failed ${response.failureCount}`);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(message.tokens[idx]);
        }
      });
      failedTokens.forEach(token => removeToken(token));
    }
  } catch (error) {
    console.error("Error sending FCM message:", error);
  }
}

module.exports = {
  addToken,
  removeToken,
  sendNotification,
  setTokens,
  getTokens
};
