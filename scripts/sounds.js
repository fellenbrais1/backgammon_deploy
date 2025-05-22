/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Logic to play dice, game, and webpage sounds

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { DEBUGMODE } from './config.js';

//////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

// Sounds
const buttonClickSound = document.getElementById('button_click_sound');
const chatNotificationSound = document.getElementById('chat_sound');
const diceRollSound = document.getElementById('dice_roll_sound');
const errorSound = document.getElementById('error_sound');
const openingJingleSound = document.getElementById('opening_jingle');
const piecesDealSound = document.getElementById('pieces_deal');
const piecePickUpSound = document.getElementById('piece_pickup');
const piecePutDownSound = document.getElementById('piece_putdown');

// Buttons
const muteButton = document.getElementById('mute_button');

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// All sounds array for use in muting/ unmuting
const allSounds = [
  buttonClickSound,
  chatNotificationSound,
  diceRollSound,
  errorSound,
  openingJingleSound,
  piecesDealSound,
  piecePickUpSound,
  piecePutDownSound,
];

const muteSvgHTML = `<svg
              width="36px"
              height="36px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.2071 7.20711C18.5976 6.81658 18.5976 6.18342 18.2071 5.79289C17.8166 5.40237 17.1834 5.40237 16.7929 5.79289L5.79289 16.7929C5.40237 17.1834 5.40237 17.8166 5.79289 18.2071C6.18342 18.5976 6.81658 18.5976 7.20711 18.2071L18.2071 7.20711Z"
                fill="#fff"
              />
              <path
                d="M10.8639 8.6L15.3 5.87158L10.5716 10.6H8V13.1716L6.33126 14.8403C6.12404 14.5831 6 14.256 6 13.9V10.1C6 9.27157 6.67157 8.6 7.5 8.6H10.8639Z"
                fill="#fff"
              />
              <path
                d="M16 16.2109L12.6673 14.1611L11.2135 15.615L15.7142 18.3831C16.7136 18.9978 18 18.2788 18 17.1055V8.82844L16 10.8284V16.2109Z"
                fill="#fff"
              />
            </svg>`;

const unmuteSvgHTML = `<svg
              width="36px"
              height="36px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 9V9C19.2111 10.8167 19.2111 13.1833 18 15V15"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M8.4172 8.65233L11.5397 6.05023C12.5167 5.23607 14 5.93081 14 7.20256V16.7974C14 18.0692 12.5167 18.7639 11.5397 17.9498L8.4172 15.3477C8.14763 15.123 7.80783 15 7.45693 15H5.5C4.67157 15 4 14.3284 4 13.5V10.5C4 9.67157 4.67157 9 5.5 9H7.45693C7.80783 9 8.14763 8.87698 8.4172 8.65233Z"
                stroke="#fff"
                stroke-width="2"
              />
            </svg>`;

/////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

// To toggle the mute status of all sound elements on the webpage
muteButton.addEventListener('click', () => {
  toggleMute();
  playClickSound();
  return;
});

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Automatically mutes sounds and sets default mute button text content
function initializeSounds() {
  toggleMute();
  muteButton.innerHTML = muteSvgHTML;
  muteButton.classList.add('unmute');
}

// Plays the 'chat notification' sound
export function playChatNotificationSound() {
  chatNotificationSound.play();
  return;
}

// Plays the 'button click' sound
export function playClickSound() {
  buttonClickSound.play();
  return;
}

// Plays the 'dice roll' sound
export function playDiceRollSound() {
  diceRollSound.play();
  return;
}

// Plays the 'error' sound
export function playErrorSound() {
  errorSound.play();
  return;
}

// Plays the 'opening jingle' sound
export function playOpeningJingleSound() {
  openingJingleSound.play();
  return;
}

// Plays the 'pieces deal' sound
export function playPiecesDealSound() {
  piecesDealSound.play();
  return;
}
// Plays the 'piece pick up' sound
export function playPiecePickupSound() {
  piecePickUpSound.play();
  return;
}

// Plays the 'piece put down' sound
export function playPiecePutDownSound() {
  piecePutDownSound.play();
  return;
}

// Toggles the volume of all sound elements between 1 and 0
function toggleMute() {
  allSounds.forEach((element) => {
    element.volume = element.volume === 1.0 ? 0.0 : 1.0;
  });

  if (DEBUGMODE) {
    const muteStatus =
      buttonClickSound.volume === 1.0 ? 'Mute removed' : 'Mute applied';
    console.log(
      'toggleMute(): muteStatus:',
      muteStatus,
      '- volume of all sounds set to:',
      buttonClickSound.volume
    );
  }

  toggleMuteButton();
  return;
}

// Toggles the innerHTML svg content and title of the muteButton element based on the current volume of webpage sounds
function toggleMuteButton() {
  muteButton.innerHTML = '';

  if (muteButton.classList.contains('unmute')) {
    console.log('toggleMuteButton(): Toggling mute button to "mute" status');
    muteButton.innerHTML = unmuteSvgHTML;
    muteButton.classList.remove('unmute');
    muteButton.classList.add('mute');
    muteButton.title = 'Mute';
  } else if (muteButton.classList.contains('mute')) {
    console.log('toggleMuteButton(): Toggling mute button to "unmute" status');
    muteButton.innerHTML = muteSvgHTML;
    muteButton.classList.remove('mute');
    muteButton.classList.add('unmute');
    muteButton.title = 'Unmute';
  }
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

initializeSounds();

if (DEBUGMODE) {
  console.log(`sounds.js running`);
}

/////////////////////////////////////////////////////////////////////////////////////////
// CODE END
