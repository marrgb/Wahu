// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in
// the messagingSenderId.
const firebaseConfig = {
    apiKey: "AIzaSyD71xTNvLK8KTa4XYy26Z5YABiW9Fkv-qY",
    authDomain: "wahu-15b45.firebaseapp.com",
    databaseURL: "https://wahu-15b45-default-rtdb.firebaseio.com",
    projectId: "wahu-15b45",
    storageBucket: "wahu-15b45.appspot.com",
    messagingSenderId: "430808833036",
    appId: "1:430808833036:web:5e5520d8446864dfd92229",
    measurementId: "G-17C21ZMS2V"
};
firebase.initializeApp(firebaseConfig);


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/icononly_transparent_nobuffer.png'
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});