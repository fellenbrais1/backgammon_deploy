/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Logic to display movement messages etc. using the display box element

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { DEBUGMODE } from './welcome.js';
import { playClickSound, playErrorSound } from './sounds.js';

//////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

const displayBox = document.querySelector('.display_box');

// TODO - To be removed later
const testButton3 = document.querySelector('.test_button3');

/////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

// TODO - To be removed later
// Allows testing of the display box
testButton3.addEventListener('click', () => {
  playClickSound();
  showDisplayBox(`Test button 3: This is a test of the display box!`);
  return;
});

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Triggers the reveal and disappearance of the display box
export function showDisplayBox(message, duration = '3000') {
  playErrorSound();

  const displayBoxMessage = `<p>❗${message}</p>`;
  displayBox.innerHTML = displayBoxMessage;
  displayBox.classList.add('show');

  if (DEBUGMODE) {
    console.log('showDisplayBox(): displayBox:', displayBox);
  }

  setTimeout(() => {
    displayBox.classList.remove('show');
  }, duration);

  return;
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

if (DEBUGMODE) {
  console.log(`displayBox.js is running`);
}

/////////////////////////////////////////////////////////////////////////////////////////
// CODE END
