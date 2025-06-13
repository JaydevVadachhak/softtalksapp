// Firebase Debug Helper
console.log("Firebase Debug Helper loaded");

// Check if Firebase is loaded
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK is not loaded!");
} else {
    console.log("Firebase SDK is loaded successfully");

    // Check Firebase version
    console.log("Firebase SDK version:", firebase.SDK_VERSION);

    // Check if auth is available
    if (firebase.auth) {
        console.log("Firebase Auth is available");
    } else {
        console.error("Firebase Auth is not available!");
    }
}

// Function to check authentication state
function checkAuthState() {
    console.log("Checking authentication state...");
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            console.log("User is signed in:", user.uid);
            console.log("User email:", user.email);
            console.log("User display name:", user.displayName);
            console.log("User photo URL:", user.photoURL);
        } else {
            console.log("No user is signed in");
        }
    });
}

// Function to check if auth methods are enabled
function checkAuthMethods() {
    console.log("Checking auth configuration...");

    // Try to fetch sign-in methods for a test email
    firebase.auth().fetchSignInMethodsForEmail("test@example.com")
        .then((methods) => {
            console.log("Available sign-in methods:", methods);
        })
        .catch((error) => {
            console.error("Error checking sign-in methods:", error.code, error.message);

            if (error.code === 'auth/configuration-not-found') {
                console.error("SOLUTION: You need to enable Email/Password authentication in the Firebase Console");
                console.error("Go to: https://console.firebase.google.com/project/" + firebase.app().options.projectId + "/authentication/providers");
                console.error("And enable Email/Password and Google authentication methods");
            }
        });
}

// Run checks after a short delay to ensure Firebase is initialized
setTimeout(() => {
    checkAuthState();
    checkAuthMethods();
}, 2000); 