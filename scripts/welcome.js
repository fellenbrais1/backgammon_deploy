//////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Handles the DOM elements and logic for the welcome section of the webpage

'use strict';

//////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import {
  checkForName,
  fetchRecentPlayers,
  getOpponentUserKey,
  peer,
  registerForChat,
} from './chat.js';
import { DEBUGMODE } from './config.js';
import { loadLocalStorage, setLocalStorage } from './localStorage.js';
import { changeModalContent } from './modals.js';
import { playClickSound } from './sounds.js';

//////////////////////////////////////////////////////////////////////////////////////////
// DOM ELEMENT SELECTION

// Board annotation section elements
const boardAnnotationsSection = document.querySelector(
  '.board_annotations_section'
);

// Continue button elements
const continueButton = document.querySelector('.welcome_continue_button');

// Language accordion elements
const languageAccordion = document.getElementById('language_accordion');
const languagePanel = languageAccordion.nextElementSibling;
const languageSvg = document.getElementById('language_svg');
const languageText = document.getElementById('language_text');

// Language choice elements
const languageChoices = document.querySelectorAll('.language_choice');

// Next section elements
const nextYouFlags = document.querySelector('.next_you_flags');
const nextYouName = document.querySelector('.next_you_name');
const nextYouSkill = document.querySelector('.next_you_skill');

// Player name form elements
export const welcomeNameForm = document.querySelector('.welcome_name_form');

const welcomeNameInput = document.getElementById('welcome_name_input');

// Players section elements
const playersChallengeButton = document.querySelector('.challenge_button');
const playersDisplay = document.querySelector('.players_active');
const playersSection = document.querySelector('.players_section');
const playersXButton = document.querySelector('.players_x_button');

// Players section language elements
export const playersLanguageText = document.getElementById(
  'players_language_text'
);

const playersLanguageAccordion = document.getElementById(
  'players_language_accordion'
);
const playersLanguagePanel = playersLanguageAccordion.nextElementSibling;
const playersLanguageSvg = document.getElementById('players_language_svg');

// Return section elements
const notYouButton = document.querySelector('.not_you_button');
const continueButtonReturn = document.querySelector('.return_continue_button');
const returnYouFlags = document.querySelector('.return_you_flags');
const returnYouName = document.querySelector('.return_you_name');
const returnYouSkill = document.querySelector('.return_you_skill');

// Skill accordion elements
const skillLevelAccordion = document.getElementById('skill_level_accordion');
const skillLevelPanel = skillLevelAccordion.nextElementSibling;
const skillLevelSvg = document.getElementById('skill_level_svg');
const skillLevelText = document.getElementById('skill_level_text');

// Skill choice elements
const skillAdvanced = document.querySelector('.skill_advanced');
const skillBeginner = document.querySelector('.skill_beginner');
const skillMaster = document.querySelector('.skill_master');

// Step elements
const step2Div = document.querySelector('.step2');
const step3Div = document.querySelector('.step3');
const step4Div = document.querySelector('.step4');

// TODO - To be removed later
// Test button elements
const testButton4 = document.querySelector('.test_button4');

// Welcome section elements
const welcomeSection = document.querySelector('.welcome_section');

// You section elements
const youFlags = document.querySelector('.you_flags');
const youName = document.querySelector('.you_name');
const youSkill = document.querySelector('.you_skill');

//////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

// Default data for player object
let sessionDisplayName = 'Guest';
let sessionSkillLevel = 'Beginner';
let sessionLanguages = [];

// Challenger variables
export let activeOpponent = '';
export let challengerName = '';

// Intervals to allow automatic repopulation of online players to be paused or unpaused
let continueInterval;
let returnContinueInterval;

// Language HTML variables
const chineseHTML = `<p
  class="players_language_choice no_select"
  data-language="zh"
  title="Chinese"
  >
  中文
  </p>`;

const englishHTML = `<p
  class="players_language_choice no_select"
  data-language="en"
  title="English"
  >
  English
  </p>`;

const italianHTML = `<p
  class="players_language_choice no_select"
  data-language="it"
  title="Italian"
  >
  Italiano
  </p>`;

const japaneseHTML = `<p
  class="players_language_choice no_select"
  data-language="ja"
  title="Japanese"
  >
  日本語
  </p>`;

const spanishHTML = `<p
  class="players_language_choice no_select"
  data-language="es"
  title="Spanish"
  >
  Espanol
  </p>`;

// Language section variables
const MAXLANGUAGES = 3;

let languagesChosen = [];
let languagesChosenReturn = [];
let languageItems;
let languageFilter = 'en';

// Variable to enable going back to change your details
let changeDetailsFlag = false;

//////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

// TODO - To be removed later
// To test the 'movesRemaining' modal
testButton4.addEventListener('click', () => {
  playClickSound();
  console.log(`Test button 4: displaying end turn message`);
  changeModalContent('movesRemaining', [4, 2]);
  return;
});

// Allows a player to continue to player section (from the welcome section)
continueButton.addEventListener('click', () => {
  playClickSound();
  createUserData();

  continueButton.classList.remove('focus_element');
  boardAnnotationsSection.classList.remove('reveal_translucent');

  // Starts the auto refresh process of online players
  continueInterval = setInterval(refreshPopulatePlayers, 10000);
  return;
});

// Allows a player to continue to the player section (from the return section)
continueButtonReturn.addEventListener('click', async () => {
  playClickSound();

  // Creates a copy of what is already in local storage to be modified
  const storedObjectProto = loadLocalStorage();

  if (DEBUGMODE) {
    console.log('continueButton: storedObjectProto:', storedObjectProto);
  }

  setLocalStorage({
    displayName: storedObjectProto.displayName,
    skillLevel: storedObjectProto.skillLevel,
    languages: storedObjectProto.languages,
    languagesChosen: storedObjectProto.languages,
    userKey: storedObjectProto.userKey,
    peerID: peer.id,
  });

  const storedObject = loadLocalStorage();

  // Logs the storedObject in debug mode
  if (DEBUGMODE) {
    console.log('contiuneButtonReturn: storedObject:', storedObject);
  }

  const data = {
    displayName: storedObject.displayName,
    skillLevel: storedObject.skillLevel,
    languages: storedObject.languages,
    languagesChosen: storedObject.languages,
    userKey: storedObject.userKey,
    peerID: storedObject.peerID,
  };

  populatePlayersSectionData();
  populatePlayerSectionLanguages(data.languages);

  if (DEBUGMODE) {
    console.log('continueButtonReturn: data:', JSON.stringify(data));
  }

  try {
    // Registers the new player object to be able to send and recieve RPC messages
    await registerForChat(data.userKey, data, changeDetailsFlag);

    // Populates the online player list with players online in the last hour
    fetchRecentPlayers();

    setTimeout(() => {
      boardAnnotationsSection.classList.remove('reveal_translucent');
      welcomeSection.classList.remove('reveal');
      playersSection.classList.add('reveal');
    }, 1000);

    // Starts the auto refresh process of online players
    returnContinueInterval = setInterval(refreshPopulatePlayers, 10000);
    return;
  } catch (error) {
    console.error(`continueButtonReturn: Error registering for chat:`, error);
    return;
  }
});

// Allows the user to expand and compress the language accordion, toggling its svg icon
languageAccordion.addEventListener('click', () => {
  playClickSound();

  if (languagePanel.style.display === 'block') {
    languagePanel.style.display = 'none';
    languageSvg.style.transform = 'rotate(0deg)';
  } else {
    languagePanel.style.display = 'block';
    languageSvg.style.transform = 'rotate(180deg)';
  }

  return;
});

// Adds event listeners to language choices that set that language as chosen on the player object
languageChoices.forEach((current) => {
  current.addEventListener('click', () => {
    playClickSound();

    const languageValue = current.dataset.language;

    // Removes highlight class and language selection when clicking on a previously selected language choice
    if (current.classList.contains('accordion_selected')) {
      current.classList.remove('accordion_selected');

      languagesChosen = languagesChosen.filter(
        (element) => element !== languageValue
      );

      // Automatically closes the accordion if three languages have been chosen
      threeLanguagesChosen();

      addLanguageFlags();
      return;
    }

    // Adds a language selection if there are less than 3 selected and that one has not already been added
    if (
      languagesChosen.length < MAXLANGUAGES &&
      !languagesChosen.includes(languageValue)
    ) {
      current.classList.add('accordion_selected');
      languagesChosen.push(languageValue);

      // Automatically closes the accordion if three languages have been chosen
      threeLanguagesChosen();

      addLanguageFlags();

      // Changes focus on elements to signify the next stage of the log in process
      languageAccordion.classList.remove('focus_element');
      continueButton.classList.add('focus_element');
      return;
    }
  });
});

// Allows the player to go to beginning and create a fresh log in
notYouButton.addEventListener('click', () => {
  playClickSound();
  changeModalContent('notYou');
  return;
});

// Allows a challenger to send a challenge to their selected opponent
playersChallengeButton.addEventListener('click', () => {
  playClickSound();

  if (challengerName === '') {
    changeModalContent('noChallenger');
  } else {
    changeModalContent('challengeSent', challengerName);
    const storedObject = loadLocalStorage();

    // Updates the lastOnline property of the player object to help keep them in the list of online players
    storedObject.lastOnline = Date.now();
  }

  return;
});

// Allows the user to expand and compress the language filter accordion, toggling its svg icon
playersLanguageAccordion.addEventListener('click', () => {
  playClickSound();

  if (playersLanguagePanel.style.display === 'block') {
    playersLanguagePanel.style.display = 'none';
    playersLanguageSvg.style.transform = 'rotate(0deg)';
  } else {
    playersLanguagePanel.style.display = 'block';
    playersLanguageSvg.style.transform = 'rotate(180deg)';
  }

  return;
});

// Allows a player to go back from the players section to change their details
playersXButton.addEventListener('click', () => {
  playClickSound();
  changeModalContent('return');
  return;
});

// Toggles the display of the skill choice accordion when clicked
skillLevelAccordion.addEventListener('click', function () {
  playClickSound();

  if (skillLevelPanel.style.display === 'block') {
    skillLevelPanel.style.display = 'none';
    skillLevelSvg.style.transform = 'rotate(0deg)';
  } else {
    skillLevelPanel.style.display = 'block';
    skillLevelSvg.style.transform = 'rotate(180deg)';
  }

  return;
});

// Allows the user to choose the advanced skill level
skillAdvanced.addEventListener('click', () => {
  playClickSound();

  // Highlights only this choice in the accordion
  skillAdvanced.classList.add('accordion_selected');
  skillBeginner.classList.remove('accordion_selected');
  skillMaster.classList.remove('accordion_selected');

  skillLevelText.textContent = 'Advanced 🏆🏆';
  youSkill.textContent = '🏆🏆';
  sessionSkillLevel = '🏆🏆';

  showStep3Elements();
  return;
});

// Allows the user to choose the beginner skill level
skillBeginner.addEventListener('click', () => {
  playClickSound();

  // Highlights only this choice in the accordion
  skillBeginner.classList.add('accordion_selected');
  skillAdvanced.classList.remove('accordion_selected');
  skillMaster.classList.remove('accordion_selected');

  skillLevelText.textContent = 'Beginner 🏆';
  youSkill.textContent = '🏆';
  sessionSkillLevel = '🏆';

  showStep3Elements();
  return;
});

// Allows the user to choose the master skill level
skillMaster.addEventListener('click', () => {
  playClickSound();

  // Highlights only this choice in the accordion
  skillMaster.classList.add('accordion_selected');
  skillBeginner.classList.remove('accordion_selected');
  skillAdvanced.classList.remove('accordion_selected');

  skillLevelText.textContent = 'Master 🏆🏆🏆';
  youSkill.textContent = '🏆🏆🏆';
  sessionSkillLevel = '🏆🏆🏆';

  showStep3Elements();
  return;
});

// Enables the player to confirm a name by pressing enter while in the name entry box, it will bring up modals if there are any problems with the name entered
welcomeNameForm.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    playClickSound();

    const welcomeName = welcomeNameInput.value;

    if (welcomeNameInput.value !== '') {
      if (welcomeName.length >= 3) {
        if (welcomeName.length > 12) {
          // Name too long
          changeModalContent('nameProblem');
          return;
        } else {
          // Name okay
          youName.textContent = welcomeName;
          sessionDisplayName = welcomeName;

          step2Div.classList.add('reveal');

          welcomeNameForm.classList.remove('focus_element');
          skillLevelAccordion.classList.add('focus_element');
          return;
        }
      } else {
        // Name too short
        changeModalContent('nameProblem');
        return;
      }
    } else {
      // No name entered
      changeModalContent('noName');
      welcomeNameInput.value = sessionDisplayName;
      return;
    }
  }
});

//////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// Adds language flag images to the you section
export function addLanguageFlags(status = 0, changeDetails = false) {
  let flag1,
    flag2,
    flag3 = '<p></p>';
  let flags = [flag1, flag2, flag3];
  let flagYou1, flagYou2, flagYou3;
  let flagsYou = [flagYou1, flagYou2, flagYou3];
  let workingLanguages;

  // Allows language flags to be changed if the player has gone back to change their details
  if (changeDetails) {
    let storedObject = loadLocalStorage();
    workingLanguages = storedObject.languages;

    if (DEBUGMODE) {
      console.log('addLangaugeFlags(): workingLanguages:', workingLanguages);
    }
  } else {
    // Sets the language flags based on languages chosen during log in
    sessionLanguages = languagesChosen;
    if (status === 0) {
      workingLanguages = languagesChosen;
    } else {
      workingLanguages = languagesChosenReturn;
    }
  }

  // Adds flag HTML to the display elements for each language selected
  for (let i = 0; i < workingLanguages.length; i++) {
    if (workingLanguages[i].includes('en')) {
      flags[i] = `<img
                class="player_flag_img"
                data-language="en"
                src="./images/flags/english_flag.png"
              />`;
      flagsYou[i] = `<img
              class="player_flag_bigger"
              data-language="en"
              src="./images/flags/english_flag.png"
            />`;
    }
    if (workingLanguages[i].includes('es')) {
      flags[i] = `<img
                class="player_flag_img"
                data-language="es"
                src="./images/flags/spanish_flag.png"
              />`;
      flagsYou[i] = `<img
              class="player_flag_bigger"
              data-language="es"
              src="./images/flags/spanish_flag.png"
            />`;
    }
    if (workingLanguages[i].includes('it')) {
      flags[i] = `<img
                class="player_flag_img"
                data-language="it"
                src="./images/flags/italy_flag.png"
              />`;
      flagsYou[i] = `<img
              class="player_flag_bigger"
              data-language="it"
              src="./images/flags/italy_flag.png"
            />`;
    }
    if (workingLanguages[i].includes('ja')) {
      flags[i] = `<img
                class="player_flag_img"
                data-language="ja"
                src="./images/flags/japanese_flag.png"
              />`;
      flagsYou[i] = `<img
              class="player_flag_bigger"
              data-language="ja"
              src="./images/flags/japanese_flag.png"
            />`;
    }
    if (workingLanguages[i].includes('zh')) {
      flags[i] = `<img
                class="player_flag_img"
                data-language="zh"
                src="./images/flags/chinese_flag.png"
              />`;
      flagsYou[i] = `<img
              class="player_flag_bigger"
              data-language="zh"
              src="./images/flags/chinese_flag.png"
            />`;
    }
  }

  // Sorts the flags in the log in sections in alphabetical order (based on two letter language codes)
  if (flags.length > 1) {
    flags.sort((a, b) => {
      const matchA = a.match(/data-language="([^"]+)"/);
      const matchB = b.match(/data-language="([^"]+)"/);

      if (matchA && matchB) {
        const langA = matchA[1];
        const langB = matchB[1];
        return langA.localeCompare(langB);
      } else if (matchA) {
        return -1;
      } else if (matchB) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  // Sorts the flags in the you section in alphabetical order (based on two letter language codes)
  if (flagsYou.length > 1) {
    flagsYou.sort((a, b) => {
      const matchA = a.match(/data-language="([^"]+)"/);
      const matchB = b.match(/data-language="([^"]+)"/);

      if (matchA && matchB) {
        const langA = matchA[1];
        const langB = matchB[1];
        return langA.localeCompare(langB);
      } else if (matchA) {
        return -1;
      } else if (matchB) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  // Updates the flag content if a player goes back to change their details
  if (changeDetails) {
    youFlags.innerHTML = flagsYou.join('');
    languageText.innerHTML = flags.join('');
  } else {
    if (status === 0) {
      youFlags.innerHTML = flagsYou.join('');
      // Sets default content in languageText element
      if (languagesChosen.length === 0) {
        languageText.textContent = `Select Language`;
        return;
      } else {
        step4Div.classList.add('reveal');
        languageText.innerHTML = flags.join('');
        return;
      }
    } else {
      // Populates flag elements during the return page flow
      returnYouFlags.innerHTML = flagsYou.join('');
      nextYouFlags.innerHTML = flagsYou.join('');
      return;
    }
  }
}

// Adds event listeners to the programmatically created player choice elements
function addPlayerEventListeners(playerList) {
  Object.entries(playerList).forEach(([key, value]) => {
    if (DEBUGMODE) {
      console.log('addPlayerEventListeners(): value:', JSON.stringify(value));
    }

    const newName = value.displayName.replace(' ', '_');
    const element = '.player_is_' + newName;
    const DOMElement = document.querySelectorAll(element);
    const timeNow = Date.now();

    DOMElement.forEach((current) => {
      const timeSinceLastLoggedIn = timeNow - value.lastOnline;

      const totalSeconds = Math.floor(timeSinceLastLoggedIn / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (DEBUGMODE) {
        console.log(
          'addPlayerEventListeners(): Last Online (ms):',
          value.lastOnline
        );
        console.log(
          'addPlayerEventListeners(): Time Since Last Login (ms):',
          timeSinceLastLoggedIn
        );
        console.log(
          'addPlayerEventListeners(): Hours ago:',
          hours,
          '- minutes ago:',
          minutes
        );
      }

      const status = current.classList.contains('not_free')
        ? 'IN GAME'
        : 'FREE';

      current.setAttribute(
        'data-tooltip',
        `${status} Last Active: ${Math.floor(hours)} h, ${minutes} m ago`
      );

      if (current.classList.contains('not_free')) {
        if (DEBUGMODE) {
          console.log('Nothing to do for:', value.displayName, '- in game');
        }
      } else {
        current.addEventListener('click', () => {
          playClickSound();
          const newDOMElements = document.querySelectorAll(
            '.player_online_display'
          );
          activeOpponent = value;
          challengerName = value.displayName;
          newDOMElements.forEach((current2) => {
            current2.classList.remove('accordion_selected');
          });
          current.classList.toggle('accordion_selected');
          pauseRefreshPopulatePlayers();
        });
      }
    });
  });
  return;
}

// Moves back to the welcome section to allow a user to change some of their details
export function changeDetailsFlagStatus() {
  // Setting this flag to true allows player data to be changed without a page reload event
  changeDetailsFlag = true;

  const storedObject = loadLocalStorage();

  sessionDisplayName = storedObject.displayName;
  sessionSkillLevel = storedObject.skillLevel;
  sessionLanguages = storedObject.languages;

  welcomeNameInput.classList.add('no_pointer_events');
  welcomeNameForm.classList.remove('focus_element');
  welcomeNameForm.classList.add('greyout');
  return;
}

// Checks to see if there is data already written into local storage and returns true or false
export function checkForLocalStorageObject() {
  const storedObject = loadLocalStorage();

  if (
    storedObject.displayName !== '' &&
    storedObject.displayName.length > 3 &&
    storedObject.displayName.length < 13 &&
    storedObject.skillLevel !== '' &&
    storedObject.languages.length > 0
  ) {
    welcomeBackPopulateFields();
    return true;
  } else {
    return false;
  }
}

// Checks if a player is in a game or is free and returns true or false
function checkPlayerInGame(inGame) {
  if (inGame === true) {
    return true;
  } else {
    return false;
  }
}

// Checks if a player is in the online list or not and returns true or false
function checkPlayerOnline(lastOnline) {
  const now = Date.now();
  const difference = now - lastOnline;

  if (DEBUGMODE) {
    console.log('checkPlayerOnline(): difference:', difference);
  }

  // Set to 1 hour
  const onlineThreshold = 60 * 60 * 1000 * 1;

  return difference < onlineThreshold;
}

// Closes the accordion specified and rotates its svg icon
function closeAccordion(accordionPanel, accordionSvg) {
  setTimeout(() => {
    accordionPanel.style.display = 'none';
    accordionSvg.style.transform = 'rotate(0deg)';
  }, 500);

  return;
}

// If the data provided by the user is valid, it writes data to the local storage object by calling changeModalContent()
async function createUserData() {
  let allowedName = '';

  // When going back to change player details the allowedName is set to enable a player object to be updated instead of making a new one
  if (changeDetailsFlag) {
    const storedObject = loadLocalStorage();
    allowedName = storedObject.displayName;
  }

  // If chosen player details are acceptable
  if (
    sessionDisplayName !== '' &&
    sessionDisplayName.length >= 3 &&
    sessionDisplayName.length < 13 &&
    sessionSkillLevel !== '' &&
    sessionLanguages.length > 0
  ) {
    if (DEBUGMODE) {
      console.log('createUserData(): peer.id:', peer.id);
    }

    const data = {
      displayName: sessionDisplayName,
      skillLevel: sessionSkillLevel,
      languages: sessionLanguages,
      languagesChosen: languagesChosen,
      peerID: peer.id,
      inGame: false,
    };

    if (DEBUGMODE) {
      console.log('createUserData(): data:', JSON.stringify(data));
      console.log('createUserData(): Languages:', data.languages);
      console.log('createUserData(): peerID:', data.peerID);
    }

    const result = await checkForName(data.displayName, allowedName);

    if (DEBUGMODE) {
      console.log('createUserData(): result:', result);
    }

    if (result === 0) {
      // When going back to change a users details
      if (changeDetailsFlag) {
        if (DEBUGMODE) {
          console.log(
            `createUserData(): Allowed name is: ${storedObject.displayName}`
          );
        }
      } else {
        // If name already exists and not in changeDetails flow it displays an error modal
        changeModalContent('nameExists', data.displayName);
        return;
      }
    } else {
      try {
        let userKey;
        if (changeDetailsFlag) {
          const storedObject = loadLocalStorage();
          userKey = await registerForChat(
            storedObject.userKey,
            data,
            allowedName
          );
        } else {
          userKey = await registerForChat(null, data, allowedName);
        }
        changeDetailsFlag = false;

        if (DEBUGMODE) {
          console.log('createUserData(): userKey:', userKey);
        }

        setLocalStorage({
          displayName: data.displayName,
          skillLevel: data.skillLevel,
          languages: data.languages,
          peerID: data.peerID,
          userKey: userKey,
        });

        populatePlayersSectionData();
        populatePlayerSectionLanguages(data.languages);

        fetchRecentPlayers();
        setTimeout(() => {
          welcomeSection.classList.remove('reveal');
          playersSection.classList.add('reveal');
        }, 1000);
        return;
      } catch (error) {
        console.error(`Error registering for chat:`, error);
        changeDetailsFlag = false;
        return;
      }
    }
  } else {
    if (DEBUGMODE) {
      console.log('createUserData(): sessionDisplayName:', sessionDisplayName);
      console.log('createUserData(): sessionSkillLevel', sessionSkillLevel);
      console.log('createUserData(): sessionLanguages', sessionLanguages);
    }
    changeModalContent('incompleteData');
    return;
  }
}

// Displays a message saying a player is offline
function displayPlayerOfflineLogMessage() {
  if (DEBUGMODE) {
    console.log(
      'displayPlayerOfflineLogMessage(): Nothing to do for:',
      value.displayName,
      '- Offline'
    );
  }
  return;
}

// Allows filtering of online players by chosen language
function filterPlayersByLanguage(languageFilter) {
  challengerName = '';
  playersDisplay.innerHTML = '';
  fetchRecentPlayers(languageFilter);
  return;
}

// Determines whether a user's chosen languages match with another player's languages and populates the online player list field accordingly
function hasLanguageMatch(userLanguages, playerLanguages) {
  return userLanguages.some((element) => playerLanguages.includes(element));
}

// Clears the intervals of the player refresh intervals to pause player refreshing
export function pauseRefreshPopulatePlayers() {
  if (DEBUGMODE) {
    console.log(
      `pauseRefreshPopulatePlayers(): auto refreshing of online players is paused`
    );
  }

  clearInterval(continueInterval);
  clearInterval(returnContinueInterval);
  return;
}

// Updates the challengee players lastOnline property and returns an object containing both player's objects
export async function playerPairingChallengee(activeOpponentHere) {
  const storedObject = loadLocalStorage();

  // Updates the lastOnline property to better keep the player listed as online
  storedObject.lastOnline = Date.now();

  const playerRed = storedObject;
  const playerWhite = await getOpponentUserKey(activeOpponentHere);

  if (DEBUGMODE) {
    console.log(
      'playerPairingChallengee(): Player White:',
      JSON.stringify(playerWhite)
    );
    console.log(
      'playerPairingChallengee(): Player Red:',
      JSON.stringify(playerRed)
    );
  }

  return {
    you: playerRed,
    opponent: playerWhite,
  };
}

// Updates the challenger players lastOnline property and returns an object containing both player's objects
export async function playerPairingUserChallenge() {
  const storedObject = loadLocalStorage();

  // Updates the lastOnline property to better keep the player listed as online
  storedObject.lastOnline = Date.now();

  const playerWhite = storedObject;
  const playerRed = await getOpponentUserKey(activeOpponent);

  if (DEBUGMODE) {
    console.log(
      'playerPairingUserChallenge(): Player White:',
      JSON.stringify(playerWhite)
    );
    console.log(
      'playerPairingUserChallenge(): Player Red:',
      JSON.stringify(playerRed)
    );
  }

  return {
    you: playerWhite,
    opponent: playerRed,
  };
}

// Populates the players section's player display element with player elements built from a list of online players
export function populatePlayers(playerList, filter = 'none') {
  const storedObject = loadLocalStorage();

  let HTML;

  // Clears any content of the player's display element
  playersDisplay.innerHTML = '';

  // Iterates throguh the player list and builds their player element based on certain factors
  playerList.forEach((value) => {
    let skillMarker = value.skillLevel;
    let playerFlags = [];

    // Populates the player elements playerFlags variable based on their languages chosen
    value.languages.forEach((current) => {
      const languageData = current;
      switch (languageData) {
        case 'en':
          playerFlags.push(
            `<img class='player_flag' data-language="en" src='./images/flags/english_flag.png'>`
          );
          break;
        case 'es':
          playerFlags.push(
            `<img class='player_flag' data-language="es" src='./images/flags/spanish_flag.png'>`
          );
          break;
        case 'it':
          playerFlags.push(
            `<img class='player_flag' data-language="it" src='./images/flags/italy_flag.png'>`
          );
          break;
        case 'ja':
          playerFlags.push(
            `<img class='player_flag' data-language="ja" src='./images/flags/japanese_flag.png'>`
          );
          break;
        case 'zh':
          playerFlags.push(
            `<img class='player_flag' data-language="zh" src='./images/flags/chinese_flag.png'>`
          );
          break;
      }
    });

    // Sorts the player flags in the player element into alphabetical order (based on two letter language code)
    playerFlags.sort((a, b) => {
      const langA = a.match(/data-language="([^"]+)"/)[1];
      const langB = b.match(/data-language="([^"]+)"/)[1];
      return langA.localeCompare(langB);
    });

    // Joins the playerFlags HTML into one string
    const joinedPlayerFlags = playerFlags.join('');

    // Replaces spaces in player name with underscores to build valid class names
    const newName = value.displayName.replace(' ', '_');
    const specificClass = 'player_is_' + newName;

    if (filter !== 'none') {
      if (!value.languages.includes(filter)) {
        if (DEBUGMODE) {
          console.log(
            'populatePlayers(): Skipping player:',
            value.displayName,
            '- Does not speak a common language'
          );
        }
      } else if (value.displayName === storedObject.displayName) {
        if (DEBUGMODE) {
          console.log('Skipping player:', value.displayName, '- Same name');
        }
      } else {
        checkPlayerOnline(value.lastOnline)
          ? (() => {
              checkPlayerInGame(value.inGame)
                ? (HTML = `<div class='player_online_display not_free ${specificClass}'><p class='is_player_active player_ingame'></p><p class='player_text'>${value.displayName}</p><p class='player_text skill_marker'>${skillMarker}</p><p class='player_text'>${joinedPlayerFlags}</p></div>`)
                : (HTML = `<div class='player_online_display ${specificClass}'><p class='is_player_active'></p><p class='player_text'>${value.displayName}</p><p class='player_text skill_marker'>${skillMarker}</p><p class='player_text'>${joinedPlayerFlags}</p></div>`);
              playersDisplay.insertAdjacentHTML('afterbegin', HTML);
            })()
          : displayPlayerOfflineLogMessage();
      }
    } else {
      // If no language filter is set, players will any languages that match the user's choices will be displayed in the online player list
      const userLanguages = storedObject.languages;

      if (hasLanguageMatch(userLanguages, value.languages) === true) {
        if (value.displayName === storedObject.displayName) {
          if (DEBUGMODE) {
            console.log(
              'populatePlayers(): Skipping player:',
              value.displayName,
              '- Same name'
            );
          }
        } else {
          checkPlayerOnline(value.lastOnline)
            ? (() => {
                checkPlayerInGame(value.inGame)
                  ? (HTML = `<div class='player_online_display not_free no_select ${specificClass}'><p class='is_player_active player_ingame'></p><p class='player_text'>${value.displayName}</p><p class='player_text skill_marker'>${skillMarker}</p><p class='player_text'>${joinedPlayerFlags}</p></div>`)
                  : (HTML = `<div class='player_online_display ${specificClass}'><p class='is_player_active'></p><p class='player_text'>${value.displayName}</p><p class='player_text skill_marker'>${skillMarker}</p><p class='player_text'>${joinedPlayerFlags}</p></div>`);
                playersDisplay.insertAdjacentHTML('afterbegin', HTML);
              })()
            : displayPlayerOfflineLogMessage();
        }
      } else {
        if (DEBUGMODE) {
          console.log(
            'populatePlayers(): Nothing to do for:',
            value.displayName,
            '- Does not speak a common language'
          );
        }
      }
    }
  });

  // Attach event listeners to the newly created player elements
  addPlayerEventListeners(playerList);
  return;
}

// Populates the players section's you elements with data from the local storage object
export function populatePlayersSectionData() {
  const storedObject = loadLocalStorage();

  if (DEBUGMODE) {
    console.log(
      'populatePlayersSectionData(): storedObject:',
      JSON.stringify(storedObject)
    );
  }

  nextYouName.textContent = storedObject.displayName;
  nextYouSkill.textContent = storedObject.skillLevel;
  languagesChosenReturn = storedObject.languages;

  if (DEBUGMODE) {
    console.log(
      'populatePlayersSectionData(): storedObject.languages:',
      storedObject.languages
    );
    console.log(
      'populatePlayersSectionData(): languagesChosenReturn:',
      languagesChosenReturn
    );
  }

  addLanguageFlags(1);
  return;
}

// Populates the available language options in the players section based on languages chosen by the user
export function populatePlayerSectionLanguages(languagesChosen) {
  let languagesHTML = '';

  // Adds language HTML based on user choices
  if (languagesChosen.includes('en')) {
    languagesHTML += englishHTML;
  }

  if (languagesChosen.includes('es')) {
    languagesHTML += spanishHTML;
  }

  if (languagesChosen.includes('it')) {
    languagesHTML += italianHTML;
  }

  if (languagesChosen.includes('ja')) {
    languagesHTML += japaneseHTML;
  }

  if (languagesChosen.includes('zh')) {
    languagesHTML += chineseHTML;
  }

  // Adds the relevant languages to the language choice element
  playersLanguagePanel.innerHTML = languagesHTML;

  languageItems = playersLanguagePanel.querySelectorAll(
    '.players_language_choice'
  );

  languageItems.forEach((current) => {
    current.addEventListener('click', () => {
      playClickSound();

      const languageValue = current.dataset.language;
      const languageName = retrieveLanguageName(languageValue);

      if (current.classList.contains('accordion_selected')) {
        languageItems.forEach((current2) => {
          current2.classList.remove('accordion_selected');
        });
        languageFilter = 'none';
        playersLanguageText.textContent = `Select`;
        closeAccordion(playersLanguagePanel, playersLanguageSvg);
        filterPlayersByLanguage(languageFilter);
        return;
      } else {
        languageItems.forEach((current2) => {
          current2.classList.remove('accordion_selected');
        });
        current.classList.add('accordion_selected');
        languageFilter = languageValue;

        playersLanguageText.textContent = languageName;
        closeAccordion(playersLanguagePanel, playersLanguageSvg);
        filterPlayersByLanguage(languageFilter);
        return;
      }
    });
  });
}

// Fetch online players again after a set interval
function refreshPopulatePlayers() {
  if (DEBUGMODE) {
    console.log(
      'refreshPopulatePlayers(): auto refreshing of online players is running'
    );
  }

  fetchRecentPlayers(languageFilter);
  return;
}

// Restarts player refreshing by resetting the player refresh intervals
export function restartRefreshPopulatePlayers() {
  if (returnContinueInterval) {
    returnContinueInterval = setInterval(refreshPopulatePlayers, 10000);
  }

  if (continueInterval) {
    continueInterval = setInterval(refreshPopulatePlayers, 10000);
  }

  return;
}

// Generates a language's name based on the language choice element's data
function retrieveLanguageName(languageData) {
  let languageName = '';
  switch (languageData) {
    case 'en':
      languageName = 'English';
      break;
    case 'es':
      languageName = 'Espanol';
      break;
    case 'it':
      languageName = 'Italiano';
      break;
    case 'ja':
      languageName = '日本語';
      break;
    case 'zh':
      languageName = '中文';
      break;
  }
  return languageName;
}

// Triggers the next stage of the log in process by revealing step3 elements and changing element focus
function showStep3Elements() {
  step3Div.classList.add('reveal');
  closeAccordion(skillLevelPanel, skillLevelSvg);

  skillLevelAccordion.classList.remove('focus_element');
  languageAccordion.classList.add('focus_element');
  return;
}

// Automatically closes the languages accordion when three languages have been selected
function threeLanguagesChosen() {
  if (languagesChosen.length === 3) {
    closeAccordion(languagePanel, languageSvg);
    return;
  } else {
    return;
  }
}

// Populates page field's with user data if local storage has already been written to
export function welcomeBackPopulateFields() {
  const storedObject = loadLocalStorage();
  returnYouName.textContent = storedObject.displayName;
  returnYouSkill.textContent = storedObject.skillLevel;
  languagesChosenReturn = storedObject.languages;

  if (DEBUGMODE) {
    console.log(
      'welcomeBackPopulateFields(): storedObject.languages:',
      storedObject.languages
    );
    console.log(
      'welcomeBackPopulateFields(): languagesChosenReturn:',
      languagesChosenReturn
    );
  }

  addLanguageFlags(1);
  return;
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

// Debug mode checks
if (DEBUGMODE) {
  console.log(`welcome.js running`);
}

// CODE END
//////////////////////////////////////////////////////////////////////////////////////////
