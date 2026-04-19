
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;
let firebaseInitError = null;

/**
 * Initialize Firebase Admin SDK (Singleton)
 * Expects FIREBASE_SERVICE_ACCOUNT_JSON environment variable with path to service account key or JSON string
 * Throws on error in production, logs warning in development
 */
const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;
  if (firebaseInitError) return null;
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountPath) {
      const msg = 'Firebase service account not configured. Push notifications will be disabled.';
      if (process.env.NODE_ENV === 'production') throw new Error(msg);
      else console.warn(msg);
      firebaseInitError = msg;
      return null;
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountPath);
    } catch {
      // If not valid JSON, treat as file path
      const fullPath = path.resolve(serviceAccountPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Firebase service account file not found: ${fullPath}`);
      }
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    }
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    firebaseInitError = error.message;
    if (process.env.NODE_ENV === 'production') throw error;
    else console.error('Failed to initialize Firebase:', error.message);
    return null;
  }
};

/**
 * Send push notification to a single device
 * @param {string} token - Device token
 * @param {Object} notification - Notification data
 * @returns {Promise<string>} - Message ID if successful
 */
/**
 * Send push notification to a single device
 * @param {string} token - Device token
 * @param {Object} notification - Notification data (title, body, data, icon, badge)
 * @returns {Promise<string>} - Message ID if successful
 */
const sendPushNotification = async (token, notification) => {
  const app = initializeFirebase();
  if (!app) throw new Error('Firebase not initialized');
  try {
    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        ttl: 3600,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            'mutable-content': true,
          },
        },
      },
      webpush: {
        headers: {
          TTL: '3600',
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: notification.badge || '/badge-72x72.png',
        },
      },
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    // Log with context
    console.error(`[Push] Error sending notification to token ${token}:`, error);
    throw error;
  }
};

/**
 * Send push notification to multiple devices (up to 500)
 * @param {string[]} tokens - Device tokens
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Response with success and failure counts
 */

/**
 * Send push notification to multiple devices (up to 500)
 * @param {string[]} tokens - Device tokens
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Response with success and failure counts
 */
const sendMulticastPushNotification = async (tokens, notification) => {
  const app = initializeFirebase();
  if (!app) throw new Error('Firebase not initialized');
  try {
    if (tokens.length > 500) {
      // Split into batches of 500
      const batches = [];
      for (let i = 0; i < tokens.length; i += 500) {
        batches.push(tokens.slice(i, i + 500));
      }
      const responses = await Promise.all(
        batches.map((batch) => sendMulticastPushNotification(batch, notification))
      );
      return {
        successCount: responses.reduce((sum, r) => sum + r.successCount, 0),
        failureCount: responses.reduce((sum, r) => sum + r.failureCount, 0),
      };
    }
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        ttl: 3600,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            'mutable-content': true,
          },
        },
      },
      webpush: {
        headers: {
          TTL: '3600',
        },
        notification: {
          title: notification.title,
          body: notification.body,
        },
      },
    };
    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens,
    });
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error(`[Push] Error sending multicast notification to tokens:`, error);
    throw error;
  }
};

/**
 * Subscribe a device token to a topic
 * @param {string[]} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Response
 */

/**
 * Subscribe device tokens to a topic
 * @param {string[]} tokens
 * @param {string} topic
 * @returns {Promise<Object>}
 */
const subscribeToTopic = async (tokens, topic) => {
  const app = initializeFirebase();
  if (!app) throw new Error('Firebase not initialized');
  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error(`[Push] Error subscribing tokens to topic '${topic}':`, error);
    throw error;
  }
};

/**
 * Unsubscribe device tokens from a topic
 * @param {string[]} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Response
 */

/**
 * Unsubscribe device tokens from a topic
 * @param {string[]} tokens
 * @param {string} topic
 * @returns {Promise<Object>}
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  const app = initializeFirebase();
  if (!app) throw new Error('Firebase not initialized');
  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error(`[Push] Error unsubscribing tokens from topic '${topic}':`, error);
    throw error;
  }
};

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification data
 * @returns {Promise<string>} - Message ID
 */

/**
 * Send notification to a topic
 * @param {string} topic
 * @param {Object} notification
 * @returns {Promise<string>} - Message ID
 */
const sendNotificationToTopic = async (topic, notification) => {
  const app = initializeFirebase();
  if (!app) throw new Error('Firebase not initialized');
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      topic,
      android: {
        priority: 'high',
        ttl: 3600,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            'mutable-content': true,
          },
        },
      },
      webpush: {
        headers: {
          TTL: '3600',
        },
        notification: {
          title: notification.title,
          body: notification.body,
        },
      },
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error(`[Push] Error sending notification to topic '${topic}':`, error);
    throw error;
  }
};


// Export only the public API
export {
  initializeFirebase,
  sendPushNotification,
  sendMulticastPushNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendNotificationToTopic,
};
