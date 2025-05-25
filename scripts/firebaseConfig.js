// /////////////////////////////////////////////////////////////////////////////////////////
// // CODE START

// // NOTES
// // Sets up and exports the variables needed to connect to the firebase database

'use strict';

// Declare your Firebase variables for client-side use
let firebaseApp;
let analytics;
let database;
let setUpResult = false; // Flag to indicate client-side Firebase setup status

// Function to initialize Firebase on the client-side
async function setUpFirebase(firebaseConfig) {
  try {
    // Check if Firebase SDK is loaded and initializeApp is available
    if (
      typeof firebase !== 'undefined' &&
      typeof firebase.initializeApp === 'function'
    ) {
      firebaseApp = firebase.initializeApp(firebaseConfig);

      // Get specific Firebase services (use () for functions in v8 compat)
      analytics = firebase.analytics();
      database = firebase.database();

      confirmFirebaseInitialization(); // Check if setup was successful
      console.log('Client-side Firebase initialized.');
    } else {
      console.error('Firebase SDK not loaded. Ensure script tags are correct.');
      setUpResult = false;
    }
  } catch (error) {
    console.error('Error initializing Firebase on client-side:', error);
    setUpResult = false;
  }
}

// Function to confirm Firebase initialization on client-side
function confirmFirebaseInitialization() {
  if (firebaseApp && analytics && database) {
    // Check for truthiness instead of undefined
    console.log(
      'confirmFirebaseInitialization(): Client-side Firebase initialization successful.'
    );
    setUpResult = true;
  } else {
    console.log(
      `confirmFirebaseInitialization(): Client-side Firebase initialization failed.`
    );
    setUpResult = false;
  }
}

// Function to get the initialized Firebase variables for use in other client-side modules
// This is how you "export" for client-side JavaScript
// This would be called by other client-side files using `import { getFirebaseVariables } from './main.js';`
// if you're using ES Modules, or just directly if main.js is globally scoped.
async function getFirebaseVariables() {
  if (setUpResult === true) {
    const firebaseVariables = {
      FIREBASEAPP: firebaseApp,
      ANALYTICS: analytics,
      DATABASE: database,
    };
    return firebaseVariables;
  } else {
    console.warn('Firebase not successfully set up on the client-side yet');
    return null; // Or throw an error
  }
}

// --- Main execution logic for your client-side app ---
// 1. Fetch the Firebase config from your Netlify Function
async function initApp() {
  try {
    const response = await fetch('/.netlify/functions/getFirebaseConfig'); // CALL YOUR NETLIFY FUNCTION HERE
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const firebaseConfig = await response.json();
    console.log(
      'Received Firebase Config from Netlify Function:',
      firebaseConfig
    );

    // 2. Use the received config to set up Firebase on the client
    await setUpFirebase(firebaseConfig);

    // 3. Now, you can use the Firebase variables throughout your client-side app
    //    For example, if you have other client-side modules that need Firebase:
    //    const { FIREBASEAPP, ANALYTICS, DATABASE } = await getFirebaseVariables();
    //    console.log("Firebase App instance:", FIREBASEAPP);
    //    // ... use analytics and database ...
  } catch (error) {
    console.error('Failed to initialize client-side Firebase:', error);
    // Handle errors (e.g., show a message to the user)
  }
}

// Run the initialization when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

export { firebaseApp, analytics, database, getFirebaseVariables };

// IMPORTANT: If you want to use firebaseApp, analytics, database in *other* client-side JS files,
// you need to either:
// A) Make them global (less recommended but works for simple apps):
//    window.firebaseApp = firebaseApp;
//    window.analytics = analytics;
//    window.database = database;
//    Then other files can access window.firebaseApp etc.
// B) Use ES Modules (modern approach, requires proper bundling or module type in script tag):
//    Add `export { firebaseApp, analytics, database, getFirebaseVariables };` at the end of this file
//    And then in another client-side file: `import { firebaseApp, analytics, database } from './main.js';`

// /////////////////////////////////////////////////////////////////////////////////////////
// // IMPORTS

// import { DEBUGMODE } from './config.js';

// /////////////////////////////////////////////////////////////////////////////////////////
// // VARIABLES

// // Temporary variables that will be assigned to in setUpVariables()
// let clientSafeToken;

// export const firebaseConfig = {
//   apiKey: await Promise.resolve(getSecureMessage()),
//   appId: '1:933438650220:web:7cfd8f56a2aef998e46549',
//   authDomain: 'backgammon-b1e25.firebaseapp.com',
//   measurementId: 'G-ST0Z166K8V',
//   messagingSenderId: '933438650220',
//   projectId: 'backgammon-b1e25',
//   storageBucket: 'backgammon-b1e25.firebasestorage.app',
// };

// // Used to initialize firebase connection
// export const firebaseApp = window.firebase.initializeApp(
//   await Promise.resolve(firebaseConfig)
// );

// // Allow processing of data to and from the firebase database
// export const analytics = await Promise.resolve(window.firebase.analytics());
// export const database = await Promise.resolve(window.firebase.database());

// /////////////////////////////////////////////////////////////////////////////////////////
// // FUNCTIONS

// // Checks if a firebase record has been successfully initialized or not - only runs in debug mode
// function confirmFirebaseInitialization() {
//   if (
//     analytics !== undefined &&
//     database !== undefined &&
//     firebaseApp !== undefined
//   ) {
//     // Success
//     console.log(
//       'confirmFirebaseInitialization(): Firebase initialization successful.'
//     );
//   } else {
//     // Failure
//     console.log(
//       `confirmFirebaseInitialization(): Firebase initialization failed, check for connection issues`
//     );
//   }

//   return;
// }

// // In your HTML script or separate JS file
// async function getSecureMessage() {
//   try {
//     const response = await fetch('/.netlify/functions/getSecureInfo'); // Call your new function name
//     const data = await response.json();
//     if (response.ok) {
//       document.getElementById('secure-message').textContent = data.message;
//       console.log('data:', data);
//       console.log('Client Token:', data.clientToken);
//       const safeToken = data.clientToken;
//       return safeToken;
//       // If you returned other data, like clientToken, you'd access it here:
//     } else {
//       document.getElementById(
//         'secure-message'
//       ).textContent = `Error: ${data.error}`;
//       console.log(data.error);
//     }
//   } catch (error) {
//     console.error('Error fetching secure info:', error);
//     document.getElementById('secure-message').textContent =
//       'Failed to get secure info.';
//     console.log('Failed to get secure info');
//   }
// }

// /////////////////////////////////////////////////////////////////////////////////////////
// // AUTORUNNING LOGIC

// if (DEBUGMODE) {
//   console.log(`firebaseConfig.js running`);
//   confirmFirebaseInitialization();
// }

// /////////////////////////////////////////////////////////////////////////////////////////
// // CODE END
