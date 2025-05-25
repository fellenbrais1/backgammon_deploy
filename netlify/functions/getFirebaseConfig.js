/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Logic to retrieve the contents of an environmental variable stored on netlify

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

module.exports.handler = async (event, context) => {
  try {
    const APIKEY = process.env.API_KEY;

    console.log(`DEBUG: Raw APIKEY value: ${APIKEY}`);

    if (!APIKEY) {
      console.log(
        `ERROR: Firebase API_KEY is missing from the Netlify environmental variables`
      );
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Server configuration error: Firebase API Key not found',
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    console.log(`Firebase API_KEY sucessfully retrieved by Netlify function`);

    console.log(APIKEY);

    const firebaseConfig = {
      apiKey: APIKEY.slice(0, -1),
      appId: '1:933438650220:web:7cfd8f56a2aef998e46549',
      authDomain: 'backgammon-b1e25.firebaseapp.com',
      measurementId: 'G-ST0Z166K8V',
      messagingSenderId: '933438650220',
      projectId: 'backgammon-b1e25',
      storageBucket: 'backgammon-b1e25.firebasestorage.app',
    };

    return {
      statusCode: 200, // OK
      body: JSON.stringify(firebaseConfig), // Send the config object as JSON
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error(
      'ERROR: An unexpected error occurred in the Netlify Function:',
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An unexpected error occurred.',
        error: error.message,
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

// function setUpFirebase() {
//   firebaseApp = window.firebase.initializeApp(firebaseConfig);

//   analytics = window.firebase.analytics;
//   database = window.firebase.database;
// }

// // Checks if a firebase record has been successfully initialized or not - only runs in debug mode
// function confirmFirebaseInitialization() {
//   if (
//     firebaseApp !== undefined &&
//     analytics !== undefined &&
//     database !== undefined
//   ) {
//     // Success
//     console.log(
//       'confirmFirebaseInitialization(): Firebase initialization successful.'
//     );
//     setUpResult = true;
//   } else {
//     // Failure
//     console.log(
//       `confirmFirebaseInitialization(): Firebase initialization failed, check for connection issues`
//     );
//     setUpResult = false;
//   }

//   return;
// }

// export async function getFirebaseVariables() {
//   if (setUpResult === true) {
//     const firebaseVariables = {
//       FIREBASEAPP: firebaseApp,
//       ANALYTICS: analytics,
//       DATABASE: database,
//     };

//     return firebaseVariables;
//   } else {
//     return;
//   }
// }
// Used to initialize firebase connection

// Allow processing of data to and from the firebase database

// CODE END
/////////////////////////////////////////////////////////////////////////////////////////
