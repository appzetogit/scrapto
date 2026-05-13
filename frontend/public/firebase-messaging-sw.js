// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVJQpAiLrN61ixUSu0gqHnR_Hmzxxj2sE",
  authDomain: "scrapto-eedb1.firebaseapp.com",
  projectId: "scrapto-eedb1",
  storageBucket: "scrapto-eedb1.firebasestorage.app",
  messagingSenderId: "200094632681",
  appId: "1:200094632681:web:abdea299fc6190ea9dbe78",
  measurementId: "G-B3N19Y4S77"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png', // Fallback icon
    badge: '/favicon.png',
    data: payload.data,
    tag: payload.data?.type || 'general', // Prevent duplicate notifications
    renotify: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  let urlToOpen = '/';
  
  // Custom logic for different notification types
  if (data?.orderId) {
    urlToOpen = `/orders/${data.orderId}`;
  } else if (data?.link) {
    urlToOpen = data.link;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
