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

  // Send combined notification + data with high priority for reliable background delivery
  const message = {
    notification: {
      title: String(title),
      body: String(body)
    },
    data: {
      ...stringData,
      title: String(title),
      body: String(body),
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    webpush: {
      headers: {
        Urgency: "high",
        TTL: "86400"
      },
      notification: {
        title: String(title),
        body: String(body),
        icon: "/admin/favicon.ico",
        badge: "/admin/favicon.ico",
        requireInteraction: true,
        vibrate: [200, 100, 200]
      },
      fcmOptions: {
        link: "/admin/"
      }
    },
    android: {
      priority: "high"
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

// Diagnostic: send a test notification and return detailed result
async function sendTestNotification() {
  if (!isFirebaseInitialized) {
    return { ok: false, reason: "Firebase not initialized" };
  }
  if (fcmTokens.size === 0) {
    return { ok: false, reason: "No FCM tokens stored", tokenCount: 0 };
  }
  const title = "إشعار تجريبي";
  const body = "هذا إشعار تجريبي للتأكد من عمل الإشعارات في الخلفية";
  const message = {
    notification: {
      title: title,
      body: body
    },
    data: {
      title: title,
      body: body,
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    webpush: {
      headers: {
        Urgency: "high",
        TTL: "86400"
      },
      notification: {
        title: title,
        body: body,
        icon: "/admin/favicon.ico",
        badge: "/admin/favicon.ico",
        requireInteraction: true,
        vibrate: [200, 100, 200]
      },
      fcmOptions: {
        link: "/admin/"
      }
    },
    android: {
      priority: "high"
    },
    tokens: Array.from(fcmTokens)
  };
  try {
    const response = await messaging.sendEachForMulticast(message);
    const details = response.responses.map((r, i) => ({
      success: r.success,
      error: r.error ? (r.error.code + ": " + r.error.message) : null
    }));
    return {
      ok: true,
      tokenCount: fcmTokens.size,
      successCount: response.successCount,
      failureCount: response.failureCount,
      details
    };
  } catch (error) {
    return { ok: false, reason: error.message, code: error.code };
  }
}

// Diagnostic: report current state
function getStatus() {
  return {
    firebaseInitialized: isFirebaseInitialized,
    tokenCount: fcmTokens.size,
    tokenSamples: Array.from(fcmTokens).map(t => t.substring(0, 12) + "...")
  };
}

module.exports = {
  addToken,
  removeToken,
  sendNotification,
  sendTestNotification,
  setTokens,
  getTokens,
  getStatus
};
