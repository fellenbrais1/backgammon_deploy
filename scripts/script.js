/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Handles webpage logic and connects to the game logic in app.js

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { startGame } from './app.js';
import { DEBUGMODE } from './welcome.js';
import { clearLocalStorage, testForLocalStorageData } from './localStorage.js';
import { playOpeningJingleSound } from './sounds.js';
import { checkForLocalStorageObject, welcomeNameForm } from './welcome.js';

/////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

// Ad section
export const adNotification = document.querySelector('.ad_notification');

const adSection = document.querySelector('.adbox');
const currentAdLink = document.querySelector('.ad_link');
const currentAdPicture = document.querySelector('.ad_picture');

// Game board section
const boardAnnotationsSection = document.querySelector(
  '.board_annotations_section'
);
const boardMessage = document.querySelector('.board_message');
const imbedGame = document.getElementById('content_container');

// Return section
const returnSection = document.querySelector('.return_section');

// Welcome section
const welcomeSection = document.querySelector('.welcome_section');

// TODO - To be removed later
const testButton1 = document.querySelector('.test_button1');
const testButton2 = document.querySelector('.test_button2');

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Ad objects
const ad1 = {
  altText: 'Cash 4 Gold Advertisement',
  href: 'https://www.cash4goldonline.co.uk/',
  source: 'images/cash4gold.jpg',
  title: 'Cash 4 Gold Online',
};

const ad2 = {
  altText: 'Kier Starmer Advertismeent',
  href: 'https://en.wikipedia.org/wiki/Keir_Starmer',
  source: 'images/kier.avif',
  title: 'Kier Starmer Action Figures',
};

const ad3 = {
  altText: 'Burger King Advertisment',
  href: 'https://youtube.com/watch?v=2JaCzLZTYAE',
  source: 'images/chocowhopper.webp',
  title: 'The NEW Chocolate Whopper',
};

const ad4 = {
  altText: 'Viz Swan Advertisment',
  href: 'https://www.amazon.co.uk/Brainbox-Candy-Official-Advert-Birthday/dp/B0BMGXMB61',
  source: 'images/vizswan.jpg',
  title: 'Retrain as a Swan Today',
};

const ad5 = {
  altText: 'Japanese Nuclear Waste Advertisment',
  href: 'https://www.globaltimes.cn/page/202104/1221726.shtml',
  source: 'images/hokusaiNuke.jpeg',
  title: 'Japanese Nuclear Waste Near You!',
};

const ad6 = {
  altText: 'Baby Gizmo Advertismement',
  href: 'https://fastshow.fandom.com/wiki/Chanel_9_Neus',
  source: 'images/gizmo.jpg',
  title: 'Baby Gizmo Action Pumpo',
};

const adList = [ad1, ad2, ad3, ad4, ad5, ad6];

// Allows cycling of ads without repeats
let currentAdNumber = 0;

//////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

// Displays the main elements and sets an interval to cycle site ads
window.addEventListener('load', () => {
  // Calls startGame telling it not to assign players and that the caller is not a challenger
  startGame(false, false);
  showMainDisplay();

  // Logs content of storage object in debug mode
  if (DEBUGMODE) {
    testForLocalStorageData();
  }

  // Displays the game board
  imbedGame.classList.add('show');
  imbedGame.classList.remove('no_pointer_events');

  setInterval(imgAdCycler, 15000);
  return;
});

// TODO - To be removed later
// Clears the local storage object set previously in order to test resetting the user's player object
testButton1.addEventListener('click', () => {
  console.log(
    `Test button 1: Contents of localStorageObject reset to default values`
  );
  clearLocalStorage();
  window.location.reload();
  return;
});

// TODO - To be removed later
// Tests the display of the turn message notification in the middle of the board
testButton2.addEventListener('click', () => {
  console.log(`Test button 2: displaying turn message`);
  displayTurnMessage('JonathanCreek');
  return;
});

//////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Displays a message in the board annotations section to say which player's turn it is
export function displayTurnMessage(player, duration = '2000') {
  boardMessage.textContent = `${player}'s turn!`;

  setTimeout(() => {
    boardAnnotationsSection.classList.add('reveal_translucent');
  }, 500);

  setTimeout(() => {
    boardAnnotationsSection.classList.remove('reveal_translucent');
  }, duration);

  return;
}

// Cycles through the available ads using random numbers
function imgAdCycler() {
  setTimeout(() => {
    const oldAdNumber = currentAdNumber;

    while (oldAdNumber === currentAdNumber) {
      currentAdNumber = Math.round(Math.random() * (adList.length - 1));
    }

    currentAdPicture.src = adList[currentAdNumber].source;
    currentAdPicture.title = adList[currentAdNumber].title;
    currentAdPicture.alt = adList[currentAdNumber].altText;
    currentAdLink.href = adList[currentAdNumber].href;
  }, 500);

  return;
}

// Shows the page's main elements and determines page flow
function showMainDisplay() {
  playOpeningJingleSound();
  boardAnnotationsSection.classList.add('reveal_translucent');

  // Checks if there is valid data in the local storage object and determines which page flow to follow, welcome or return
  const doesUserAlreadyExist = checkForLocalStorageObject();

  if (DEBUGMODE) {
    console.log(
      'showMainDisplay(): doesUserAlreadyExist:',
      doesUserAlreadyExist
    );
  }

  setTimeout(() => {
    if (doesUserAlreadyExist) {
      // Return page flow
      returnSection.classList.add('reveal');
    } else {
      // Welcome page flow
      welcomeSection.classList.add('reveal');
    }

    adSection.classList.add('reveal');
    adNotification.classList.add('show');

    // Sets up the board annotation section with custom content without a removal delay
    boardMessage.textContent = `Have a go at moving the pieces!`;
  }, 1000);

  setTimeout(() => {
    if (doesUserAlreadyExist) {
      // Return page flow
      returnSection.classList.add('focus_element_thick');
    } else {
      // Welcome page flow
      welcomeSection.classList.add('focus_element_thick');
    }
  }, 500);

  setTimeout(() => {
    welcomeNameForm.classList.add('focus_element');
  }, 500);

  return;
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

// Debug mode checks
if (DEBUGMODE) {
  console.log(`script.js running`);
}

// CODE END
//////////////////////////////////////////////////////////////////////////////////////////
