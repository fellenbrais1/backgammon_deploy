/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Sets up and exports the variables needed to connect to the firebase database

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

// import { APIKEY, DEBUGMODE } from './config.js';

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Default object used to set up a firebase record
const firebaseConfig = {
  apiKey: APIKEY,
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

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

if (DEBUGMODE) {
  console.log(`firebaseConfig.js running`);
  confirmFirebaseInitialization();
}

/////////////////////////////////////////////////////////////////////////////////////////
// CODE END
