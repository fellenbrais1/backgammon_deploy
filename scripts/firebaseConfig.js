/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Sets up and exports the variables needed to connect to the firebase database

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { DEBUGMODE } from './config.js';

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

let clientSafeToken;

// Default object used to set up a firebase record
const firebaseConfig = {
  apiKey: clientSafeToken,
  appId: '1:933438650220:web:7cfd8f56a2aef998e46549',
  authDomain: 'backgammon-b1e25.firebaseapp.com',
  measurementId: 'G-ST0Z166K8V',
  messagingSenderId: '933438650220',
  projectId: 'backgammon-b1e25',
  storageBucket: 'backgammon-b1e25.firebasestorage.app',
};

// Used to initialize firebase connection
export const firebaseApp = window.firebase.initializeApp(firebaseConfig);

// Allow processing of data to and from the firebase database
export const analytics = window.firebase.analytics();
export const database = window.firebase.database();

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Checks if a firebase record has been successfully initialized or not - only runs in debug mode
function confirmFirebaseInitialization() {
  if (
    analytics !== undefined &&
    database !== undefined &&
    firebaseApp !== undefined
  ) {
    // Success
    console.log(
      'confirmFirebaseInitialization(): Firebase initialization successful.'
    );
  } else {
    // Failure
    console.log(
      `confirmFirebaseInitialization(): Firebase initialization failed, check for connection issues`
    );
  }

  return;
}

// In your HTML script or separate JS file
async function getSecureMessage() {
  try {
    const response = await fetch('/.netlify/functions/get-secure-info'); // Call your new function name
    const data = await response.json();
    if (response.ok) {
      document.getElementById('secure-message').textContent = data.message;
      console.log('Client Token:', data.clientSafeToken);
      safeToken = clientSafeToken;
      // If you returned other data, like clientToken, you'd access it here:
    } else {
      document.getElementById(
        'secure-message'
      ).textContent = `Error: ${data.error}`;
    }
  } catch (error) {
    console.error('Error fetching secure info:', error);
    document.getElementById('secure-message').textContent =
      'Failed to get secure info.';
  }
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

getSecureMessage();

if (DEBUGMODE) {
  console.log(`firebaseConfig.js running`);
  confirmFirebaseInitialization();
}

/////////////////////////////////////////////////////////////////////////////////////////
// CODE END
