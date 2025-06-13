// Firebase configuration
// Replace these values with your own Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBH2IBLdXjcTKE0Z590PRs2EDXqm5jxGcU",
    authDomain: "softtalks-aeab0.firebaseapp.com",
    projectId: "softtalks-aeab0",
    storageBucket: "softtalks-aeab0.appspot.com",
    messagingSenderId: "238294991463",
    appId: "1:238294991463:web:2d93f8652ffc20dc67cac2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Auth references
const auth = firebase.auth();

// Export auth for use in other files
window.auth = auth; 