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

// Temporary variables that will be assigned to in setUpVariables()
let clientSafeToken;

export const firebaseConfig = {
  apiKey: await Promise.resolve(getSecureMessage()),
  appId: '1:933438650220:web:7cfd8f56a2aef998e46549',
  authDomain: 'backgammon-b1e25.firebaseapp.com',
  measurementId: 'G-ST0Z166K8V',
  messagingSenderId: '933438650220',
  projectId: 'backgammon-b1e25',
  storageBucket: 'backgammon-b1e25.firebasestorage.app',
};

// Used to initialize firebase connection
export const firebaseApp = window.firebase.initializeApp(
  await Promise.resolve(firebaseConfig)
);

// Allow processing of data to and from the firebase database
export const analytics = await Promise.resolve(window.firebase.analytics());
export const database = await Promise.resolve(window.firebase.database());

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
    const response = await fetch('/.netlify/functions/getSecureInfo'); // Call your new function name
    const data = await response.json();
    if (response.ok) {
      document.getElementById('secure-message').textContent = data.message;
      console.log('Client Token:', data.clientSafeToken);
      safeToken = clientSafeToken;
      return safeToken;
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

// function setUpVariables(safeToken) {
//   // Default object used to set up a firebase record
//   const firebaseConfig = {
//     apiKey: safeToken,
//     appId: '1:933438650220:web:7cfd8f56a2aef998e46549',
//     authDomain: 'backgammon-b1e25.firebaseapp.com',
//     measurementId: 'G-ST0Z166K8V',
//     messagingSenderId: '933438650220',
//     projectId: 'backgammon-b1e25',
//     storageBucket: 'backgammon-b1e25.firebasestorage.app',
//   };

//   // Used to initialize firebase connection
//   firebaseApp = window.firebase.initializeApp(firebaseConfig);

//   // Allow processing of data to and from the firebase database
//   analytics = window.firebase.analytics();
//   database = window.firebase.database();
// }

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

// getSecureMessage();

if (DEBUGMODE) {
  console.log(`firebaseConfig.js running`);
  confirmFirebaseInitialization();
}

/////////////////////////////////////////////////////////////////////////////////////////
// CODE END
