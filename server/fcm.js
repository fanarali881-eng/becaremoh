const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin
let isFirebaseInitialized = false;
try {
  const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isFirebaseInitialized = true;
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.log("Firebase service account file not found. Push notifications disabled.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// Store FCM tokens (in memory for now, could be saved to file)
const fcmTokens = new Set();
const TOKENS_FILE = path.join(process.env.NODE_ENV === 'production' ? '/data' : __dirname, 'fcm_tokens.json');

// Load tokens from file
try {
  if (fs.existsSync(TOKENS_FILE)) {
    const data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    data.forEach(token => fcmTokens.add(token));
    console.log(`Loaded ${fcmTokens.size} FCM tokens`);
  }
} catch (e) { console.log('No FCM tokens file found'); }

function saveTokens() {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(Array.from(fcmTokens)));
  } catch (e) { console.error('Error saving FCM tokens:', e.message); }
}

function addToken(token) {
  if (token && !fcmTokens.has(token)) {
    fcmTokens.add(token);
    saveTokens();
    console.log(`Added new FCM token. Total: ${fcmTokens.size}`);
  }
}

function removeToken(token) {
  if (fcmTokens.has(token)) {
    fcmTokens.delete(token);
    saveTokens();
    console.log(`Removed FCM token. Total: ${fcmTokens.size}`);
  }
}

async function sendNotification(title, body, data = {}) {
  if (!isFirebaseInitialized || fcmTokens.size === 0) return;

  const message = {
    notification: {
      title,
      body
    },
    data: {
      ...data,
      click_action: "FLUTTER_NOTIFICATION_CLICK" // For PWA
    },
    tokens: Array.from(fcmTokens)
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
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
  sendNotification
};
