//////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Updates the HTML content of the modal element based on when it is called by changeModalContent()

'use strict';

//////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { startGame } from './app.js';
import {
  assignConn,
  changeInGameStatus,
  closeConn,
  defineOpponent,
  sendRPC,
  shutDownRPC,
} from './chat.js';
import { DEBUGMODE } from './welcome.js';
import { blockProcess, enableProcess } from './dispatch.js';
import { clearLocalStorage, loadLocalStorage } from './localStorage.js';
import { forfeitMessage, startGameMessages } from './messages.js';
import { adNotification } from './script.js';
import { playClickSound, playOpeningJingleSound } from './sounds.js';
import {
  activeOpponent,
  addLanguageFlags,
  changeDetailsFlagStatus,
  pauseRefreshPopulatePlayers,
  playersLanguageText,
  playerPairingChallengee,
  playerPairingUserChallenge,
  restartRefreshPopulatePlayers,
} from './welcome.js';

export const BUTTON_RESPONSE = Object.freeze({
  BUTTON_YES: 'yes',
  BUTTON_NO: 'no',
});

//////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

// Sections
const chatSection = document.querySelector('.chat_section');
const modalSection = document.querySelector('.modal_section');
const playersSection = document.querySelector('.players_section');
const returnSection = document.querySelector('.return_section');
const welcomeSection = document.querySelector('.welcome_section');

const rulesSection = document.querySelector('.rules_section');
const rulesXButton = document.querySelector('.rules_x_button');

const otherGamesSection = document.querySelector('.other_games_section');
const otherGamesXButton = document.querySelector('.other_games_x_button');
const otherGamesDisplay = document.querySelector('.other_games_display');

// Data fields
const welcomeName = document.getElementById('welcome_name_input');
const welcomeSkillLevel = document.getElementById('skill_level_text');
const welcomeLanguages = document.getElementById('language_text');

const youName = document.querySelector('.you_name');
const youSkill = document.querySelector('.you_skill');

// Steps
const step2Div = document.querySelector('.step2');
const step3Div = document.querySelector('.step3');
const step4Div = document.querySelector('.step4');

//////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Variables that hold player information
export let gamePlayers;

let activeOpponentHere;

// Counter variables
let counterInterval;
let counterValue = 0;

// Flag to block incoming challenges while in a challenge or game
let challengeBlocker = false;

// Other games variables
let otherGamesBackgammonButton;
let otherGamesMurderMansionButton;
let otherGamesPopulatedFlag = false;
const currentGameFlag = 'Backgammon';

const otherGamesBackgammonButtonHTML = `<div class="game_button_backgammon" title="Backgammon">
    <img src="images/MOMABackgammon.png" alt="Backgammon game picture" />
    <p>Backgammon</p>
  </div>`;

const otherGamesMurderMansionButtonHTML = `<div class="game_button_murder_mansion" title="Murder Mansion">
  <img src="images/murderMansion.jpg" alt="Murder Mansion game picture" />
  <p>Murder Mansion</p>
</div>`;

const otherGamesHTML = [
  otherGamesBackgammonButtonHTML,
  otherGamesMurderMansionButtonHTML,
];

// Modal HTML variables
const challengeCancelModalHTML = `<section class="modal_message_section red_background">
          <div class="challenge_received_block">
            <p class="modal_section_text_big no_select" id='challenge_received_message_text'>CHALLENGE CANCELLED</p>
            <p class="modal_section_text no_select" id='challenge_cancel_opponent_name'>
              {Other player} has rescinded their challenge!
            </p>
              <p
                class="modal_section_button button button_red no_select center_modal_button medium_margin_top"
                title="Cancel Challenge"
              >
                Ok
              </p>
          </div>
        </section>`;

const challengeModalHTML = `<section class="modal_message_section purple_background">
            <div class="challenge_block">
              <p class="modal_section_text_big no_select">CHALLENGE SENT</p>
              <p class="modal_section_text no_select" id='challenge_opponent_name'></p>
              <p class="modal_section_text challenge_text no_select" id='challenge_message_text'>Waiting for a response...</p>
              <p class="modal_section_button button_red button center_modal_button no_margin_top no_select" title="Cancel Challenge">
                Cancel
              </p>
            </div>
            <p class='challenge_counter'>0 s</p>
          </section>`;

const challengeModalAcceptedHTML = `<section class="modal_message_section light_green_background">
          <div class="challenge_block">
            <p class="modal_section_text_big no_select">CHALLENGE SENT</p>
            <p class="modal_section_text no_select" id='challenge_accepted_opponent_name'></p>
            <p class="modal_section_text no_select" id='challenge_accepted_message_text'>Waiting for a response...</p>
          </div>
        </section>`;

const challengeReceivedModalHTML = `<section class="modal_message_section purple_background">
            <div class="challenge_received_block">
              <p class="modal_section_text_big no_select" id='challenge_received_message_text'>CHALLENGE RECEIVED</p>
              <p class="modal_section_text no_select" id='challenge_received_opponent_name'>
                {Other player} wants to play a game!
              </p>
              <div class="modal_section_buttons">
                <p
                  class="modal_section_button button no_select"
                  title="Cancel Challenge"
                >
                  Accept
                </p>
                <p
                  class="modal_section_button button_red button no_select"
                  title="Cancel Challenge"
                >
                  Decline
                </p>
              </div>
            </div>
          </section>`;

const challengeModalRejectedHTML = `<section class="modal_message_section red_background">
            <div class="challenge_block">
              <p class="modal_section_text_big no_select">CHALLENGE SENT</p>
              <p class="modal_section_text no_select" id='challenge_rejected_opponent_name'></p>
              <p class="modal_section_text no_select" id='challenge_rejected_message_text'>Waiting for a response...</p>
              <p class="modal_section_button button_red center_modal_button button no_margin_top no_select">Ok</p>
            </div>
          </section>`;

const forfeitModalHTML = `<section class="modal_message_section purple_background">
            <div class="forfeit_block">
              <p class="modal_section_text_big no_select">FORFEIT GAME?</p>
              <p class="modal_section_text no_select">
                Are you sure you want to forfeit the game?
              </p>
              <p class="modal_section_text_small no_select">
                You won't get any points for the game and it will be counted as
                a loss
              </p>
              <div class="modal_section_buttons">
                <p class="modal_section_button button no_select">Forfeit</p>
                <p class="modal_section_button button_red button no_select">Cancel</p>
              </div>
            </div>
          </section>`;

const forfeitNotificationModalHTML = `<section class="modal_message_section light_green_background">
          <div class="forfeit_block">
            <p class="modal_section_text_big no_select">VICTORY!</p>
            <p class="modal_section_text no_select" id='forfeit_text'>
              Are you sure you want to forfeit the game?
            </p>
              <p class="modal_section_button button_red center_modal_button button no_select">Ok</p>
          </div>
        </section>`;

const goBackFromPlayersSectionHTML = `<section class='modal_message_section'><p class="modal_section_text big_margin_top no_select">Would you like to return to modify your details?</p>
              <div class='modal_section_buttons'>
              <p class="modal_section_button button no_select" title='Yes'>Yes</p>
              <p class="modal_section_button button_red button no_select" title="No">
                No
              </p>
              </div>
              </section>`;

const incompleteDataHTML = `<section class='modal_message_section'><p class="modal_section_text no_select">Please make sure you have entered a name, chosen a skill level, and chosen at least one language</p>
<p class="modal_section_button button center_modal_button no_select" title='Ok'>Ok</p>
              </section>`;

const movesRemainingHTML = `<section class='modal_message_section'><p class="modal_section_text medium_margin_top no_select" id='moves_remaining_text'>You still have unused moves, are you sure you would like to end your turn?</p>
<p class="modal_section_button button center_modal_button smaller_margin_top no_select" title='Yes'>Yes</p>
<p class="modal_section_button button center_modal_button button_red smaller_margin_top no_select" title='No'>No</p>
</section>`;

const nameExistsHTML = `<section class='modal_message_section'><p class="modal_section_text big_margin_top no_select" id='name_exists_text'>Please choose a different name as NAME has already been taken</p>
<p class="modal_section_button button center_modal_button no_select" title='Ok'>Ok</p>
              </section>`;

const nameLengthProblemHTML = `<section class='modal_message_section'><p class="modal_section_text big_margin_top no_select">Please enter a display name between 3 and 12 characters long</p>
<p class="modal_section_button button center_modal_button no_select" title='Ok'>Ok</p>
              </section>`;

const noChallengerHTML = `<section class='modal_message_section'><p class="modal_section_text medium_margin_top no_select">Please select a player to challenge, then press the challenge button, or, wait to be challenged!</p>
<p class="modal_section_button button center_modal_button no_select" title='Ok'>Ok</p>
              </section>`;

const noNameHTML = `<section class='modal_message_section'><p class="modal_section_text big_margin_top no_select">Please enter a display name to use in the game</p>
              <p class="modal_section_button button center_modal_button no_select" title='Ok'>Ok</p>
                            </section>`;

const noPlayersOnlineHTML = `<section class='modal_message_section'><p class="modal_section_text medium_margin_top no_select">There are currently no other players online, please wait for another player to join before sending a challenge (Player list will periodically update)</p>
              <p class="modal_section_button button center_modal_button smaller_margin_top no_select" title='Ok'>Ok</p>
                            </section>`;

const notYouHTML = `<section class='modal_message_section'><p class="modal_section_text big_margin_top no_select">Would you like to enter new player details?</p>
<div class='modal_section_buttons'>
<p class="modal_section_button button no_select" title='Yes'>Yes</p>
<p class="modal_section_button button_red button no_select" title="No">
  No
</p>
</div>
</section>`;

const youLoseHTML = `<section class="modal_message_section red_background">
      <div class="lose_block">
        <p class="modal_section_text_big no_select">DEFEAT!</p>
        <p class="modal_section_text no_select" id='lose_text'>
          You lose!
        </p>
        <p class="modal_section_text no_select" id='lose_text2'>
          You lose!
        </p>
          <p class="modal_section_button button_red center_modal_button button smaller_margin_top no_select">Ok</p>
      </div>
    </section>`;

const youWinHTML = `<section class="modal_message_section light_green_background">
        <div class="win_block">
          <p class="modal_section_text_big no_select">VICTORY!</p>
          <p class="modal_section_text no_select" id='win_text'>
            You win!
          </p>
          <p class="modal_section_text no_select" id='win_text2'>
            You win!
          </p>
            <p class="modal_section_button center_modal_button button smaller_margin_top no_select">Ok</p>
        </div>
      </section>`;

//////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Adds the eventListeners for the buttons in the chat section when a game starts
function addChatButtons() {
  const rulesButton = document.querySelector('.rules_button');
  const otherGamesButton = document.querySelector('.games_button');

  // TODO - Commented out for now as they will be put in the board object instead
  // const endTurnButton = document.querySelector('.end_turn_button');
  // const forfeitGameButton = document.querySelector('.forfeit_game_button');

  // Displays the rules section
  rulesButton.addEventListener('click', () => {
    playClickSound();

    setTimeout(() => {
      rulesSection.classList.add('reveal');
      chatSection.classList.remove('reveal');
    }, 500);

    return;
  });

  // Hides the rules section
  rulesXButton.addEventListener('click', () => {
    playClickSound();

    setTimeout(() => {
      rulesSection.classList.remove('reveal');
      chatSection.classList.add('reveal');
    }, 500);

    return;
  });

  // Shows the other games section
  otherGamesButton.addEventListener('click', () => {
    playClickSound();

    setTimeout(() => {
      otherGamesSection.classList.add('reveal');
      chatSection.classList.remove('reveal');
      populateOtherGames(otherGamesHTML);
      addCurrentGameClass(currentGameFlag);
      otherGamesPopulatedFlag = true;
    }, 500);

    return;
  });

  // Hides the other games button
  otherGamesXButton.addEventListener('click', () => {
    playClickSound();

    setTimeout(() => {
      otherGamesSection.classList.remove('reveal');
      chatSection.classList.add('reveal');
    }, 500);

    return;
  });

  // TODO - Commented out for now but may be needed by Dad later
  // Endturn button
  // endTurnButton.addEventListener('click', () => {
  //   console.log(`End turn flow`);
  //   const diceThrows = getDiceThrows();
  //   const filteredDiceThrows = diceThrows.filter((value) => value !== 0);
  //   changeModalContent('movesRemaining', filteredDiceThrows);
  //   return;
  // });

  // TODO - Commmented out for now but may be needed by Dad later
  // Forfeit game button
  // forfeitGameButton.addEventListener('click', async () => {
  //   console.log(`Forfeit game flow`);
  //   console.log(activeOpponentHere.displayName);
  //   changeModalContent('forfeitGame');
  //   return;
  // });

  return;
}

// Adds a class to the game button of the current game, preventing it from being clicked and highlighting it
function addCurrentGameClass(currentGameFlag) {
  if (otherGamesPopulatedFlag === false) {
    switch (currentGameFlag) {
      case 'Backgammon':
        otherGamesBackgammonButton.classList.toggle('game_button_current');
        break;
      case 'Murder Mansion':
        otherGamesMurderMansionButton.classList.toggle('game_button_current');
        break;
    }
  }

  return;
}

// Blocks the processing of challenges
function blockChallenges() {
  challengeBlocker = true;
  return;
}

// Displays and repopulates all fields when a player choses to return to change their details
export function changeDetailsPopulateFields() {
  // Reveal all of the elements on the welcome section
  step2Div.classList.add('reveal');
  step3Div.classList.add('reveal');
  step4Div.classList.add('reveal');

  const storedObject = loadLocalStorage();
  welcomeName.value = storedObject.displayName;

  // Populates the skill choice element based on previously chosen skill level
  let skillData = '';
  switch (storedObject.skillLevel) {
    case '🏆':
      skillData = '🏆 Beginner';
      break;
    case '🏆🏆':
      skillData = '🏆🏆 Advanced';
      break;
    case '🏆🏆🏆':
      skillData = '🏆🏆🏆 Master';
      break;
  }

  welcomeSkillLevel.textContent = skillData;
  welcomeLanguages.value = storedObject.languages;

  if (DEBUGMODE) {
    console.log(
      'changeDetailsPopulateFields(): storedObject.languages:',
      storedObject.languages
    );
    console.log(
      'changeDetailsPopulateFields(): languagesChosenReturn:',
      languagesChosenReturn
    );
  }

  addLanguageFlags(0, true);

  youName.textContent = storedObject.displayName;
  youSkill.textContent = storedObject.skillLevel;

  // Changes the flag back to a state where it cannot process a return to change details as before
  changeDetailsFlagStatus();

  return;
}

// Changes the HTML content of the modal element depending on the supplied tag argument
export async function changeModalContent(tag = 'challengeSent', data = '') {
  if (DEBUGMODE) {
    console.log('changeModalContent(): DATA IS:', JSON.stringify(data));
  }

  showModal();

  // Displays modals appropriately based on the tag
  switch (tag) {
    case 'challengeAccepted':
      const storedObject2 = loadLocalStorage();
      const userKey2 = storedObject2.userKey;
      try {
        changeInGameStatus(userKey2, true);
      } catch (error) {
        if (DEBUGMODE) {
          console.log(
            'changeModalContent(): Updating user inGame status failed with error:',
            error
          );
        }
      }

      stopCounter();

      modalSection.innerHTML = challengeModalAcceptedHTML;
      modalSection.style.backgroundColor = 'lightgreen';

      const challengeInformation2 = document.getElementById(
        'challenge_accepted_message_text'
      );
      const challengerNameField2 = document.getElementById(
        'challenge_accepted_opponent_name'
      );

      challengerNameField2.textContent = `Challenging ${data}`;
      challengeInformation2.textContent = `Challenge has been accepted!`;

      setTimeout(() => {
        playersSection.classList.remove('reveal');
        welcomeSection.classList.remove('reveal');
        returnSection.classList.remove('reveal');
        chatSection.classList.add('reveal');
        removeModal();
        startGameMessages(gamePlayers.opponent.displayName);
        const isChallenger = true;

        if (DEBUGMODE) {
          console.log(
            `changeModalContent(): Player is challenger for startGame: yes`
          );
        }

        pauseRefreshPopulatePlayers();

        playOpeningJingleSound();
        startGame(true, isChallenger);
      }, 2000);

      break;

    case 'challengeCancel':
      modalSection.innerHTML = challengeCancelModalHTML;
      modalSection.classList.add('reveal');

      const challengerNameElement = document.getElementById(
        'challenge_cancel_opponent_name'
      );

      challengerNameElement.textContent = `${data} has rescinded their challenge!`;

      const challengeCancelOkButton = modalSection.querySelector(
        '.modal_section_button'
      );

      // Sets event listeners in the modal
      challengeCancelOkButton.addEventListener('click', () => {
        playClickSound();
        setTimeout(() => {
          enableChallenges();

          restartRefreshPopulatePlayers();

          closeConn();
          enableProcess();

          removeModal();
        }, 1000);
        return;
      });
      break;

    case 'challengeReceived':
      if (challengeBlocker === true) {
        console.log(
          `changeModalContent(): Incoming challenge request blocked as player is currently within a challenge`
        );
        stopCounter();
        removeModal();
        enableChallenges();
        return;
      }

      const storedObject = loadLocalStorage();
      const userKey = storedObject.userKey;

      if (data[0] === activeOpponentHere) {
        console.log(
          `changeModalContent(): Being challenged by the same player as you are playing against - cancelling!`
        );
        stopCounter();
        removeModal();
        enableChallenges();
        return;
      }

      blockChallenges();

      modalSection.innerHTML = challengeReceivedModalHTML;
      modalSection.classList.add('reveal');

      const challengeReceivedText = document.getElementById(
        'challenge_received_message_text'
      );
      const challengerNameText = document.getElementById(
        'challenge_received_opponent_name'
      );
      const acceptButton = modalSection.querySelector('.modal_section_button');
      const declineButton = modalSection.querySelector('.button_red');

      challengerNameText.textContent = `${data[0]} wants to play a game!`;

      const opponentName = data[0];

      // Sets event listeners in the modal
      acceptButton.addEventListener('click', async () => {
        try {
          await changeInGameStatus(userKey, true);
        } catch (error) {
          if (DEBUGMODE) {
            console.log(
              'changeModalContent(): Updating user inGame status failed with error:',
              error
            );
          }
        }

        playClickSound();
        activeOpponentHere = activeOpponent;
        challengeReceivedText.textContent = `You have accepted this challenge!`;

        sendRPC('challengeAccepted', '');

        activeOpponentHere = await defineOpponent(opponentName);

        gamePlayers = await playerPairingChallengee(activeOpponentHere);

        if (DEBUGMODE) {
          console.log(
            'changeModalContent(): activeOpponentHere:',
            activeOpponentHere
          );
          console.log(
            'changeModalContent(): gamePlayers:',
            JSON.stringify(gamePlayers)
          );
        }

        setTimeout(() => {
          playersSection.classList.remove('reveal');
          welcomeSection.classList.remove('reveal');
          returnSection.classList.remove('reveal');
          chatSection.classList.add('reveal');
          removeModal();
          startGameMessages(activeOpponentHere.displayName);
          const isChallenger = false;

          if (DEBUGMODE) {
            console.log(
              `changeModalContent(): Player is challenger for startGame: no`
            );
          }

          pauseRefreshPopulatePlayers();

          playOpeningJingleSound();
          startGame(true, isChallenger);
        }, 3000);
      });

      declineButton.addEventListener('click', () => {
        playClickSound();
        challengeReceivedText.textContent = `You have rejected this challenge!`;
        sendRPC('challengeRejected', '');

        enableChallenges();

        closeConn();

        setTimeout(() => {
          removeModal();
        }, 1000);
      });
      break;

    case 'challengeRejected':
      stopCounter();
      modalSection.innerHTML = challengeModalRejectedHTML;

      const challengeInformation3 = document.getElementById(
        'challenge_rejected_message_text'
      );
      const challengerNameField3 = document.getElementById(
        'challenge_rejected_opponent_name'
      );
      const rejectedOkButton = modalSection.querySelector(
        '.modal_section_button'
      );

      challengerNameField3.textContent = `Challenging ${data}`;

      if (DEBUGMODE) {
        console.log(
          'changeModalContent(): challengerInformation3:',
          challengeInformation3
        );
      }

      challengeInformation3.textContent = `Challenge has been rejected!`;

      // Sets event listeners in the modal
      rejectedOkButton.addEventListener('click', () => {
        playClickSound();

        // Displays the challenge rejected message in debug mode
        if (DEBUGMODE) {
          console.log(`changeModalContent(): Challenge has been rejected.`);
        }

        setTimeout(() => {
          enableChallenges();

          restartRefreshPopulatePlayers();
          removeModal();
        }, 1000);
      });
      break;

    case 'challengeSent':
      if (challengeBlocker === true) {
        if (DEBUGMODE) {
          console.log(
            `changeModalContent(): Outgoing challenge request ignored as player is currently within a challenge`
          );
        }

        stopCounter();
        return;
      }

      if (data === activeOpponentHere) {
        if (DEBUGMODE) {
          console.log(
            `changeModalContent(): Being challenged by the same player as you are playing against - cancelling!`
          );
        }

        stopCounter();
        removeModal();
        enableChallenges();
        return;
      }

      // Stops other challenges from being processed at this time
      blockChallenges();

      startCounter();

      modalSection.innerHTML = challengeModalHTML;
      modalSection.classList.add('reveal');

      const buttonChallengeCancel = modalSection.querySelector('.button_red');
      const challengeInformation = document.getElementById(
        'challenge_message_text'
      );
      const challengerNameField = document.getElementById(
        'challenge_opponent_name'
      );

      challengerNameField.textContent = `Challenging ${data}`;

      // Sets event listeners in the modal
      buttonChallengeCancel.addEventListener('click', () => {
        playClickSound();
        challengeInformation.textContent = 'Cancelling challenge...';

        setTimeout(() => {
          const storedObject = loadLocalStorage();
          const displayName = storedObject.displayName;
          sendRPC('challengeCancel', displayName);

          // Stops other messages from being processed at this time
          blockProcess();

          restartRefreshPopulatePlayers();
          stopCounter();
          shutDownRPC();

          // Closes the connection with this opponent as the challenge has been rejected
          closeConn();

          // Enables incoming challenge requests to be processed again
          enableChallenges();

          removeModal();
        }, 1000);

        // Enables incoming messages to be processed again
        enableProcess();
      });

      // Builds an array of the two player objects involved in the game
      gamePlayers = await playerPairingUserChallenge();

      activeOpponentHere = gamePlayers.opponent;

      if (DEBUGMODE) {
        console.log(
          'changeModalContent(): gamePlayers:',
          JSON.stringify(gamePlayers)
        );
      }

      // Sets up a specific connection to the opponent for the duration of the challenge/ game
      const conn = await assignConn(gamePlayers.opponent);

      if (DEBUGMODE) {
        console.log(
          'changeModalContent(): gamePlayers.opponent:',
          JSON.stringify(gamePlayers.opponent)
        );
      }

      if (conn !== null) {
        const userKey = gamePlayers.you.userKey;

        if (DEBUGMODE) {
          console.log('changeModalContent(): conn:', conn);
          console.log(
            'changeModalContent(): gamePlayers.you:',
            gamePlayers.you
          );
          console.log('changeModalContent(): userKey:', userKey);
        }

        sendRPC('challengeSent', userKey);
        break;
      } else {
        console.log(
          'changeModalContent(): Error: conn could not be set up with the opponent:',
          gamePlayers.opponent
        );
      }

      break;

    case 'eventGameOverLose':
      if (DEBUGMODE) {
        console.log(`changeModalContent(): Game over event - lose`);
      }

      modalSection.innerHTML = youLoseHTML;
      modalSection.classList.add('reveal');
      const youLoseInformation = document.getElementById('lose_text');
      const youLoseInformation2 = document.getElementById('lose_text2');
      const loseOkButton = modalSection.querySelector('.modal_section_button');

      youLoseInformation.textContent = `${data[1]} has won the game${data[0]}`;
      youLoseInformation2.textContent = `Better luck next time!`;

      // Sets event listeners in the modal
      loseOkButton.addEventListener('click', () => {
        playClickSound();

        enableChallenges();

        setTimeout(() => {
          removeModal();
          window.location.reload();
        }, 1000);
      });
      break;

    case 'eventGameOverWin':
      if (DEBUGMODE) {
        console.log(`changeModalContent(): Game over event - win`);
      }

      modalSection.innerHTML = youWinHTML;
      modalSection.classList.add('reveal');

      const youWinInformation = document.getElementById('win_text');
      const youWinInformation2 = document.getElementById('win_text2');
      const winOkButton = modalSection.querySelector('.modal_section_button');

      if (DEBUGMODE) {
        console.log(`changeModalContent(): data: ${data}`);
      }

      let gameWinResult = '';

      // Conditional formatting for the win message
      switch (data) {
        case 'win':
          gameWinResult = '!';
          break;
        case 'gammon':
          gameWinResult = ' with a Gammon!';
          break;
        case 'backgammon':
          gameWinResult = ' with a Backgammon!';
          break;
      }

      sendRPC('gameOver', gameWinResult);

      youWinInformation.textContent = `You have won the game${gameWinResult}`;
      youWinInformation2.textContent = `Congratulations!`;

      // Sets event listeners in the modal
      winOkButton.addEventListener('click', () => {
        playClickSound();

        if (DEBUGMODE) {
          console.log(`changeModalContent(): You win!`);
        }

        enableChallenges();

        setTimeout(() => {
          removeModal();
          window.location.reload();
        }, 1000);
      });
      break;

    case 'forfeitGame':
      modalSection.innerHTML = forfeitModalHTML;
      modalSection.classList.add('reveal');

      const yesButton = modalSection.querySelector('.modal_section_button');
      const noButton = modalSection.querySelector('.button_red');

      // Sets event listeners in the modal
      yesButton.addEventListener('click', () => {
        playClickSound();

        if (DEBUGMODE) {
          console.log(`changeModalContent(): You have forfeited the game!`);
        }

        forfeitMessage();
        const storedObject = loadLocalStorage();
        const displayName = storedObject.displayName;
        sendRPC('forfeitGame', displayName);
        removeModal();

        enableChallenges();

        setTimeout(() => {
          window.location.reload();
        }, 5000);
      });

      noButton.addEventListener('click', () => {
        playClickSound();

        if (DEBUGMODE) {
          console.log(`changeModalContent(): You have NOT forfeited the game!`);
        }

        setTimeout(() => {
          removeModal();
        }, 1000);
      });
      break;

    case 'forfeitNotification':
      modalSection.innerHTML = forfeitNotificationModalHTML;
      modalSection.classList.add('reveal');

      const forfeitNotificationInformation =
        document.getElementById('forfeit_text');
      const okButton = modalSection.querySelector('.modal_section_button');

      forfeitNotificationInformation.textContent = `${data} has forfeited the game! You win!`;

      // Sets event listeners in the modal
      okButton.addEventListener('click', () => {
        playClickSound();

        if (DEBUGMODE) {
          console.log(
            'changeModalContent():',
            data,
            'has forfeited the game! You win!'
          );
        }

        enableChallenges();

        setTimeout(() => {
          removeModal();
          window.location.reload();
        }, 1000);
      });
      break;

    case 'incompleteData':
      modalSection.innerHTML = incompleteDataHTML;
      modalSection.classList.add('reveal');

      const incompleteDataYesButton = modalSection.querySelector(
        '.modal_section_button'
      );

      // Sets event listeners in the modal
      incompleteDataYesButton.addEventListener('click', () => {
        playClickSound();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      break;

    case 'movesRemaining':
      modalSection.innerHTML = movesRemainingHTML;
      modalSection.classList.add('reveal');

      const movesRemainingText = document.getElementById(
        'moves_remaining_text'
      );

      const movesRemainingYesButton = modalSection.querySelector(
        '.modal_section_button'
      );
      const movesRemainingNoButton = modalSection.querySelector('.button_red');

      if (data !== '') {
        movesRemainingText.textContent = `You still have unused moves remaining (${data}), are you sure you would like to end your turn?`;
      }

      // TODO - Apply this logic to all modals with multiple buttons?
      return new Promise((resolve) => {
        // Clear previous handlers
        movesRemainingYesButton.onclick = null;
        movesRemainingNoButton.onclick = null;

        // Sets event listeners in the modal
        movesRemainingYesButton.onclick = () => {
          setTimeout(() => {
            removeModal();
            resolve(BUTTON_RESPONSE.BUTTON_YES);
          }, 1000);
        };

        movesRemainingNoButton.onclick = () => {
          setTimeout(() => {
            removeModal();
            resolve(BUTTON_RESPONSE.BUTTON_NO);
          }, 1000);
        };
      });

      break;

    case 'nameExists':
      modalSection.innerHTML = nameExistsHTML;
      modalSection.classList.add('reveal');

      const nameExistsYesButton = modalSection.querySelector(
        '.modal_section_button'
      );
      const nameText = document.getElementById('name_exists_text');

      nameText.textContent = `Please choose a different name as '${data}' has already been taken`;

      // Sets event listeners in the modal
      nameExistsYesButton.addEventListener('click', () => {
        playClickSound();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      break;

    case 'nameProblem':
      modalSection.innerHTML = nameLengthProblemHTML;
      modalSection.classList.add('reveal');

      const nameProblemOkButton = modalSection.querySelector(
        '.modal_section_button'
      );

      // Sets event listeners in the modal
      nameProblemOkButton.addEventListener('click', () => {
        playClickSound();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      break;

    case 'noChallenger':
      modalSection.innerHTML = noChallengerHTML;
      modalSection.classList.add('reveal');

      const noChallengerYesButton = modalSection.querySelector(
        '.modal_section_button'
      );

      // Sets event listeners in the modal
      noChallengerYesButton.addEventListener('click', () => {
        playClickSound();
        setTimeout(() => {
          removeModal();
        }, 1000);
        return;
      });
      break;

    case 'noName':
      modalSection.innerHTML = noNameHTML;
      modalSection.classList.add('reveal');

      const noNameYesButton = modalSection.querySelector(
        '.modal_section_button'
      );

      // Sets event listeners in the modal
      noNameYesButton.addEventListener('click', () => {
        playClickSound();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      break;

    case 'noPlayersOnline':
      modalSection.innerHTML = noPlayersOnlineHTML;
      modalSection.classList.add('reveal');

      const noPlayersOkButton = modalSection.querySelector(
        '.modal_section_button'
      );

      // Sets event listeners in the modal
      noPlayersOkButton.addEventListener('click', () => {
        playClickSound();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      break;

    case 'notYou':
      modalSection.innerHTML = notYouHTML;
      modalSection.classList.add('reveal');

      const notYouYesButton = modalSection.querySelector(
        '.modal_section_button'
      );
      const notYouNoButton = modalSection.querySelector('.button_red');

      // Sets event listeners in the modal
      notYouYesButton.addEventListener('click', () => {
        playClickSound();
        clearLocalStorage();

        setTimeout(() => {
          removeModal();
          window.location.reload();
        }, 1000);

        return;
      });

      notYouNoButton.addEventListener('click', () => {
        playClickSound();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      break;

    case 'return':
      modalSection.innerHTML = goBackFromPlayersSectionHTML;
      modalSection.classList.add('reveal');

      const returnYesButton = modalSection.querySelector(
        '.modal_section_button'
      );
      const returnNoButton = modalSection.querySelector('.button_red');

      // Sets event listeners in the modal
      returnYesButton.addEventListener('click', () => {
        playClickSound();

        playersSection.classList.remove('reveal');
        returnSection.classList.remove('reveal');
        welcomeSection.classList.add('reveal');

        playersLanguageText.textContent = `Select`;

        // Repopulate the welcome section
        changeDetailsPopulateFields();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      returnNoButton.addEventListener('click', () => {
        playClickSound();

        setTimeout(() => {
          removeModal();
        }, 1000);

        return;
      });

      break;
  }
  return;
}

// Increments the value of the challenge counter by 1 every second
function counterIncrement() {
  counterValue++;

  const challengeCounter = modalSection.querySelector('.challenge_counter');
  challengeCounter.textContent = `${counterValue} s`;

  return counterValue;
}

// Allows challenges to be processed
function enableChallenges() {
  challengeBlocker = false;
  return;
}

// Populates the other games list in the games section
function populateOtherGames(otherGamesHTML) {
  if (otherGamesPopulatedFlag === false) {
    let fullHTML = '';
    otherGamesHTML.forEach((current) => {
      fullHTML += current;
    });

    otherGamesDisplay.insertAdjacentHTML('beforeend', fullHTML);

    otherGamesBackgammonButton = document.querySelector(
      '.game_button_backgammon'
    );
    otherGamesMurderMansionButton = document.querySelector(
      '.game_button_murder_mansion'
    );
  }
  return;
}

// Hides the modal element
function removeModal() {
  modalSection.classList.remove('reveal');
  modalSection.style.display = 'none';
  adNotification.classList.remove('blur_element');
  return;
}

// Shows the modal element and blurs background content
function showModal() {
  modalSection.style.display = 'block';
  modalSection.innerHTML = '';

  // Also blurs the adNotification element as it doesn't work with the others
  adNotification.classList.add('blur_element');
  return;
}

// Starts the challenge counter
function startCounter() {
  counterInterval = setInterval(counterIncrement, 1000);
  return;
}

// Stops the challenge counter and resets its value to 0
function stopCounter() {
  counterValue = 0;
  clearInterval(counterInterval);

  if (DEBUGMODE) {
    console.log(
      'stopCounter(): Counter has been reset, value now at:',
      counterValue
    );
  }

  return;
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

// Debug mode checks
if (DEBUGMODE) {
  console.log(`modals.js running`);
}

// Adds the chat button elements to the webpage
addChatButtons();

// CODE END
//////////////////////////////////////////////////////////////////////////////////////////
