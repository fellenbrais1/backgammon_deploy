import { firebaseApp, analytics, database } from '../scripts/firebaseConfig.js';
import { sendRPC } from './chat.js';
import { showDisplayBox } from './displayBox.js';
import { changeModalContent, BUTTON_RESPONSE } from './modals.js';

const PIECE_RADIUS = 18;
const PIECE_DIAMETER = PIECE_RADIUS + PIECE_RADIUS;
const VERTICAL_TOLERANCE = 4;

const Stage = {
  DEMO: 'demo',
  CHOOSING: 'choosing',
  PLAYING: 'playing',
  BEARING: 'bearing',
  FINISHED: 'finished',
};

const pieces = document.querySelectorAll('.piece');

const boardElement = document.getElementById('board');
const boardLeftOffset = boardElement.getBoundingClientRect().left;
const boardTopOffset = boardElement.getBoundingClientRect().top;
//console.log('boardLeftOffset = ', boardLeftOffset, ', boardTopOffset = ', boardTopOffset);

console.log('Using Firebase in app.js:', firebaseApp);
const db = database;
console.log(analytics);
console.log(db);

// add dice
document.addEventListener('DOMContentLoaded', drawDice);

function drawDice() {
  let dice_white1_top, dice_white2_top, dice_red1_top, dice_red2_top;
  let red_face, white_face;

  console.log(
    'in drawDice(), game.myPlayer = ' +
      game.myPlayer +
      ', game.currentTurn = ' +
      game.currentTurn
  );

  // delete existing dice elements
  removeHtmlElement('dice_throws');
  removeHtmlElement('dice_white1');
  removeHtmlElement('dice_white2');
  removeHtmlElement('dice_red1');
  removeHtmlElement('dice_red2');

  // Create new dice elements
  const board_region = document.createElement('div');
  board_region.id = 'board-region';
  board_region.style.width = '50px';
  board_region.style.textAlign = 'center';

  let dice_throws = document.createElement('div');
  dice_throws.id = 'dice_throws';
  dice_throws.style.fontSize = '14px';
  dice_throws.innerHTML = '';

  // end turn button
  const end_turn = document.createElement('img');
  end_turn.id = 'end_turn';
  end_turn.src = 'images/endturn.png';
  end_turn.alt = 'End Turn';
  end_turn.title = 'Cannot proceed. End my turn';
  end_turn.style.position = 'absolute';
  end_turn.style.top = '210px';
  end_turn.style.left = '10px';
  end_turn.style.visibility = 'hidden';

  let dice_white1 = document.createElement('img');
  dice_white1.id = 'dice_white1';
  let dice_white2 = document.createElement('img');
  dice_white2.id = 'dice_white2';
  let dice_red1 = document.createElement('img');
  dice_red1.id = 'dice_red1';
  let dice_red2 = document.createElement('img');
  dice_red2.id = 'dice_red2';

  // Set the source of the images
  if (game.myPlayer == 'r') {
    red_face =
      game.currentTurn == 'r'
        ? 'images/dice-red-click.png'
        : 'images/dice-red-six.png';
    white_face = 'images/dice-six.png';
  } else {
    white_face =
      game.currentTurn == 'w' ? 'images/dice-click.png' : 'images/dice-six.png';
    red_face = 'images/dice-red-six.png';
  }
  // apply the above
  dice_white1.src = white_face;
  dice_white2.src = white_face;
  dice_red1.src = red_face;
  dice_red2.src = red_face;

  // Set the size of the images (40px wide and 40px tall)
  dice_white1.width = 40;
  dice_white1.height = 40;
  dice_white2.width = 40;
  dice_white2.height = 40;
  dice_red1.width = 40;
  dice_red1.height = 40;
  dice_red2.width = 40;
  dice_red2.height = 40;

  // Set the style to position the images - player's own dice are at the top
  console.log('In DOMContentLoaded');
  if (game.myPlayer == 'r') {
    dice_white1_top = '310px';
    dice_white2_top = '360px';
    dice_red1_top = '110px';
    dice_red2_top = '160px';
  } else {
    dice_white1_top = '110px';
    dice_white2_top = '160px';
    dice_red1_top = '310px';
    dice_red2_top = '360px';
  }

  board_region.style.position = 'absolute';
  board_region.style.top = '86px';
  board_region.style.left = '5px';

  dice_white1.style.position = 'absolute';
  dice_white1.style.top = dice_white1_top;
  dice_white1.style.left = '10px';
  dice_white2.style.position = 'absolute';
  dice_white2.style.top = dice_white2_top;
  dice_white2.style.left = '10px';

  dice_red1.style.position = 'absolute';
  dice_red1.style.top = dice_red1_top;
  dice_red1.style.left = '10px';
  dice_red2.style.position = 'absolute';
  dice_red2.style.top = dice_red2_top;
  dice_red2.style.left = '10px';

  // Append the images to the 'board' div
  board_region.appendChild(dice_throws);
  document.getElementById('board').appendChild(board_region);
  document.getElementById('board').appendChild(end_turn);
  document.getElementById('board').appendChild(dice_white1);
  document.getElementById('board').appendChild(dice_white2);
  document.getElementById('board').appendChild(dice_red1);
  document.getElementById('board').appendChild(dice_red2);

  dice_white1.addEventListener('click', rollWhiteDice);
  dice_white2.addEventListener('click', rollWhiteDice);
  dice_red1.addEventListener('click', rollRedDice);
  dice_red2.addEventListener('click', rollRedDice);

  // event listener for 'end turn' button 
  end_turn.addEventListener('click', async () => {
    const diceThrows = board.diceThrows;
    const filteredDiceThrows = diceThrows.filter((value) => value !== 0);
    const result = await changeModalContent('movesRemaining', filteredDiceThrows);
    
    if (result === BUTTON_RESPONSE.BUTTON_YES) {
      // send 'endturn' signal to the other player
      sendRPC('endTurn', null);

      board.diceThrows.fill(0);
      displayDiceThrows();
      game.eventTurnFinished();
    }
  });
}

function canBearOff(player) {
  const homeStart = player === 'r' ? 19 : 1;
  const homeEnd = player === 'r' ? 24 : 6;

  // Check all positions outside the home board
  for (let i = 1; i <= 26; i++) {
    // Skip the home board positions
    if (i >= homeStart && i <= homeEnd) {
      continue;
    }

    // Check if this position contains any pieces of the player's color
    const position = board.contents[i].occupied;
    if (
      Array.isArray(position) &&
      position.some(
        (piece) => typeof piece === 'string' && piece.startsWith(player)
      )
    ) {
      return false; // Found a piece outside home board
    }
  }

  // No pieces found outside home board
  return true;
}

function isHomeEmpty(player) {
  const homeStart = player === 'r' ? 19 : 1;
  const homeEnd = player === 'r' ? 24 : 6;

  for (let i = homeStart; i <= homeEnd; i++) {
    // Check if this position contains any pieces of the player's color
    const position = board.contents[i].occupied;

    if (
      Array.isArray(position) &&
      position.some(
        (piece) => typeof piece === 'string' && piece.startsWith(player)
      )
    ) {
      return false; // Found a piece outside home board
    }
  }

  // no pieces found in home board
  return true;
}

// computes stage of game for a particular player
// updates current player's game.stage attribute
// returns one of the Stage enum values
function computeGameStage(player) {
  let stage;

  if (game.stage == Stage.DEMO) return Stage.DEMO;

  if (canBearOff(player)) {
    if (isHomeEmpty(player) && board.onTheMove == '') {
      stage = Stage.FINISHED;
    } else {
      stage = Stage.BEARING;
    }
  } else {
    stage = Stage.PLAYING;
  }

  // save away our own player's stage
  if (player == game.myPlayer) game.stage = stage;

  return stage;
}

// remove html element
function removeHtmlElement(id) {
  const element = document.getElementById(id);

  if (element) {
    const parent = element.parentNode;
    parent.removeChild(element);
  }
}

// Helper function to create a delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDiceThrows() {
  return board.diceThrows;
}

// Playback functions
export async function playbackDiceRoll(param) {
  // console.log('In playbackDiceRoll, param = ' + JSON.stringify(param));

  if (param.player == 'w') {
    // console.log('About to playback the roll of white dice');
    await rollWhiteDice(param);
  } else {
    // console.log('About to playback the roll of red dice');
    await rollRedDice(param);
  }
}

export async function playbackMove(move) {
  let destinationPoint;

  // console.log('In playbackMove, move = ' + JSON.stringify(move));

  // needs to run this, not to get info on whether a valid move, but for the side effects that it determines blots
  isValidDiceMove(move);

  // console.log('In playbackMove board.blotsTaken = ' + JSON.stringify(board.blotsTaken));

  const toColor = board.colorOfPoint(move.to);
  const toOccupied = board.contents[move.to].occupied.length;

    // If piece moving off board, then send to right destination
    // If piece moving off board, then send to right destination
    if (move.to == 0) {
      destinationPoint = move.pieceId[0] == 'r' ? 27 : 28;
    } else {
      destinationPoint = move.to;
    }

  // Step 2: work out coordinates to animate snap of the active player - depends on whether taking blot or not
  const posToOccupy = (toColor != move.player && toOccupied == 1) ? 1 : board.contents[destinationPoint].occupied.length + 1;
  let [x, y] = getPieceCoords(game.myPlayer, destinationPoint, posToOccupy);
  await animateMovePiece(move.pieceId, x, y, 0.5);

  // Step 3: take any blots
  let uniqueSortedBlots = [...new Set(board.blotsTaken)];
  if (move.player === 'r') {
    uniqueSortedBlots.sort((a, b) => a - b);
  } else {
    uniqueSortedBlots.sort((a, b) => b - a);  // take blots in reverse order for white
  }
  for (let i = 0; i < uniqueSortedBlots.length; i++) {
    await takeBlot(uniqueSortedBlots[i]);
  }

  // Step 4: update board model
  board.contents[move.from].occupied.pop();
  board.contents[destinationPoint].occupied.push(move.pieceId);

  board.updatePointOccupation(move.from);
  board.updatePointOccupation(destinationPoint);

  consumeDiceMove(move);
  // displayDiceThrows();

  return;
}

export function playbackEndTurn(opponentName) {
  showDisplayBox(`${opponentName} has ended their turn`, 5000);
  game.eventTurnFinished();
}

// animate rolling white dice - call with predetermined dice numbers, or via event listener for a real 'throw'
// note that if rollWhiteDice is invoked from an event listener, the first param will be an event. We can use this to
// determine whether to have default values for the dice throws.
async function rollWhiteDice(param) {
  let finalIndex1, finalIndex2;

  // Check if first parameter is an event (indicates dice clicked rather than playback)
  const isEvent = param && param.target !== undefined;

  if (isEvent && game.myPlayer != 'w') return; // can be clicked by white player only, but playback still works

  if (isEvent) {
    if (game.whiteDiceActive == false) return;
    game.whiteDiceActive = false;
  }

  // Set default values accordingly
  const dice1Result = isEvent ? 0 : param.dice1 ?? 0;
  const dice2Result = isEvent ? 0 : param.dice2 ?? 0;

  // Array of dice image paths
  var diceFaces = [
    'images/dice-one.png',
    'images/dice-two.png',
    'images/dice-three.png',
    'images/dice-four.png',
    'images/dice-five.png',
    'images/dice-six.png',
  ];

  if (dice1Result == 0 && dice2Result == 0) {
    finalIndex1 = Math.floor(Math.random() * diceFaces.length);
    finalIndex2 = Math.floor(Math.random() * diceFaces.length);

    // communicate to the other player via RPC
    sendRPC('diceRoll', {
      player: 'w',
      dice1: finalIndex1 + 1,
      dice2: finalIndex2 + 1,
    });
  } else {
    finalIndex1 = dice1Result - 1; // make 0-based
    finalIndex2 = dice2Result - 1;
  }

  console.log('White dice clicked! Rolling the dice...');

  // clear previous throw
  board.diceThrows.fill(0);

  const dice_white1 = document.getElementById('dice_white1');
  const dice_white2 = document.getElementById('dice_white2');

  // Simulate rolling by changing the dice face multiple times
  for (let i = 0; i < 5; i++) {
    // Generate a random number between 0 and 5 (inclusive)
    let randomIndex1 = Math.floor(Math.random() * diceFaces.length);
    let randomIndex2 = Math.floor(Math.random() * diceFaces.length);

    // Change the dice image to a random face
    dice_white1.src = diceFaces[randomIndex1];
    dice_white2.src = diceFaces[randomIndex2];

    // Wait for 100ms before changing the face again
    await sleep(100);
  }

  // Wait for half a second before the final roll
  await sleep(100);

  // ??? simulating a throw
  // finalIndex1 = 1;
  // finalIndex2 = 4;

  // Final roll
  dice_white1.src = diceFaces[finalIndex1];
  dice_white2.src = diceFaces[finalIndex2];

  board.diceThrows[0] = finalIndex1 + 1;
  board.diceThrows[1] = finalIndex2 + 1;
  if (board.diceThrows[0] == board.diceThrows[1]) {
    board.diceThrows[2] = board.diceThrows[3] = board.diceThrows[0];
  }

  // show display of dice throws
  board.originalThrows = [...board.diceThrows];

  if (isEvent) displayDiceThrows();

  console.log('White dice rolled: ', board.diceThrows);
}

// animate rolling red dice
async function rollRedDice(param) {
  let finalIndex1, finalIndex2;

  // Check if first parameter is an event (indicates dice clicked rather than playback)
  const isEvent = param && param.target !== undefined;

  if (isEvent && game.myPlayer != 'r') return; // can be clicked by red player only, but playback still works

  if (isEvent) {
    if (game.redDiceActive == false) return;
    game.redDiceActive = false;
  }

  // Set default values accordingly
  const dice1Result = isEvent ? 0 : param.dice1 ?? 0;
  const dice2Result = isEvent ? 0 : param.dice2 ?? 0;

  // Array of dice image paths
  var diceFaces = [
    'images/dice-red-one.png',
    'images/dice-red-two.png',
    'images/dice-red-three.png',
    'images/dice-red-four.png',
    'images/dice-red-five.png',
    'images/dice-red-six.png',
  ];

  if (dice1Result == 0 && dice2Result == 0) {
    finalIndex1 = Math.floor(Math.random() * diceFaces.length);
    finalIndex2 = Math.floor(Math.random() * diceFaces.length);

    // communicate to the other player via RPC
    sendRPC('diceRoll', {
      player: 'r',
      dice1: finalIndex1 + 1,
      dice2: finalIndex2 + 1,
    });
  } else {
    finalIndex1 = dice1Result - 1; // make 0-based
    finalIndex2 = dice2Result - 1;
  }

  console.log('Red dice clicked! Rolling the dice...');

  // clear previous throw
  board.diceThrows.fill(0);

  const dice_red1 = document.getElementById('dice_red1');
  const dice_red2 = document.getElementById('dice_red2');

  // Simulate rolling by changing the dice face multiple times
  for (let i = 0; i < 5; i++) {
    // Generate a random number between 0 and 5 (inclusive)
    let randomIndex1 = Math.floor(Math.random() * diceFaces.length);
    let randomIndex2 = Math.floor(Math.random() * diceFaces.length);

    // Change the dice image to a random face
    dice_red1.src = diceFaces[randomIndex1];
    dice_red2.src = diceFaces[randomIndex2];

    // Wait for 100ms before changing the face again
    await sleep(100);
  }

  // Wait for some time before the final roll
  await sleep(100);

  // ??? simulating a throw
  finalIndex1 = 4;
  finalIndex2 = 0;

  // Final roll
  dice_red1.src = diceFaces[finalIndex1];
  dice_red2.src = diceFaces[finalIndex2];

  board.diceThrows[0] = finalIndex1 + 1;
  board.diceThrows[1] = finalIndex2 + 1;
  if (board.diceThrows[0] == board.diceThrows[1]) {
    board.diceThrows[2] = board.diceThrows[3] = board.diceThrows[0];
  }

  // show display of dice throws
  board.originalThrows = [...board.diceThrows];

  if (isEvent) displayDiceThrows();

  console.log('Red dice rolled: ', board.diceThrows);
}

// Test button 2
document.querySelector('.test_button2').addEventListener('click', function () {
  // demoRegisterForChat();

  // if (game.currentTurn == 'w') {
  //   game.currentTurn = 'r';
  // } else {
  //   game.currentTurn = 'w';
  // }

  // drawBoardNoAnimation();

  // console.log('CurrentTurn is now ' + game.currentTurn);

  console.log(
    'Status: ' +
      'game.myPlayer = ' +
      game.myPlayer +
      ', game.currentTurn = ' +
      game.currentTurn +
      ', stage = ' + game.stage
  );

  // print contents of board
  for (let i = 0; i <= 26; i++) {
    console.log('point [' + i + '] = ' + board.contents[i].occupied);
  }
});

class CoordinateMapper {
  constructor() {
    this.coordinates = new Map();
  }

  // Add a coordinate mapping
  addCoordinate(pt, pos, x, y) {
    const key = `${x},${y}`;
    this.coordinates.set(key, { pt, pos });
  }

  // Find the exact point and pos for given x,y coordinates
  findPointAndPos(x, y) {
    // console.log(
    //   'findPointAndPos called with game.myPlayer = ' +
    //     game.myPlayer +
    //     ', x = ' +
    //     x +
    //     ', y = ' +
    //     y
    // );
    const key = `${x},${y}`;
    const originalResult = this.coordinates.get(key);
    // console.log(
    //   'findPointAndPos, key found = ' + JSON.stringify(originalResult)
    // );

    if (originalResult === undefined) return { pt: 0, pos: 0 };

    // Return a new object with the values from originalResult without any transformation
    // The point transformation for red player is handled in identifyPoint only
    const result = { pt: originalResult.pt, pos: originalResult.pos };

    // console.log('findPointAndPos returning ' + JSON.stringify(result));
    return result;
  }
}

const game = {
  myPlayer: 'w',
  currentTurn: 'w',
  currentMove: {},
  redDiceActive: true,
  whiteDiceActive: true,
  stage: Stage.DEMO,

  eventTurnFinished() {
    console.log('In EVENT TURN FINISHED');

    // make it the other player's turn
    if (this.currentTurn == 'w') {
      this.currentTurn = 'r';

      // display dice-click image on red dice
      let dice_red1 = document.getElementById('dice_red1');
      let dice_red2 = document.getElementById('dice_red2');

      if (this.myPlayer == 'r') {
        dice_red1.src = 'images/dice-red-click.png';
        dice_red2.src = 'images/dice-red-click.png';
        this.whiteDiceActive = false;
        this.redDiceActive = true;
      }
    } else {
      this.currentTurn = 'w';

      // display dice-click image on white dice
      let dice_white1 = document.getElementById('dice_white1');
      let dice_white2 = document.getElementById('dice_white2');

      if (this.myPlayer == 'w') {
        dice_white1.src = 'images/dice-click.png';
        dice_white2.src = 'images/dice-click.png';
        this.whiteDiceActive = true;
        this.redDiceActive = false;
      }
    }

    this.applyControls();
  },

  applyControls() {
    // dice
    const dice_red1 = document.getElementById('dice_red1');
    const dice_red2 = document.getElementById('dice_red2');
    const dice_white1 = document.getElementById('dice_white1');
    const dice_white2 = document.getElementById('dice_white2');

    let red_opacity = '0.5';
    let white_opacity = '0.5';

    if (game.myPlayer == 'w' && game.currentTurn == 'w') white_opacity = '1.0';
    if (game.myPlayer == 'r' && game.currentTurn == 'r') red_opacity = '1.0';
    
    dice_red1.style.opacity = red_opacity;
    dice_red2.style.opacity = red_opacity;
    dice_white1.style.opacity = white_opacity;
    dice_white2.style.opacity = white_opacity;
  },
};

const mapper = new CoordinateMapper();
defineCoordMap();

// Create the board object
//  - 0 represents nowhere or invalid position
//  - 1 to 24 represents the actual points
//  - 25 represents red-bar
//  - 26 represents white-bar
const board = {
  contents: Array.from({ length: 29 }, () => ({
    color: '',
    occupied: [],
  })),

  diceThrows: [0, 0, 0, 0],

  originalThrows: [0, 0, 0, 0],

  blotsTaken: [],             // collection of blots that can be taken

  onTheMove: '', // piece id that is currently on the move

  // Method to update a specific point by index
  updatePoint(index, newContent) {
    if (index < 0 || index >= this.contents.length) {
      console.error('Index out of bounds');
      return;
    }
    this.contents[index] = { ...this.contents[index], ...newContent };
  },

  resetPiecesPosition(piece) {
    piece.style.top = '';
    piece.style.left = '6px';
  },

  // Method to reset the board
  resetBoard() {
    this.contents = this.contents.map(() => ({
      occupied: [],
    }));

    // Starting positions

    // Correct Layout
    // this.contents[1].occupied = ['r1', 'r2'];
    // this.contents[2].occupied = [];
    // this.contents[3].occupied = [];
    // this.contents[4].occupied = [];
    // this.contents[5].occupied = [];
    // this.contents[6].occupied = ['w1', 'w2', 'w3', 'w4', 'w5'];
    // this.contents[7].occupied = [];
    // this.contents[8].occupied = ['w6', 'w7', 'w8'];
    // this.contents[9].occupied = [];
    // this.contents[10].occupied = [];
    // this.contents[11].occupied = [];
    // this.contents[12].occupied = ['r3', 'r4', 'r5', 'r6', 'r7'];
    // this.contents[13].occupied = ['w9', 'w10', 'w11', 'w12', 'w13'];
    // this.contents[14].occupied = [];
    // this.contents[15].occupied = [];
    // this.contents[16].occupied = [];
    // this.contents[17].occupied = ['r8', 'r9', 'r10'];
    // this.contents[18].occupied = [];
    // this.contents[19].occupied = ['r11', 'r12', 'r13', 'r14', 'r15'];
    // this.contents[20].occupied = [];
    // this.contents[21].occupied = [];
    // this.contents[22].occupied = [];
    // this.contents[23].occupied = [];
    // this.contents[24].occupied = ['w14', 'w15'];

    // this.contents[25].occupied = []; // red bar
    // this.contents[26].occupied = []; // white bar
    // this.contents[27].occupied = []; // red off
    // this.contents[28].occupied = []; // white off

    // bearing off layout
    this.contents[1].occupied = ['w14', 'w15'];
    this.contents[2].occupied = ['w11', 'w12'];
    this.contents[3].occupied = ['w9', 'w10'];
    this.contents[4].occupied = ['w6', 'w7', 'w8'];
    this.contents[5].occupied = [];
    this.contents[6].occupied = ['w1', 'w2'];
    this.contents[7].occupied = [];
    this.contents[8].occupied = [];
    this.contents[9].occupied = [];
    this.contents[10].occupied = [];
    this.contents[11].occupied = [];
    this.contents[12].occupied = [];
    this.contents[13].occupied = [];
    this.contents[14].occupied = [];
    this.contents[15].occupied = [];
    this.contents[16].occupied = [];
    this.contents[17].occupied = [];
    this.contents[18].occupied = [];
    this.contents[19].occupied = ['r3', 'r4'];
    this.contents[20].occupied = [];
    this.contents[21].occupied = ['r5', 'r6', 'r7'];
    this.contents[22].occupied = ['r9', 'r10'];
    this.contents[23].occupied = ['r14', 'r15'];
    this.contents[24].occupied = ['r1', 'r2'];

    this.contents[25].occupied = []; // red bar
    this.contents[26].occupied = []; // white bar
    this.contents[27].occupied = []; // red off
    this.contents[28].occupied = []; // white off
  },

  completeMovePiece(toPoint) {
    // console.log('in board.completeMovePiece, toPoint=' + toPoint);
    this.contents[toPoint].occupied.push(board.onTheMove);
    board.onTheMove = ''; // finished moving
  },

  movePiece(fromPoint, toPoint) {
    let pieceId = this.contents[fromPoint].occupied.at(-1);
    this.contents[fromPoint].occupied.pop();
    this.contents[toPoint].occupied.push(pieceId);
  },

  updatePointOccupation(reqPointNumber) {
    let pointNumber, limit;

    // if being moved to point 0, convert to point 27 for red, 28 for white
    if (reqPointNumber == 0) {
      pointNumber = game.myPlayer == 'r' ? 27 : 28;
    }

    // reverse point numbers for points 1 - 24 when player is red
    pointNumber =
      game.myPlayer == 'r' && reqPointNumber <= 24
        ? 25 - reqPointNumber
        : reqPointNumber;

    const pieceNumberId = 'pieceNumber' + pointNumber;
    const pointsNumber = document.getElementById(pieceNumberId);

    let occupied = this.contents[reqPointNumber].occupied.length;
    //let color = this.contents[pointNumber].color;
    let pointColor = this.colorOfPoint(reqPointNumber);

    // let limit = pointNumber < 25 ? 5 : 1;

    // calculate limit before point occupation is displayed
    // 5 points without occupied number, 1 on bars (points 25 and 26) and 0 for OFFs (27 and 28)
    if (pointNumber < 25) {
      limit = 5;
    } else if (pointNumber == 25 || pointNumber == 26) {
      limit = 1;
    } else {
      limit = 0;
    }

    if (occupied <= limit) {
      // console.log('in updatePointOccupation: reqPointNumber=' + reqPointNumber);
      pointsNumber.textContent = '';
    } else {
      pointsNumber.textContent = '' + occupied;
      if (pointColor == 'w') pointsNumber.style.color = 'gray';
      if (pointColor == 'r') pointsNumber.style.color = 'white';
    }
  },

  colorOfPoint(pointNumber) {
    if (this.contents[pointNumber].occupied.length == 0) {
      return '';
    } else {
      return this.contents[pointNumber].occupied[0][0];
    }
  },

  // Method to print the current state of the board
  printBoard() {
    console.log(this.contents);
  },
};

export async function startGame(playerAssign, isChallenger) {
  if (playerAssign) {
    game.stage = Stage.PLAYING;
    game.myPlayer = isChallenger ? 'r' : 'w'; // was: game.myPlayer = isChallenger ? 'r' : 'w';
    game.currentTurn = 'r'; // was: game.currentTurn = 'r';
    game.redDiceActive = true;  // was true
    game.whiteDiceActive = false; // was false
  } else {
    game.stage = Stage.DEMO;
    game.myPlayer = 'w';
    game.currentTurn = 'w';
    game.redDiceActive = false;
    game.whiteDiceActive = true;
  }

  pieces.forEach((current) => {
    board.resetPiecesPosition(current);
  });

  board.resetBoard();
  setupMouseEvents();
  await drawBoardWithAnimation(game.myPlayer);
  // console.log(
  //   'About to apply game controls with myPlayer = ' +
  //     game.myPlayer +
  //     ' and currentTurn = ' +
  //     game.currentTurn
  // );
  game.applyControls();
  // console.log('After applying game controls');
}

let isPieceDragging = false; // Global flag to track if a piece is being dragged

function setupMouseEvents() {
  // Install event listeners on each piece
  pieces.forEach((piece) => {
    piece.addEventListener('mousedown', (e) => {
      if (isPieceDragging) {
        // If a piece is already being dragged, ignore this event
        return;
      }

      // Determine the piece's position
      const x = piece.offsetLeft + PIECE_RADIUS;
      const y = piece.offsetTop + PIECE_RADIUS;
      const { pt: originalPt, pos } = mapper.findPointAndPos(x, y);
      // Apply board point reversal for red player here, consistent with identifyPoint
      const pt =
        game.myPlayer == 'r' && originalPt >= 1 && originalPt <= 24
          ? 25 - originalPt
          : originalPt;
      // console.log(
      //   'in mouseDown 1, originalPt = ' +
      //     originalPt +
      //     ', adjusted pt = ' +
      //     pt +
      //     ', pos = ' +
      //     pos
      // );

      // Check if the piece is movable
      if (!isPieceMovable(piece, pt, pos)) {
        console.log('Movement disallowed.');
        return; // Exit the handler if the piece cannot be moved
      }

      // Calculate the offset between the cursor and the piece's top-left corner
      // This ensures the piece moves with the cursor at the exact spot where it was clicked
      const pieceRect = piece.getBoundingClientRect();
      const offsetX = e.clientX - pieceRect.left;
      const offsetY = e.clientY - pieceRect.top;

      // Bring the current piece to the front
      piece.style.zIndex = '1000'; // Set a high z-index value

      // Record the starting point of the move
      // console.log('Grabbed piece on point ' + pt);
      game.currentMove.pieceId = piece.id;
      game.currentMove.player = game.currentTurn;
      game.currentMove.from = pt;
      game.currentMove.to = 0;

      // Mark the piece as being moved
      board.onTheMove = piece.id;
      board.contents[pt].occupied.pop();
      board.updatePointOccupation(pt);

      // Set the global flag to indicate a piece is being dragged
      isPieceDragging = true;

      // Define the mousemove event handler
      const onMouseMove = (event) => {
        // Get current board position - recalculate in case of scrolling or resize
        const currentBoardRect = boardElement.getBoundingClientRect();

        // Update the piece's position based on mouse movement
        // Use the calculated offset to maintain the cursor's position relative to the piece
        let newLeft = event.clientX - offsetX - currentBoardRect.left;
        let newTop = event.clientY - offsetY - currentBoardRect.top;

        piece.style.left = newLeft + 'px';
        piece.style.top = newTop + 'px';

        let point = identifyPoint(
          event.clientX,
          event.clientY,
          currentBoardRect
        );
        // console.log('in onMouseMove, point = ' + point);
        applyHighlight(point, 1);
      };

      // Attach the mousemove event listener to the document
      document.addEventListener('mousemove', onMouseMove);

      // Define the mouseup event handler
      const onMouseUp = (event) => {
        // Remove the mousemove event listener to stop tracking mouse movements
        document.removeEventListener('mousemove', onMouseMove);

        // Reset the piece's z-index and remove highlights
        piece.style.zIndex = '';
        applyHighlight(0, 0);

        // Record the ending point of the move
        // Get current board position for accurate coordinates
        const finalBoardRect = boardElement.getBoundingClientRect();
        let point = identifyPoint(event.clientX, event.clientY, finalBoardRect);
        game.currentMove.to = point;
        // console.log(
        //   'On mouseup, move is from point ' +
        //     game.currentMove.from +
        //     ' to ' +
        //     game.currentMove.to
        // );

        // Apply the move to the board
        applyMove(game.currentMove);

        // Reset the global flag to indicate the piece is no longer being dragged
        isPieceDragging = false;
      };

      // Attach the mouseup event listener to the document
      document.addEventListener('mouseup', onMouseUp, { once: true });
    });
  });
}

// returns true or false
// also has side-effect of populating board.blotsTaken[]
function isValidDiceMove(move) {
  let effectiveMoveValue;

  // clear out blotsTaken list
  board.blotsTaken.length = 0;

  // special case 1 - moving off the bar
  if (move.from == 25 || move.from == 26) {
    if (move.player == 'r') { // was game.myPlayer
      effectiveMoveValue = move.to;
    } else {
      effectiveMoveValue = 25 - move.to;
    }
  } else {
    // ordinary move
    effectiveMoveValue =
      game.currentTurn == 'w' ? move.from - move.to : move.to - move.from;
  }

  // special case 2 - bearing off
  if (computeGameStage(move.player) == Stage.BEARING && move.to == 0) {
    effectiveMoveValue = move.player == 'r' ? 25 - move.from : move.from;

    return (canMakeBearOff(move, effectiveMoveValue, board.diceThrows));
  }

  return (canMakeSum(move, effectiveMoveValue, board.diceThrows).length); // i.e. one or more possible sequences returned
}

// work out if a piece can be borne off with the values in the throw
// return true or false
function canMakeBearOff(move, effectiveMoveValue, throws) {
    // calculate topmost point
    let highestPoint = getTopPointHome(move.player); // returns number 1 to 6
    console.log('topmost Point = ' + highestPoint);

    // Filter out zeros
    const dice = throws.filter((value) => value !== 0);

    // sort the dice - so we test the highest value first
    if (dice.length > 1) {
      dice.sort((a, b) => b - a);
    }

    // iterate dice throws (from highest value to lowest) until we get a suitable match
    for (let d = 0; d < dice.length; d++) {

      // match scenario 1 - dice matches exactly
      if (dice[d] == effectiveMoveValue) return true;

      // match scenario 2 - dice acts as number higher then effectiveMoveValue
      if (highestPoint <= effectiveMoveValue) {
        if (dice[d] > effectiveMoveValue) return true;
      }
    }
    
    return false;
}

// work out what dice throw was used when a piece is borne off - remove from board.diceThrows
function consumeDiceBearOff(move, effectiveMoveValue, throws) {
    let consumedValue = 0;

    // calculate topmost point
    let highestPoint = getTopPointHome(move.player); // returns number 1 to 6
    console.log('topmost Point = ' + highestPoint);

    // Filter out zeros
    const dice = throws.filter((value) => value !== 0);

    // sort the dice - so we test the highest value first
    if (dice.length > 1) {
      dice.sort((a, b) => b - a);
    }

    // iterate dice throws (from highest value to lowest) until we get a suitable match
    for (let d = 0; d < dice.length; d++) {

      // match scenario 1 - dice matches exactly
      if (dice[d] == effectiveMoveValue) consumedValue = dice[d];

      // match scenario 2 - dice acts as number higher then effectiveMoveValue
      if (highestPoint <= effectiveMoveValue) {
        if (dice[d] > effectiveMoveValue) consumedValue = dice[d];
      }
    }

    // if we get a matching value, remove from board.diceThrows by overwriting with 0
    if (consumedValue) {
      for (let i = 0; i < board.diceThrows.length; i++) {
        if (board.diceThrows[i] == consumedValue) {
          board.diceThrows[i] = 0;
          break;
        }
      }
    }
    
}

// return topmost occupied point in home board - return 1 to 6
function getTopPointHome(player) {
  let i, homeBoardStart, homeBoardEnd;

  if (player == 'r') {
    homeBoardStart = 19;
    homeBoardEnd = 24;
  } else {
    homeBoardStart = 1;
    homeBoardEnd = 6;
  }

  for (i = homeBoardStart; i <= homeBoardEnd; i++) {
    if (board.colorOfPoint(i) == player) break;
  }

  return player == 'r'? 25 - i : i;
}

function canMakeSum(move, effectiveMoveValue, diceThrows) {
  let blots;

  // Filter out zeros
  const dice = diceThrows.filter((value) => value !== 0);

  // Store all valid move sequences
  const validSequences = [];

  // If no dice available, no sum is possible
  if (dice.length === 0) return [];

  // Special case: 3 or 4 identical dice
  if (dice.length >= 3) {
    // All values must be the same
    const dieValue = dice[0];

    // Check if effectiveMoveValue is a multiple of the die value
    // and requires no more dice than we have
    if (
      effectiveMoveValue % dieValue === 0 &&
      effectiveMoveValue / dieValue <= dice.length
    ) {
      // Create sequence of required dice
      const diceNeeded = effectiveMoveValue / dieValue;
      const sequence = Array(diceNeeded).fill(dieValue);

      // Test this sequence
      blots = testMoveSequence(move, sequence);
      if (blots !== null) {
        validSequences.push(sequence);                        // save sequence
        if (Array.isArray(blots) && blots.length > 0) {       // save any blots produced
          board.blotsTaken = board.blotsTaken.concat(blots);
        }
      }
    }

    return validSequences;
  }

  // Handle 1 or 2 dice case (which could have different values)
  if (dice.length === 1) {
    // With 1 die, the value must match exactly
    if (effectiveMoveValue === dice[0]) {
      const sequence = [dice[0]];
      blots = testMoveSequence(move, sequence);
      if (blots !== null) {
        validSequences.push(sequence);                        // save sequence
        if (Array.isArray(blots) && blots.length > 0) {       // save any blots produced
          board.blotsTaken = board.blotsTaken.concat(blots);
        }
      }
    }
  } else if (dice.length === 2) {
    // dice.length === 2
    // Check individual values and their sum

    // Check first die
    if (effectiveMoveValue === dice[0]) {
      const sequence = [dice[0]];
      blots = testMoveSequence(move, sequence);
      if (blots !== null) {
        validSequences.push(sequence);                        // save sequence
        if (Array.isArray(blots) && blots.length > 0) {       // save any blots produced
          board.blotsTaken = board.blotsTaken.concat(blots);
        }
      }
    }

    // Check second die
    if (effectiveMoveValue === dice[1]) {
      const sequence = [dice[1]];
      blots = testMoveSequence(move, sequence);
      if (blots !== null) {
        validSequences.push(sequence);                       // save sequence
        if (Array.isArray(blots) && blots.length > 0) {      // save any blots produced
          board.blotsTaken = board.blotsTaken.concat(blots);
        }
      }
    }

    // Check sum of both dice (in both orders)
    if (effectiveMoveValue === dice[0] + dice[1]) {
      let blots1, blots2;

      // console.log('canMakeSum - testing totals of 2 dice');
      const sequence1 = [dice[0], dice[1]];
      const sequence2 = [dice[1], dice[0]];

      blots1 = testMoveSequence(move, sequence1);
      blots2 = testMoveSequence(move, sequence2);

      // test for ambiguity
      if (Array.isArray(blots1) && Array.isArray(blots2) && !hasSameElements(blots1, blots2)) {
        // this shows ambiguity, the 2 sequences have different side-effects
        showDisplayBox('Move depends on the dice order. Please move piece one dice at a time');

        return [];  // no sequences are valid
      }

      if (blots1 !== null) {
        validSequences.push(sequence1);                         // save sequence
        if (Array.isArray(blots1) && blots1.length > 0) {       // save any blots produced
          board.blotsTaken = board.blotsTaken.concat(blots1);
        }
      }

      if (blots2 !== null) {
        validSequences.push(sequence2);                         // save sequence
        if (Array.isArray(blots2) && blots2.length > 0) {       // save any blots produced
          board.blotsTaken = board.blotsTaken.concat(blots2);
        }
      }
    }
  }

  // TO-DO: What do we return to indicate the various states we are interested in?
  return validSequences;
}

function hasSameElements(arr1, arr2) {
  // Quick check for length equality
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  // Sort both arrays and convert to strings for comparison
  const sortAndStringify = (arr) => {
    // Create a copy to avoid modifying the original array
    return JSON.stringify([...arr].sort());
  };
  
  return sortAndStringify(arr1) === sortAndStringify(arr2);
}



/* This function has complex return values:
 *  null - the sequence is not possible
 *  [] (empty array) - sequence is possible but no blots taken
 *  [m,n] (populated array - sequence is possible and array contains blot point numbers)
 */
function testMoveSequence(move, sequence) {
  let testPoint;
  let result;
  let blots = [];

  // special case for coming off the bar
  if (move.from === 25) {
    testPoint = 0;
  } else if (move.from === 26) {
    testPoint = 25;  // was 25 - move.to
  } else {
    testPoint = move.from;
  }

  // console.log('Testing sequence:', sequence);

  const directionFactor = move.player == 'r' ? 1 : -1; // red advances through numbers, white subtracts

  for (let i = 0; i < sequence.length; i++) {
    testPoint = testPoint + directionFactor * sequence[i];
    result = canPieceLandHere(move.player, testPoint); // return null if false, 0 if no blot, point number if blot
    if (result === null) return null;
    if (result > 0) blots.push(result);
  }

  return blots;
}

/* This function has complex return values
 * null - piece cannot land
 * 0 - piece can land, no blot produced
 * n - piece can land, n is the point number of the blot
 */
function canPieceLandHere(player, point) {
  let pointColor = board.colorOfPoint(point);
  let pointOccupied = board.contents[point].occupied.length;

  // No piece on point
  if (pointColor == '') return 0;

  if (pointColor != player) {
    if (pointOccupied == 1) {
      return point;
    } else {
      return null; // occupied by other player
    }
  } else {
    return 0; // our point
  }
}

// for consuming a throw
function consumeDiceComposite(effectiveMoveValue, diceThrows) {
  // Filter out zeros but keep track of original indices
  const diceWithIndices = diceThrows
    .map((value, index) => ({ value, index }))
    .filter((d) => d.value !== 0);

  // If no dice available or sum not possible, do nothing
  if (diceWithIndices.length === 0) return;

  // Special case: 3 or 4 identical dice
  if (diceWithIndices.length >= 3) {
    const dieValue = diceWithIndices[0].value;

    // Check if effectiveMoveValue is a multiple of the die value
    if (
      effectiveMoveValue % dieValue === 0 &&
      effectiveMoveValue / dieValue <= diceWithIndices.length
    ) {
      // Calculate how many dice we need
      const diceNeeded = effectiveMoveValue / dieValue;

      // Set that many dice to zero
      for (let i = 0; i < diceNeeded; i++) {
        diceThrows[diceWithIndices[i].index] = 0;
      }
    }

    return;
  }

  // Handle 1 or 2 dice case
  if (diceWithIndices.length === 1) {
    // With 1 die, the value must match exactly
    if (effectiveMoveValue === diceWithIndices[0].value) {
      diceThrows[diceWithIndices[0].index] = 0;
    }
    return;
  } else {
    // diceWithIndices.length === 2
    // Try individual dice first
    if (effectiveMoveValue === diceWithIndices[0].value) {
      diceThrows[diceWithIndices[0].index] = 0;
      return;
    }

    if (effectiveMoveValue === diceWithIndices[1].value) {
      diceThrows[diceWithIndices[1].index] = 0;
      return;
    }

    // Try the sum of both dice
    if (
      effectiveMoveValue ===
      diceWithIndices[0].value + diceWithIndices[1].value
    ) {
      diceThrows[diceWithIndices[0].index] = 0;
      diceThrows[diceWithIndices[1].index] = 0;
    }
  }
}

function consumeDiceMove(move) {
  let effectiveMoveValue;

  // special case - moving off the bar
  if (move.from == 25 || move.from == 26) {
    if (move.player == 'r') {
      effectiveMoveValue = move.to;
    } else {
      effectiveMoveValue = 25 - move.to;
    }
  } else {
    // ordinary move
    effectiveMoveValue =
      game.currentTurn == 'w' ? move.from - move.to : move.to - move.from;
  }

  // special case - bearing off
  if (move.to == 0) {
    effectiveMoveValue = move.player == 'r' ? 25 - move.from : move.from;

    consumeDiceBearOff(move, effectiveMoveValue, board.diceThrows);
  } else {
    consumeDiceComposite(effectiveMoveValue, board.diceThrows);
  }  

  console.log(
    'consumeDiceMove - consumed dice move ' +
      effectiveMoveValue +
      ' Remaining throws = ' +
      board.diceThrows
  );

  // is the player's turn over?
  if (board.diceThrows.every((element) => element === 0)) {
    console.log('consumeDiceMove - about to call eventTurnFinished');
    game.eventTurnFinished();
  }
}



async function applyMove(move) {
  // either snap or return depending on move legality
  let posToOccupy, x, y;
  let barPoint, destinationPoint, opponentHomeBoardStart, opponentHomeBoardEnd;

  if (game.myPlayer === 'r') {
    barPoint = 25;
    opponentHomeBoardStart = 1;
    opponentHomeBoardEnd = 6;
  } else {
    barPoint = 26;
    opponentHomeBoardStart = 19;
    opponentHomeBoardEnd = 24;
  }

  // const toColor = board.contents[move.to].color;
  const toColor = board.colorOfPoint(move.to);
  const toOccupied = board.contents[move.to].occupied.length;

  // RETURNING
  const isValidMove = isValidDiceMove(move);

  if (
    (move.to == 0 && computeGameStage(move.player) != Stage.BEARING) ||
    move.to == 25 ||
    move.to == 26 ||
    move.from == 27 ||
    move.from == 28 ||
    move.to == move.from ||
    (toColor != '' && toColor != game.currentTurn && toOccupied > 1) ||
    !isValidMove || // moving an available throw
    (board.contents[barPoint].occupied.length &&
      (move.from != barPoint ||
        !(
          move.to >= opponentHomeBoardStart && move.to <= opponentHomeBoardEnd
        )))
  ) {
    // return back to beginning
    board.contents[move.from].occupied.push(board.onTheMove);
    board.onTheMove = '';

    posToOccupy = board.contents[move.from].occupied.length;
    [x, y] = getPieceCoords(game.myPlayer, move.from, posToOccupy);
    await animateMovePiece(move.pieceId, x, y, 0.5);
    board.updatePointOccupation(move.from);

    return;
  } // end of returning piece

  // STEP 1: Inform the other player
  sendRPC('move', {
    pieceId: move.pieceId,
    player: game.currentTurn,
    from: move.from,
    to: move.to,
  });

  // If piece moving off board, then send to right destination
  if (move.to == 0) {
    destinationPoint = move.pieceId[0] == 'r' ? 27 : 28;
  } else {
    destinationPoint = move.to;
  }

  // Step 2: work out coordinates to animate snap of the active player - depends on whether taking blot or not
  posToOccupy = (toColor != game.myPlayer && toOccupied == 1) ? 1 : board.contents[destinationPoint].occupied.length + 1;
  [x, y] = getPieceCoords(game.myPlayer, destinationPoint, posToOccupy); // ACTIVE

  if (move.to == 0) { // bearing off
    movePiece(move.pieceId, x, y);  // no animation for this move
  } else {
    await animateMovePiece(move.pieceId, x, y, 0.5);
  }

  // Step 3: take any blots
  let uniqueSortedBlots = [...new Set(board.blotsTaken)];
  if (game.myPlayer === 'r') {
    uniqueSortedBlots.sort((a, b) => a - b);
  } else {
    uniqueSortedBlots.sort((a, b) => b - a);  // take blots in reverse order for white
  }
  
  for (let i = 0; i < uniqueSortedBlots.length; i++) {
    await takeBlot(uniqueSortedBlots[i]);
  }

  // Step 4: update active position on board model
  board.completeMovePiece(destinationPoint);

  board.updatePointOccupation(move.from);
  board.updatePointOccupation(destinationPoint);

  consumeDiceMove(move);
  displayDiceThrows();

  return;
}

function movePiece(pieceId, x, y) {
  const piece = document.getElementById(pieceId);

  piece.style.left = x - PIECE_RADIUS + 'px';
  piece.style.top = y - PIECE_RADIUS + 'px';
}

async function takeBlot(blotPoint) {
  // what color is the blot?
  const blotColor = board.colorOfPoint(blotPoint);

  // Which bar point?
  let barPoint = blotColor == 'r' ? 25 : 26;

  // What piece?
  let blotPieceId = board.contents[blotPoint].occupied[0];

  let [x, y] = getPieceCoords(game.myPlayer, barPoint, 1);
  await animateMovePiece(blotPieceId, x, y, 0.5);

  // adjust the board model
  board.contents[blotPoint].occupied.pop();
  board.contents[barPoint].occupied.push(blotPieceId);
  board.updatePointOccupation(barPoint);
}


function applyHighlight(point, state) {
  // translate point coordinates when playing as red
  if (game.myPlayer == 'r') point = 25 - point;

  for (let pt = 1; pt <= 24; pt++) {
    const id = `highlight${pt}`; // Construct the element ID
    const element = document.getElementById(id); // Get the element by ID

    if (point == pt && state == 1) {
      // Check if the element exists
      element.style.backgroundColor = 'orange'; // Set the background color
    } else {
      element.style.backgroundColor = 'white';
    }
  }
}

async function drawBoardWithAnimation(player) {
  // console.log('In drawBoardWithAnimation');

  for (let pt = 1; pt <= 28; pt++) {
    const occupiedList = board.contents[pt].occupied;

    for (let pos = 1; pos <= occupiedList.length; pos++) {
      const pieceId = occupiedList[pos - 1];
      // const piece = document.getElementById(id);
      let [x, y] = getPieceCoords(player, pt, pos);
      await animateMovePiece(pieceId, x, y, 5);
    }
  }

  drawDice();
}

function drawBoardNoAnimation(player) {
  // console.log('In drawBoardNoAnimation');

  for (let pt = 1; pt <= 26; pt++) {
    const occupiedList = board.contents[pt].occupied;

    for (let pos = 1; pos <= occupiedList.length; pos++) {
      const id = occupiedList[pos - 1];
      const piece = document.getElementById(id);
      
      let [x, y] = getPieceCoords(player, pt, pos);
      
      // Set the new position based on progress
      piece.style.left = x - PIECE_RADIUS + 'px';
      piece.style.top = y - PIECE_RADIUS + 'px';
    }

    board.updatePointOccupation(pt);
  }
}

// Function to move the piece back to its original position over a given duration
function animateMovePiece(pieceId, targetX, targetY, speed) {
  return new Promise((resolve) => {
    let piece = document.getElementById(pieceId);
    const initialX = parseFloat(piece.style.left) || 0;
    const initialY = parseFloat(piece.style.top) || 0;
    const deltaX = parseFloat(targetX) - PIECE_RADIUS - initialX;
    const deltaY = parseFloat(targetY) - PIECE_RADIUS - initialY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Calculate duration based on distance and speed
    const duration = distance / speed;

    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1); // Cap at 1 (100%)

      // Set the new position based on progress
      piece.style.left = initialX + deltaX * progress + 'px';
      piece.style.top = initialY + deltaY * progress + 'px';

      if (progress < 1) {
        requestAnimationFrame(animate); // Continue animation
      } else {
        resolve(); // Animation complete, resolve the promise
      }
    }

    requestAnimationFrame(animate); // Start animation
  });
}

// Function to identify point from mouse coordinates
function identifyPoint(x, y, boardRect) {
  // Get current board position if not provided
  const currentBoardRect = boardRect || boardElement.getBoundingClientRect();
  const currentBoardLeft = currentBoardRect.left;
  const currentBoardTop = currentBoardRect.top;

  // console.log(
  //   'in identifyPoint, game.myPlayer = ' +
  //     game.myPlayer +
  //     ', x = ' +
  //     x +
  //     ', y = ' +
  //     y
  // );
  let point;

  if (
    // upper left
    x >= 72 + currentBoardLeft &&
    x < 324 + currentBoardLeft &&
    y >= 16 + currentBoardTop &&
    y <= 226 + currentBoardTop + PIECE_RADIUS - VERTICAL_TOLERANCE
  ) {
    // region = '18-13';

    let n = Math.floor((x - currentBoardLeft - 72) / 42);
    point = 13 + n;
  } else if (
    // upper right
    x >= 354 + currentBoardLeft &&
    x < 604 + currentBoardLeft &&
    y >= 16 + currentBoardTop &&
    y <= 226 + currentBoardTop + PIECE_RADIUS - VERTICAL_TOLERANCE
  ) {
    // region = '24-19';

    let n = Math.floor((x - currentBoardLeft - 354) / 42);
    point = 19 + n;
  } else if (
    // lower left
    x >= 72 + currentBoardLeft &&
    x < 324 + currentBoardLeft &&
    y >=
      272 +
        currentBoardTop -
        PIECE_RADIUS +
        VERTICAL_TOLERANCE +
        VERTICAL_TOLERANCE &&
    y <= 478 + currentBoardTop + VERTICAL_TOLERANCE + VERTICAL_TOLERANCE
  ) {
    // region = '12-7';
    let n = Math.floor((x - currentBoardLeft - 72) / 42);
    point = 12 - n;
  } else if (
    // lower right
    x >= 354 + currentBoardLeft &&
    x < 604 + currentBoardLeft &&
    y >=
      272 +
        currentBoardTop -
        PIECE_RADIUS +
        VERTICAL_TOLERANCE +
        VERTICAL_TOLERANCE &&
    y <= 478 + currentBoardTop + VERTICAL_TOLERANCE + VERTICAL_TOLERANCE
  ) {
    // region = '6-1';
    let n = Math.floor((x - currentBoardLeft - 354) / 42);
    point = 6 - n;
  } else if (
    x >= 314 + currentBoardLeft &&
    x <= 364 + currentBoardLeft &&
    y >= 231 - PIECE_RADIUS + currentBoardTop && // Centered on actual piece y-coord (231)
    y <= 231 + PIECE_RADIUS + currentBoardTop // Full coverage for piece radius
  ) {
    // region = 'Red Bar';
    point = 25;
  } else if (
    x >= 314 + currentBoardLeft &&
    x <= 364 + currentBoardLeft &&
    y >= 269 - PIECE_RADIUS + currentBoardTop && // Centered on actual piece y-coord (269)
    y <= 269 + PIECE_RADIUS + currentBoardTop // Full coverage for piece radius
  ) {
    // region = 'White Bar';
    point = 26;
  } else {
    point = 0;
  }

  if (game.myPlayer == 'r') {
    // reverse board
    if (point >= 1 && point <= 24) {
      point = 25 - point;
      // if (point >= 13) {
      //   point = point - 12;
      // } else {
      //   point = point + 12;
      // }
    }
  }

  // console.log('identifyPoint returning point ' + point);
  return point;
}

function getPieceCoords(player, reqPoint, reqPosition) {

  let x = 0, y = 0;

  if (reqPoint == 0 || reqPosition == 0) return [x, y];

  // position for requested positions > 5 are set to position 5
  let position = reqPosition > 5 ? 5 : reqPosition;
  let point = reqPoint;

  // convert the coords when playing as red
  if (player == 'r' && reqPoint <= 24) {
    point = 25 - reqPoint;
  }

  // upper right
  if (point <= 24 && point >= 19) {
    x = 567 + PIECE_RADIUS + (point - 24) * 42;
    y = 20 + PIECE_RADIUS + (position - 1) * (PIECE_DIAMETER + 2);
    return [x, y];
  }

  // upper left
  if (point <= 18 && point >= 13) {
    x = 284 + PIECE_RADIUS + (point - 18) * 42;
    y = 20 + PIECE_RADIUS + (position - 1) * (PIECE_DIAMETER + 2);
    return [x, y];
  }

  if (point <= 12 && point >= 7) {
    x = 74 + PIECE_RADIUS + (12 - point) * 42;
    y = 485 - PIECE_RADIUS - (position - 1) * (PIECE_DIAMETER + 2);
    return [x, y];
  }

  if (point <= 6 && point >= 1) {
    x = 105 + PIECE_RADIUS + (12 - point) * 42;
    y = 485 - PIECE_RADIUS - (position - 1) * (PIECE_DIAMETER + 2);
    return [x, y];
  }

  if (point == 25) {
    // red bar
    return [338, 231];
  }

  if (point == 26) {
    // white bar
    return [338, 269];
  }

  if (point == 27) {
    // top off region
    return [30, 28];
  }

  if (point == 28) {
    // bottom off region
    return [30, 472];
  }
}

function defineCoordMap() {
  mapper.addCoordinate(1, 1, 585, 467);
  mapper.addCoordinate(1, 2, 585, 429);
  mapper.addCoordinate(1, 3, 585, 391);
  mapper.addCoordinate(1, 4, 585, 353);
  mapper.addCoordinate(1, 5, 585, 315);
  mapper.addCoordinate(2, 1, 543, 467);
  mapper.addCoordinate(2, 2, 543, 429);
  mapper.addCoordinate(2, 3, 543, 391);
  mapper.addCoordinate(2, 4, 543, 353);
  mapper.addCoordinate(2, 5, 543, 315);
  mapper.addCoordinate(3, 1, 501, 467);
  mapper.addCoordinate(3, 2, 501, 429);
  mapper.addCoordinate(3, 3, 501, 391);
  mapper.addCoordinate(3, 4, 501, 353);
  mapper.addCoordinate(3, 5, 501, 315);
  mapper.addCoordinate(4, 1, 459, 467);
  mapper.addCoordinate(4, 2, 459, 429);
  mapper.addCoordinate(4, 3, 459, 391);
  mapper.addCoordinate(4, 4, 459, 353);
  mapper.addCoordinate(4, 5, 459, 315);
  mapper.addCoordinate(5, 1, 417, 467);
  mapper.addCoordinate(5, 2, 417, 429);
  mapper.addCoordinate(5, 3, 417, 391);
  mapper.addCoordinate(5, 4, 417, 353);
  mapper.addCoordinate(5, 5, 417, 315);
  mapper.addCoordinate(6, 1, 375, 467);
  mapper.addCoordinate(6, 2, 375, 429);
  mapper.addCoordinate(6, 3, 375, 391);
  mapper.addCoordinate(6, 4, 375, 353);
  mapper.addCoordinate(6, 5, 375, 315);
  mapper.addCoordinate(7, 1, 302, 467);
  mapper.addCoordinate(7, 2, 302, 429);
  mapper.addCoordinate(7, 3, 302, 391);
  mapper.addCoordinate(7, 4, 302, 353);
  mapper.addCoordinate(7, 5, 302, 315);
  mapper.addCoordinate(8, 1, 260, 467);
  mapper.addCoordinate(8, 2, 260, 429);
  mapper.addCoordinate(8, 3, 260, 391);
  mapper.addCoordinate(8, 4, 260, 353);
  mapper.addCoordinate(8, 5, 260, 315);
  mapper.addCoordinate(9, 1, 218, 467);
  mapper.addCoordinate(9, 2, 218, 429);
  mapper.addCoordinate(9, 3, 218, 391);
  mapper.addCoordinate(9, 4, 218, 353);
  mapper.addCoordinate(9, 5, 218, 315);
  mapper.addCoordinate(10, 1, 176, 467);
  mapper.addCoordinate(10, 2, 176, 429);
  mapper.addCoordinate(10, 3, 176, 391);
  mapper.addCoordinate(10, 4, 176, 353);
  mapper.addCoordinate(10, 5, 176, 315);
  mapper.addCoordinate(11, 1, 134, 467);
  mapper.addCoordinate(11, 2, 134, 429);
  mapper.addCoordinate(11, 3, 134, 391);
  mapper.addCoordinate(11, 4, 134, 353);
  mapper.addCoordinate(11, 5, 134, 315);
  mapper.addCoordinate(12, 1, 92, 467);
  mapper.addCoordinate(12, 2, 92, 429);
  mapper.addCoordinate(12, 3, 92, 391);
  mapper.addCoordinate(12, 4, 92, 353);
  mapper.addCoordinate(12, 5, 92, 315);
  mapper.addCoordinate(13, 1, 92, 38);
  mapper.addCoordinate(13, 2, 92, 76);
  mapper.addCoordinate(13, 3, 92, 114);
  mapper.addCoordinate(13, 4, 92, 152);
  mapper.addCoordinate(13, 5, 92, 190);
  mapper.addCoordinate(14, 1, 134, 38);
  mapper.addCoordinate(14, 2, 134, 76);
  mapper.addCoordinate(14, 3, 134, 114);
  mapper.addCoordinate(14, 4, 134, 152);
  mapper.addCoordinate(14, 5, 134, 190);
  mapper.addCoordinate(15, 1, 176, 38);
  mapper.addCoordinate(15, 2, 176, 76);
  mapper.addCoordinate(15, 3, 176, 114);
  mapper.addCoordinate(15, 4, 176, 152);
  mapper.addCoordinate(15, 5, 176, 190);
  mapper.addCoordinate(16, 1, 218, 38);
  mapper.addCoordinate(16, 2, 218, 76);
  mapper.addCoordinate(16, 3, 218, 114);
  mapper.addCoordinate(16, 4, 218, 152);
  mapper.addCoordinate(16, 5, 218, 190);
  mapper.addCoordinate(17, 1, 260, 38);
  mapper.addCoordinate(17, 2, 260, 76);
  mapper.addCoordinate(17, 3, 260, 114);
  mapper.addCoordinate(17, 4, 260, 152);
  mapper.addCoordinate(17, 5, 260, 190);
  mapper.addCoordinate(18, 1, 302, 38);
  mapper.addCoordinate(18, 2, 302, 76);
  mapper.addCoordinate(18, 3, 302, 114);
  mapper.addCoordinate(18, 4, 302, 152);
  mapper.addCoordinate(18, 5, 302, 190);
  mapper.addCoordinate(19, 1, 375, 38);
  mapper.addCoordinate(19, 2, 375, 76);
  mapper.addCoordinate(19, 3, 375, 114);
  mapper.addCoordinate(19, 4, 375, 152);
  mapper.addCoordinate(19, 5, 375, 190);
  mapper.addCoordinate(20, 1, 417, 38);
  mapper.addCoordinate(20, 2, 417, 76);
  mapper.addCoordinate(20, 3, 417, 114);
  mapper.addCoordinate(20, 4, 417, 152);
  mapper.addCoordinate(20, 5, 417, 190);
  mapper.addCoordinate(21, 1, 459, 38);
  mapper.addCoordinate(21, 2, 459, 76);
  mapper.addCoordinate(21, 3, 459, 114);
  mapper.addCoordinate(21, 4, 459, 152);
  mapper.addCoordinate(21, 5, 459, 190);
  mapper.addCoordinate(22, 1, 501, 38);
  mapper.addCoordinate(22, 2, 501, 76);
  mapper.addCoordinate(22, 3, 501, 114);
  mapper.addCoordinate(22, 4, 501, 152);
  mapper.addCoordinate(22, 5, 501, 190);
  mapper.addCoordinate(23, 1, 543, 38);
  mapper.addCoordinate(23, 2, 543, 76);
  mapper.addCoordinate(23, 3, 543, 114);
  mapper.addCoordinate(23, 4, 543, 152);
  mapper.addCoordinate(23, 5, 543, 190);
  mapper.addCoordinate(24, 1, 585, 38);
  mapper.addCoordinate(24, 2, 585, 76);
  mapper.addCoordinate(24, 3, 585, 114);
  mapper.addCoordinate(24, 4, 585, 152);
  mapper.addCoordinate(24, 5, 585, 190);
  mapper.addCoordinate(25, 1, 338, 231);
  mapper.addCoordinate(26, 1, 338, 269);
}

// Game Play

function isPieceMovable(piece, pt, pos) {
  // console.log('isPieceMovable called for pt = ', pt, ' pos = ', pos);
  const barPoint = game.myPlayer === 'r' ? 25 : 26;

  // if piece is on the bar and you're trying to move somewhere else
  if (board.contents[barPoint].occupied.length && pt != barPoint) {
    // bar point occupied
    console.log('Must move bar piece');
    showDisplayBox('Move your piece off the bar first');
    return false;
  }

  // if piece is not being moved from a valid position
  if (piece == 0 && pos == 0) {
    console.log('Not moving from a valid position');
    return false;
  }

  // if there are no dice moves left
  if (board.diceThrows.every((element) => element === 0)) {
    console.log('isPieceMovable: no dice moves remaining');
    return false;
  }

  // check is piece is my colour
  if (game.myPlayer != piece.dataset.type) {
    console.log('isPieceMovable: wrong colour');
    return false;
  }

  // don't move unless topmost piece - except for bar points
  if (
    pos < board.contents[pt].occupied.length &&
    pos < 5 &&
    pt != 25 &&
    pt != 26
  ) {
    console.log('isPieceMovable: not topmost piece');
    return false;
  }

  // console.log('isPieceMovable: true');
  return true;
}

function displayDiceThrows() {
  const container = document.getElementById('dice_throws');
  const parts = [];
  const end_turn = document.getElementById('end_turn');

  // is move finished? populate with empty string
  if (board.diceThrows.every(element => element === 0)) {
    container.innerHTML = '';

    // hide the end_turn button
    end_turn.style.visibility = 'hidden';

    return;
  }

  for (let i = 0; i < board.originalThrows.length; i++) {
    const original = board.originalThrows[i];
    const current = board.diceThrows[i];

    // Skip if original value is 0
    if (original === 0) continue;

    if (current === 0) {
      // Taken → strikethrough
      parts.push(`<span><s>${original}</s></span>`);
    } else {
      // Still available → normal
      parts.push(`<span>${original}</span>`);
    }
  }

  container.innerHTML = parts.join(' ');
  end_turn.style.visibility = 'visible';

  console.log('>>>>>>>>>>> At the end of displayDiceThrows, container.innerHTML = ' + container.innerHTML);
}



