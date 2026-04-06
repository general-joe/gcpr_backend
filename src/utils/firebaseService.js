import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * Expects FIREBASE_SERVICE_ACCOUNT_JSON environment variable with path to service account key
 * or FIREBASE_SERVICE_ACCOUNT_JSON with JSON string
 */
const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountPath) {
      console.warn('Firebase service account not configured. Push notifications will be disabled.');
      return null;
    }

    // Try to parse as JSON string first, then as file path
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
    console.error('Failed to initialize Firebase:', error.message);
    return null;
  }
};

/**
 * Send push notification to a single device
 * @param {string} token - Device token
 * @param {Object} notification - Notification data
 * @returns {Promise<string>} - Message ID if successful
 */
const sendPushNotification = async (token, notification) => {
  try {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized');
    }

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
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Send push notification to multiple devices (up to 500)
 * @param {string[]} tokens - Device tokens
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} - Response with success and failure counts
 */
const sendMulticastPushNotification = async (tokens, notification) => {
  try {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized');
    }

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
    console.error('Error sending multicast push notification:', error);
    throw error;
  }
};

/**
 * Subscribe a device token to a topic
 * @param {string[]} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Response
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized');
    }

    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
};

/**
 * Unsubscribe device tokens from a topic
 * @param {string[]} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} - Response
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized');
    }

    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw error;
  }
};

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification data
 * @returns {Promise<string>} - Message ID
 */
const sendNotificationToTopic = async (topic, notification) => {
  try {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized');
    }

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
    console.error('Error sending notification to topic:', error);
    throw error;
  }
};

export {
  initializeFirebase,
  sendPushNotification,
  sendMulticastPushNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendNotificationToTopic,
};
