/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Sets up and exports a local storage object for storing user's data between sessions

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { DEBUGMODE } from './config.js';

//////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

// Browser storage used to hold player object data instead of using cookies
const localStorage = window.localStorage;

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Default template for the player object
const defaultLocalStorageObject = {
  displayName: '',
  inGame: false,
  languages: [],
  peerID: '',
  skillLevel: 'beginner',
  userKey: '',
};

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Resets the values of any locally stored player object with the default
export function clearLocalStorage() {
  setLocalStorage(defaultLocalStorageObject);

  // Logs content of storage object in debug mode
  if (DEBUGMODE) {
    testForLocalStorageData();
  }

  return;
}

// Initializes the local storage to the value of defaultLocalStorageObject
function createLocalStorage() {
  const localStorageObject = { ...defaultLocalStorageObject };

  localStorage.setItem(
    'localStorageObject',
    JSON.stringify(localStorageObject)
  );

  return localStorageObject;
}

// Loads the data from a previously created localStorageObject, or supplies default values if an object does not exist
export function loadLocalStorage() {
  const storedObject = localStorage.getItem('localStorageObject');

  if (storedObject) {
    const localStorageObject = JSON.parse(storedObject);
    return {
      displayName: localStorageObject.displayName,
      inGame: localStorageObject.inGame,
      languages: localStorageObject.languages,
      peerID: localStorageObject.peerID,
      skillLevel: localStorageObject.skillLevel,
      userKey: localStorageObject.userKey,
    };
  } else {
    const newObject = createLocalStorage();
    return {
      displayName: newObject.displayName,
      inGame: newObject.inGame,
      languages: newObject.languages,
      peerID: newObject.peerID,
      skillLevel: newObject.skillLevel,
      userKey: newObject.userKey,
    };
  }
}

// Sets the user's entered data on the localStorageObject
export function setLocalStorage({
  displayName = '',
  inGame = false,
  languages = ['English'],
  peerID = '',
  skillLevel = 'beginner',
  userKey = '',
} = {}) {
  if (DEBUGMODE) {
    console.log('setLocalStorage(): peerID:', peerID);
  }

  let storedObject = localStorage.getItem('localStorageObject');

  // If there is no storedObject a default one is created to be written to
  if (!storedObject) {
    const defaultObject = createLocalStorage();
    storedObject = JSON.stringify(defaultObject);
  }

  const localStorageObject = JSON.parse(storedObject);

  localStorageObject.displayName = displayName;
  localStorageObject.inGame = inGame;
  localStorageObject.languages = languages;
  localStorageObject.peerID = peerID;
  localStorageObject.skillLevel = skillLevel;
  localStorageObject.userKey = userKey;

  localStorage.setItem(
    'localStorageObject',
    JSON.stringify(localStorageObject)
  );

  if (DEBUGMODE) {
    console.log(
      'setLocalStorage(): localStorageObject:',
      JSON.stringify(localStorageObject)
    );
  }

  return;
}

// Tests to see if a player object has previously been set to local storage
export function testForLocalStorageData() {
  const storedObject = loadLocalStorage();
  console.log(
    'testForLocalStorageData(): user localStorageObject:',
    JSON.stringify(storedObject)
  );
  return;
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

if (DEBUGMODE) {
  console.log(`localStorage.js running`);
}

/////////////////////////////////////////////////////////////////////////////////////////
// CODE END
