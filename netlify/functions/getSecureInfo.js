/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Logic to retrieve the contents of an environmental variable stored on netlify

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

let APIKEY;

let firebaseApp;
let analytics;
let database;

let setUpResult = false;

module.exports.handler = async (event, context) => {
  try {
    APIKEY = process.env.API_KEY;

    if (!APIKEY) {
      console.log(
        `Problem retrieving APIKEY from the netlify environmental variable, check deployment settings or contact the site administrator`
      );
      // window.alert(`Problem retrieving APIKEY from the netlify environmental variable, check deployment settings or contact the site administrator`);
      return;
    } else {
      console.log(
        `APIKEY sucessfully retrieved from the netlify environmental variable`
      );
      setUpFirebase();
      confirmFirebaseInitialization();
      return;
    }
  } catch (error) {
    console.error(
      'Error retrieving the netlify environmental variable:',
      error
    );
    // window.alert('Error retrieving the netlify environmental variable:', error);
    return;
  }
};

function setUpFirebase() {
  const firebaseConfig = {
    apiKey: APIKEY,
    appId: '1:933438650220:web:7cfd8f56a2aef998e46549',
    authDomain: 'backgammon-b1e25.firebaseapp.com',
    measurementId: 'G-ST0Z166K8V',
    messagingSenderId: '933438650220',
    projectId: 'backgammon-b1e25',
    storageBucket: 'backgammon-b1e25.firebasestorage.app',
  };

  firebaseApp = window.firebase.initializeApp(firebaseConfig);

  analytics = window.firebase.analytics;
  database = window.firebase.database;
}

// Checks if a firebase record has been successfully initialized or not - only runs in debug mode
function confirmFirebaseInitialization() {
  if (
    firebaseApp !== undefined &&
    analytics !== undefined &&
    database !== undefined
  ) {
    // Success
    console.log(
      'confirmFirebaseInitialization(): Firebase initialization successful.'
    );
    setUpResult = true;
  } else {
    // Failure
    console.log(
      `confirmFirebaseInitialization(): Firebase initialization failed, check for connection issues`
    );
    setUpResult = false;
  }

  return;
}

export async function getFirebaseVariables() {
  if (setUpResult === true) {
    const firebaseVariables = {
      FIREBASEAPP: firebaseApp,
      ANALYTICS: analytics,
      DATABASE: database,
    };

    return firebaseVariables;
  } else {
    return;
  }
}

// Used to initialize firebase connection

// Allow processing of data to and from the firebase database

// CODE END
/////////////////////////////////////////////////////////////////////////////////////////
