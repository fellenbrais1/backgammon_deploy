/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Handles message logic for the chat section

'use strict';

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { sendRPC } from './chat.js';
import { DEBUGMODE } from './welcome.js';
import { loadLocalStorage } from './localStorage.js';
import { gamePlayers } from './modals.js';
import { playChatNotificationSound } from './sounds.js';

/////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

const chatDisplay = document.querySelector('.chat_display');
const chatInput = document.getElementById('chat_input');

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Used to alternate messaging format classes
let opponentMessageStyleToggle = false;
let userMessageStyleToggle = false;

//////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

// Allows processing of a received message
window.addEventListener('message', (event) => {
  const receivedMessage = event.data;
  handleMessageFromParent(receivedMessage);
  return;
});

// Sends a typed message when pressing enter in the chat input box
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addChatMessage();
  }

  return;
});

//////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Captures a user's chat message from the input box and displays it
function addChatMessage() {
  const message = chatInput.value;

  const sanitisedMessage = sanitizeMessage(message);
  const messageHTML = createChatMessage(sanitisedMessage);

  chatInput.value = '';

  sendRPC('chat', sanitisedMessage);
  postChatMessage(messageHTML);
  displayLatestMessage();
  return;
}

// Allows a game start notification to be added to the chat display element
function addGameNotification(HTML) {
  playChatNotificationSound();
  chatDisplay.insertAdjacentHTML('beforeend', HTML);
  return;
}

// Assembles and returns an HTML string literal to add to the chat display element
function createChatMessage(message) {
  const messageClass = userMessageStyleToggle ? 'chat_entry_a' : 'chat_entry_b';

  const displayName = getUserDisplayName();
  const messageHTML = `<p class='${messageClass}'><strong class='player_name'>${displayName}:</strong> ${message}</p>`;

  userMessageStyleToggle = userMessageStyleToggle ? false : true;
  return messageHTML;
}

// Creates and returns an HTML string literal from a message received from an opponent
function createOpponentMessage(opponentName, message) {
  if (DEBUGMODE) {
    console.log('createOpponentMessage(): message:', message);
  }

  const messageClass = opponentMessageStyleToggle
    ? 'chat_entry_e'
    : 'chat_entry_f';

  const messageHTML = `<p class='${messageClass}'><strong class='opponent_name'>${opponentName}:</strong> ${message}</p>`;

  opponentMessageStyleToggle = opponentMessageStyleToggle ? false : true;
  return messageHTML;
}

// Scrolls the chat display element down to the latest message
function displayLatestMessage() {
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
  return;
}

// Sends and displays system messages in the chat display element when a player has forfeited a game
export function forfeitMessage() {
  let chatHTML, chatHTML2;
  const displayName = getUserDisplayName();
  const opponentName = getOpponentName();

  chatHTML = `<p class='chat_entry_c'><strong>${displayName}</strong> has decided to forfeit the game.</p>`;
  chatHTML2 = `<p class='chat_entry_d'><strong>${opponentName}</strong> wins the game!</p>`;

  addGameNotification(chatHTML);

  setTimeout(() => {
    addGameNotification(chatHTML2);
  }, 500);

  return;
}

// Captures and returns the opponent's name for use in displaying chat messages
export function getOpponentName() {
  const opponentName = gamePlayers.opponent.displayName;
  return opponentName;
}

// Captures and returns the user's display name or 'Guest' if one is not set
function getUserDisplayName() {
  const storedObject = loadLocalStorage();
  const displayName = storedObject.displayName;
  return displayName;
}

// Generates and displays a chat display message received from an opponent
export function opponentMessage(opponentName, message) {
  if (DEBUGMODE) {
    console.log('opponentMessage(): message:', message);
  }

  const messageHTML = createOpponentMessage(`${opponentName}`, `${message}`);
  postChatMessage(messageHTML);
  displayLatestMessage();
  return;
}

// Adds a chat message HTML string literal to the chat display element's innerHTML
function postChatMessage(messageHTML, position = 'beforeend') {
  playChatNotificationSound();
  chatDisplay.insertAdjacentHTML(position, messageHTML);
  return;
}

// Removes HTML tags etc. from a typed chat message in order to prevent odd behaviour
function sanitizeMessage(message) {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Displays information messages in the chat display when starting a new game
export function startGameMessages(opponentName) {
  let chatHTML, chatHTML2;
  chatHTML = `<p class='chat_entry_c'>Starting a game. Say hello!</p>`;

  const displayName = getUserDisplayName();
  chatHTML2 = `<p class='chat_entry_d'><strong>${displayName}</strong> is playing against <strong>${opponentName}!</strong></p>`;

  addGameNotification(chatHTML);

  setTimeout(() => {
    addGameNotification(chatHTML2);
  }, 500);

  return;
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

if (DEBUGMODE) {
  console.log(`messages.js running`);
}

//////////////////////////////////////////////////////////////////////////////////////////
// CODE END
