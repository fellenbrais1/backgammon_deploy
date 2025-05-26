/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Logic to handle messages received from an opponent

"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

// TODO - Copy this code to the working branch (1 import)
import { database } from "./firebaseConfig.js";

import { playbackDiceRoll, playbackMove, playbackEndTurn } from "./app.js";
import { closeConn } from "./chat.js";
import { DEBUGMODE } from "./config.js";
import {
  forfeitMessage,
  getOpponentName,
  opponentMessage,
} from "./messages.js";
import { changeModalContent } from "./modals.js";
import { challengerName } from "./welcome.js";

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Holds the opponent's player object
let activeOpponent = "";

// Flag to block unwanted challenges and messages
let blockProcessFlag = false;

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// TODO - Copy this code to the working branch (1 function)
// **NEW:** Function to initialize Firebase variables in this module
async function initializeFirebaseInDispatch() {
  const firebaseVariables = await getFirebaseVariables();

  if (firebaseVariables) {
    const database = firebaseVariables.DATABASE;
    if (DEBUGMODE) {
      console.log("dispatch.js: Firebase database initialized:", database);
    }
    return database;
  } else {
    console.error(
      "dispatch.js: Failed to get Firebase variables. Database will not be available."
    );
  }
}

// Stops incoming messages from being processed by manipulating a flag
export function blockProcess() {
  blockProcessFlag = true;

  if (DEBUGMODE) {
    console.log(
      "blockProcess(): Incoming message processing blocked, blockProcessFlag:",
      blockProcessFlag
    );
  }

  return;
}

// Handles a message sent from the opponent in an appropriate way
export function dispatchMessage(parsedData) {
  console.log(
    "dispatchMessage(): Sending message:",
    JSON.stringify(parsedData)
  );

  if (DEBUGMODE) {
    console.log("dispatchMessage(): Method:", parsedData.method);
    console.log("dispatchMessage(): Params:", parsedData.params);
  }

  // Early exit if this flag is set to true, used to block challenges when already in game
  if (blockProcessFlag) {
    return;
  }

  // Processes the received message according to its method
  switch (parsedData.method) {
    case "chat":
      if (DEBUGMODE) {
        console.log(
          "dispatchMessage(): Send:",
          parsedData.params,
          "- data to eventChatMessage()"
        );
      }

      eventChatMessage(parsedData.params);
      break;
    case "move":
      if (DEBUGMODE) {
        console.log(
          "dispatchMessage(): Send:",
          JSON.stringify(parsedData.params),
          "- data to playbackMove()"
        );
      }

      playbackMove(parsedData.params);
      break;
    case "diceRoll":
      if (DEBUGMODE) {
        console.log(
          "dispatchMessage(): Send:",
          JSON.stringify(parsedData.params),
          "- data to playbackDiceRoll()"
        );
      }

      playbackDiceRoll(parsedData.params);
      break;
    case "challengeSent":
      if (DEBUGMODE) {
        console.log(
          "dispatchMessage(): Send:",
          parsedData.params,
          "- data to eventChallengeSent()"
        );
      }

      eventChallengeSent(parsedData.params);
      break;
    case "challengeAccepted":
      if (DEBUGMODE) {
        console.log("dispatchMessage(): Calling eventChallengeAccepted()");
      }

      eventChallengeAccepted();
      break;
    case "challengeRejected":
      if (DEBUGMODE) {
        console.log("dispatchMessage(): Calling eventChallengeRejected()");
      }

      eventChallengeRejected();
      break;
    case "challengeCancel":
      if (DEBUGMODE) {
        console.log(`dispatchMessage(): Calling eventChallengeCancel()`);
      }

      eventChallengeCancel(parsedData.params);
      break;
    case "forfeitGame":
      if (DEBUGMODE) {
        console.log(
          "dispatchMessage(): Send:",
          parsedData.params,
          "- data to eventForfeitGame()"
        );
      }

      eventForfeitGame(parsedData.params);
      break;
    case "gameOver":
      if (DEBUGMODE) {
        console.log(
          "dispatchMessage(): Send:",
          parsedData.params,
          "- data to eventGameOver()"
        );
      }

      eventGameOver(parsedData.params);
      break;
    case "endTurn":
      if (DEBUGMODE) {
        console.log("dispatchMessage(): Calling playbackEndTurn()");
      }

      const opponentName = getOpponentName();
      playbackEndTurn(opponentName);
      break;
  }
}

// Allows incoming messages to be processed by manipulating a flag
export function enableProcess() {
  blockProcessFlag = false;

  if (DEBUGMODE) {
    console.log(
      "blockProcess(): Incoming message processing enabled, blockProcessFlag:",
      blockProcessFlag
    );
  }
  return;
}

// Handles a received 'challengeAccepted' message and displays a modal
function eventChallengeAccepted() {
  if (DEBUGMODE) {
    console.log(
      "eventChallengeAccepted(): Challenge accepted by:",
      challengerName
    );
  }

  changeModalContent("challengeAccepted", challengerName);
  return;
}

// Handles a received 'challengeCancel' message and displays a modal
function eventChallengeCancel(challengerName) {
  if (DEBUGMODE) {
    console.log(
      "eventChallengeCancel(): Challenge cancelled by:",
      challengerName
    );
  }

  // Blocks other messages from being handled along this connection as challenge has been cancelled
  blockProcess();

  changeModalContent("challengeCancel", challengerName);
  closeConn();
  return;
}

// Handles a received 'challengeRejected' message and displays a modal
function eventChallengeRejected() {
  if (DEBUGMODE) {
    console.log(
      "eventChallengeRejected(): Challenge rejected by:",
      challengerName
    );
  }

  changeModalContent("challengeRejected", challengerName);
  closeConn();
  return;
}

// Handles a received 'chat' message and displays it
function eventChatMessage(data) {
  const chatMessage = data;

  if (DEBUGMODE) {
    console.log("eventChatMessage(): Chat message received:", chatMessage);
  }

  const opponentName = getOpponentName();
  opponentMessage(opponentName, chatMessage);
  return;
}

// Handles a received 'challengeSent' message and displays a modal
async function eventChallengeSent(message) {
  activeOpponent = await fetchPlayerByKey(message);
  const timeStamp = Date.now();

  if (DEBUGMODE) {
    console.log(
      "eventChallengeSent(): Challenge received from:",
      activeOpponent.displayName,
      "- at:",
      timeStamp
    );
  }

  changeModalContent("challengeReceived", [activeOpponent.displayName]);
  return;
}

// Handles a 'forfeitGame' message from an opponent and displays a modal
function eventForfeitGame(message) {
  const opponentName = message;
  forfeitMessage();

  if (DEBUGMODE) {
    console.log("eventForfeitGame(): Game forfeitted by:", opponentName);
  }

  changeModalContent("forfeitNotification", opponentName);
  return;
}

// Handles a received 'gameOver' message and displays a modal
function eventGameOver(message) {
  let gameOverMessage = [];
  const opponentName = getOpponentName();

  gameOverMessage[0] = message;
  gameOverMessage[1] = opponentName;

  if (DEBUGMODE) {
    console.log(
      "eventGameOvwer(): Chat message received:",
      JSON.stringify(gameOverMessage)
    );
  }

  changeModalContent("eventGameOverLose", gameOverMessage);
  return;
}

// Gets the player object for a specific player from the database
async function fetchPlayerByKey(playerKey) {
  try {
    const playerRef = database.ref("players").child(playerKey);
    const snapshot = await playerRef.get();

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log(
        "fetchPlayerByKey(): Error: No player found with the key:",
        playerKey
      );
      return null;
    }
  } catch (error) {
    console.error("fetchPlayerByKey(): Error retrieving player:", error);
    return null;
  }
}

// TODO - Copy this code to the working branch (all autorunning code)
/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

setTimeout(() => {
  if (DEBUGMODE) {
    console.log(`dispatch.js running`);
    console.log("dispatch.js database (after async init):", database); // This should now show the actual database object
  }
}, 2000);

// CODE END
/////////////////////////////////////////////////////////////////////////////////////////
