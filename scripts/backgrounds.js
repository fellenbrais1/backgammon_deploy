/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Test logic to toggle through example backgrounds for the webpage
// TODO - To be removed later?

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { DEBUGMODE } from './welcome.js';

/////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

const pagebox = document.querySelector('.pagebox');

const testButton5 = document.querySelector('.test_button5');

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

const defaultBackgroundUrl = `url(../images/background_triangles.png)`;

const background1Url = `url(../images/backgrounds/test1.jpg)`;
const background2Url = `url(../images/backgrounds/test2.avif)`;
const background3Url = `url(../images/backgrounds/test3.jpg)`;
const background4Url = `url(../images/backgrounds/test4.jpg)`;
const background5Url = `url(../images/backgrounds/test5.jpg)`;
const background6Url = `url(../images/backgrounds/test6.jpeg)`;
const background7Url = `url(../images/backgrounds/test7.jpeg)`;
const background8Url = `url(../images/backgrounds/test8.jpeg)`;

const backgroundArray = [
  defaultBackgroundUrl,
  background1Url,
  background2Url,
  background3Url,
  background4Url,
  background5Url,
  background6Url,
  background7Url,
  background8Url,
];

let currentBackground = 0;

/////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

testButton5.addEventListener('click', () => {
  toggleBackgrounds();
});

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

function toggleBackgrounds() {
  currentBackground += 1;

  if (currentBackground === 9) {
    currentBackground = 0;
  }

  let backgroundToUse = backgroundArray[currentBackground];
  pagebox.style.backgroundImage = backgroundToUse;

  console.log(
    'Toggling backgrounds, now displaying background:',
    backgroundToUse
  );
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

// Debug mode checks
// if (DEBUGMODE) {
//   console.log(`backgrounds.js running`);
// }

// CODE END
/////////////////////////////////////////////////////////////////////////////////////////
