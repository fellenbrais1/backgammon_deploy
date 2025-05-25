/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Sets up and exports the variables needed to connect to the firebase database

"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

let firebaseApp;
let analytics;
let database;

let setUpResult = false;

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Function to initialize Firebase on the client-side
async function setUpFirebase(firebaseConfig) {
  try {
    if (
      typeof firebase !== "undefined" &&
      typeof firebase.initializeApp === "function"
    ) {
      firebaseApp = firebase.initializeApp(firebaseConfig);

      analytics = firebase.analytics();
      database = firebase.database();

      confirmFirebaseInitialization();
      console.log("Client-side Firebase initialized.");
    } else {
      console.error("Firebase SDK not loaded. Ensure script tags are correct.");
      setUpResult = false;
    }
  } catch (error) {
    console.error("Error initializing Firebase on client-side:", error);
    setUpResult = false;
  }
}

// Function to confirm Firebase initialization on client-side
function confirmFirebaseInitialization() {
  if (firebaseApp && analytics && database) {
    console.log(
      "confirmFirebaseInitialization(): Client-side Firebase initialization successful."
    );
    setUpResult = true;
    return;
  } else {
    console.log(
      `confirmFirebaseInitialization(): Client-side Firebase initialization failed.`
    );
    setUpResult = false;
    return;
  }
}

// Function to get the initialized Firebase variables for use in other client-side modules
export async function getFirebaseVariables() {
  if (setUpResult === true) {
    const firebaseVariables = {
      FIREBASEAPP: firebaseApp,
      ANALYTICS: analytics,
      DATABASE: database,
    };
    return firebaseVariables;
  } else {
    console.warn("Firebase not successfully set up on the client-side yet");
    return {
      FIREBASEAPP: "poop",
      ANALYTICS: "bum",
      DATABASE: "bottom",
    };
  }
}

// --- Main execution logic for your client-side app ---
async function initApp() {
  try {
    const response = await fetch("/.netlify/functions/getFirebaseConfig"); // CALL YOUR NETLIFY FUNCTION HERE
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const firebaseConfig = await response.json();
    console.log(
      "Received Firebase Config from Netlify Function:",
      firebaseConfig
    );

    await setUpFirebase(firebaseConfig);
  } catch (error) {
    console.error("Failed to initialize client-side Firebase:", error);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

// Run the initialization when the DOM is ready
document.addEventListener("DOMContentLoaded", initApp);

// export { firebaseApp, analytics, database };

/////////////////////////////////////////////////////////////////////////////////////////
// CODE END
