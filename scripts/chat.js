/////////////////////////////////////////////////////////////////////////////////////////
// CODE START

// NOTES
// Inter-player communication logic

"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS

import { DEBUGMODE } from "./config.js";
import { dispatchMessage } from "./dispatch.js";
import { getFirebaseVariables } from "./firebaseConfig.js";
import { changeModalContent } from "./modals.js";
import { populatePlayers } from "./welcome.js";

/////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES

let firebaseApp;
let analytics;
let database;

// Player connection objects
export let peer;

let conn;

// Used to make the looping delay work in sendRPC()
let connOpen = false;
let attemptNo = 1;

// Flag to display the 'noPlayersOnline' modal only the first time
let firstPlayerRefreshFlag = true;

// Flag to disable a challenge process that has been cancelled by the challenger
let shutdownFlag = false;

/////////////////////////////////////////////////////////////////////////////////////////
// EVENT LISTENERS

// Sets up the Peer object on DOM content load
document.addEventListener("DOMContentLoaded", () => {
  peer = new Peer({
    host: "0.peerjs.com",
    port: 443,
    secure: true,
    key: "peerjs",
  });

  // When a Peer object is created
  peer.on("open", (id) => {
    console.log("Peer: Unique Peer ID is:", id);
    return;
  });

  // When a Peer connection opens on the remote peer's side
  peer.on("connection", (connection) => {
    console.log("Peer: Incoming connection from:", connection.peer);
    conn = connection;

    // When a connection to another player is made
    conn.on("open", () => {
      console.log("Conn: Connection opened with:", connection.peer);
      connOpen = true;
      return;
    });

    // When a message is received from another player
    conn.on("data", (data) => {
      console.log("Conn: Received data from opponent:", data);

      const parsedData = JSON.parse(data);

      if (DEBUGMODE) {
        console.log(
          "Conn: Data received from opponent, method:",
          parsedData.method + ", params:",
          JSON.stringify(parsedData.params)
        );
      }

      // Processes the data in a relevant way
      dispatchMessage(parsedData);
      return;
    });

    conn.on("error", (err) => {
      console.error("Conn: Connection error:", err);
      return;
    });
  });

  peer.on("disconnected", () => {
    console.log("Peer: Peer disconnected");
    return;
  });

  peer.on("reconnect", () => {
    console.log("Peer: Reconnected to PeerJS server");
    peer.on("open", (id) => {
      console.log("Peer: New Peer ID after reconnection: id:", id);
      return;
    });
    return;
  });

  return;
});

/////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS

// **NEW:** Function to initialize Firebase variables in this module
async function initializeFirebaseInDispatch() {
  const firebaseVariables = await getFirebaseVariables(); // Await the variables

  if (firebaseVariables) {
    database = firebaseVariables.DATABASE; // Assign database once it's ready
    analytics = firebaseVariables.ANALYTICS;
    firebaseApp = firebaseVariables.FIREBASEAPP;
    if (DEBUGMODE) {
      console.log("dispatch.js: Firebase database initialized:", database);
    }
  } else {
    console.error(
      "dispatch.js: Failed to get Firebase variables. Database will not be available."
    );
    // You might want to handle this error more robustly, e.g., disable features.
  }
}

// Returns a new conn object when creating a new connection with an opponent
export async function assignConn(opponent) {
  conn = await connectToPlayer(opponent);
  return conn;
}

// Changes the inGame property of a player in the database using their key and a supplied boolean
export async function changeInGameStatus(key, isInGame) {
  const playersRef = database.ref("players");

  const existingPlayerRef = playersRef.child(key);
  const existingSnapshot = await existingPlayerRef.once("value");

  // Early return if no record matches the key supplied
  if (!existingSnapshot.exists()) {
    console.error(
      "changeInGameStatus(): Error: Player record for:",
      key,
      "- does not exist"
    );
    return null;
  }

  await existingPlayerRef.update({
    inGame: isInGame,
  });

  if (DEBUGMODE) {
    console.log(
      "changeInGameStatus(): playerRef:",
      JSON.stringify(existingPlayerRef)
    );
    console.log(
      "changeInGameStatus(): Player status set to inGame:",
      existingPlayerRef.inGame
    );
  }

  return;
}

// Checks to see if a name a player has entered already exists on the database, unless the player is going back to change their details, in which case the original name can be kept
export async function checkForName(playerName, allowedName = "") {
  const playersRef = database.ref("players");

  try {
    // Queries the database to check if the displayName is already taken
    const querySnapshot = await playersRef
      .orderByChild("displayName")
      .equalTo(playerName)
      .once("value");
    const nameExists = querySnapshot.exists();

    if (nameExists) {
      // 0 = failure, 1 = success
      if (playerName === allowedName) {
        return 1;
      } else {
        console.error(
          "checkForName(): Error: display name:",
          playerName,
          "- already exists"
        );
        return 0;
      }
    } else {
      return 1;
    }
  } catch (error) {
    console.error("checkForName(): Error handling player record:", error);
    return null;
  }
}

// Used to close a connection in the case where a challenge has been cancelled, rejected, or there is another currently in progress
export function closeConn() {
  connOpen = false;

  if (DEBUGMODE) {
    console.log("closeConn(): Connection closed, connOpen", connOpen);
  }

  return;
}

// Returns a created conn object when connecting to another player
export async function connectToPlayer(opponent) {
  if (DEBUGMODE) {
    console.log("connectToPlayer(): opponent:", JSON.stringify(opponent));
    console.log(
      "connectToPlayer(): Attempting to connect to:",
      opponent.displayName,
      "- at:",
      opponent.userKey
    );
  }

  // Defines the opponent's user key to use to search the database
  const playerRef = database.ref(`players/${opponent.userKey}`);

  if (DEBUGMODE) {
    console.log(
      "connectToPlayer(): opponent.userKey:",
      opponent.userKey,
      "- type:",
      typeof opponent.userKey
    );
    console.log(
      "connectToPlayer(): playerRef:",
      playerRef,
      "- type:",
      typeof playerRef
    );
  }

  try {
    // Find the associated record for the opponent in the database
    const snapshot = await playerRef.get();

    if (!snapshot.exists()) {
      console.log(
        "connectToPlayer(): Error: No player found with the key:",
        opponent.userKey
      );
      return null;
    }

    const remotePeerId = snapshot.val().peerID;

    if (DEBUGMODE) {
      console.log("connectToPlayer(): remotePeerId:", remotePeerId);
    }

    // Creates a new conn object for this specific connection
    conn = await peer.connect(remotePeerId);

    if (DEBUGMODE) {
      console.log("connectToPlayer(): conn:", conn);
    }

    // When a connection to another player is made
    conn.on("open", () => {
      console.log("Conn: Connected to peer:", remotePeerId);
      connOpen = true;
    });

    // When a message is received from another player
    conn.on("data", (data) => {
      console.log("Conn: Received data from opponent:", data);

      const parsedData = JSON.parse(data);

      if (DEBUGMODE) {
        console.log(
          "Conn: Data received from opponent, method:",
          parsedData.method + " - params:",
          JSON.stringify(parsedData.params)
        );
      }

      // Processes the data in a relevant way
      dispatchMessage(parsedData);
    });

    conn.on("error", (err) => {
      console.error("Conn: Connection error:", err);
    });

    return conn;
  } catch (err) {
    console.error("connectToPlayer(): Error fetching player data:", err);
    return null;
  }
}

// Returns the opponent's player object if one exists and can be found
export async function defineOpponent(opponentName) {
  const playersRef = database.ref("players");

  if (DEBUGMODE) {
    console.log("defineOpponent(): playersRef:", playersRef);
  }

  try {
    // Query Firebase to check if displayName already exists
    const querySnapshot = await playersRef
      .orderByChild("displayName")
      .equalTo(opponentName)
      .once("value");

    if (DEBUGMODE) {
      console.log("defineOpponent(): querySnapshot:", querySnapshot);
    }

    if (querySnapshot.exists()) {
      const opponentData = querySnapshot.val();
      const opponentKey = Object.keys(opponentData)[0];
      const opponent = opponentData[opponentKey];

      if (DEBUGMODE) {
        console.log(
          "defineOpponent(): Opponent found:",
          JSON.stringify(opponent)
        );
      }

      return opponent;
    } else {
      console.log(`defineOpponent(): Error: Opponent record not found.`);
      return null;
    }
  } catch (error) {
    if (DEBUGMODE) {
      console.log(
        "defineOpponent(): Error: Problem getting opponent record:",
        error
      );
    }

    return null;
  }
}

// Filters players in the playersArray returned by fetchPlayers() to only those online in the last hour
export async function fetchRecentPlayers(languageFilter = "none") {
  const playersRef = database.ref("players");
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  try {
    const snapshot = await playersRef
      .orderByChild("lastOnline")
      .startAt(oneHourAgo)
      .once("value");
    const playersObject = snapshot.val();

    const numberOfPlayers = Object.keys(playersObject).length;

    if (DEBUGMODE) {
      console.log(
        "fetchRecentPlayers(): Number of online players:",
        numberOfPlayers
      );
    }

    if (numberOfPlayers < 2) {
      console.log("fetchRecentPlayers(): No players online in the last hour");

      if (firstPlayerRefreshFlag === true) {
        // Displays the 'noPlayersOnline' modal
        changeModalContent("noPlayersOnline");
        firstPlayerRefreshFlag = false;
      }

      return [];
    }

    // Converts the filtered object to an array with keys
    const playersArray = Object.keys(playersObject).map((key) => ({
      id: key,
      ...playersObject[key],
    }));

    // Enables population of available players on page
    setTimeout(() => {
      if (languageFilter === "none") {
        populatePlayers(playersArray);
      } else {
        populatePlayers(playersArray, languageFilter);
      }
    }, 1000);

    return playersArray;
  } catch (error) {
    console.error(
      "fetchRecentPlayers(): Error retrieving recent players:",
      error
    );
    return [];
  }
}

// Retrieves and returns a current version of the opponent's player object
export async function getOpponentUserKey(opponent) {
  const playersRef = database.ref("players");

  if (DEBUGMODE) {
    console.log("getOpponentUserKey(): opponent playersRef:", playersRef);
  }

  try {
    // Query Firebase to check if displayName already exists
    const querySnapshot = await playersRef
      .orderByChild("displayName")
      .equalTo(opponent.displayName)
      .once("value");

    if (DEBUGMODE) {
      console.log("getOpponentUserKey(): querySnapshot:", querySnapshot);
    }

    if (querySnapshot.exists()) {
      querySnapshot.forEach((childSnapshot) => {
        // Access the key using childSnapshot.key
        opponent.userKey = childSnapshot.key;
      });
    } else {
      console.log(`getOpponentUserKey(): Error: Opponent not found`);
      opponent.userKey = null;
      return null;
    }

    if (DEBUGMODE) {
      console.log("getOpponentUserKey(): opponent:", opponent);
    }

    return opponent;
  } catch (error) {
    console.log(
      "getOpponentUserKey(): Error: Problem getting opponent record:",
      error
    );
    return null;
  }
}

// Registers a new player in the database to enable messages to be sent and received and returns their database key
export async function registerForChat(key, player, allowedName = "") {
  const playersRef = database.ref("players");

  try {
    // Queries the database to check if the displayName is already taken
    const querySnapshot = await playersRef
      .orderByChild("displayName")
      .equalTo(player.displayName)
      .once("value");
    const nameExists = querySnapshot.exists();

    // If a record with the supplied key does not already exist
    if (key === null) {
      if (DEBUGMODE) {
        console.log("registerForChat(): allowedName:", allowedName);
      }

      // In the case that user's go back to change their details an already taken name is allowed
      if (player.displayName === allowedName) {
        if (DEBUGMODE) {
          console.log(
            `registerForChat(): Skipping process as name is the same one as currently saved to player record`
          );
        }
      } else {
        if (nameExists) {
          if (DEBUGMODE) {
            console.error(
              "registerForChat(): Error: display name already exists"
            );
          }

          // Displays 'nameExists' modal
          changeModalContent("nameExists", player.displayName);
          return null;
        }
      }

      // Creates a new player record in the database
      const newPlayerRef = playersRef.push();
      await newPlayerRef.set({
        displayName: player.displayName,
        inGame: false,
        languages: player.languages,
        lastOnline: Date.now(),
        peerID: player.peerID,
        skillLevel: player.skillLevel,
      });

      if (DEBUGMODE) {
        console.log(
          "registerForChat(): Player registered for chat successfully"
        );
      }

      return newPlayerRef.key;
    } else {
      // If a record with the supplied key already exists
      const existingPlayerRef = playersRef.child(key);
      const existingSnapshot = await existingPlayerRef.once("value");

      // Additional check to cover errors etc.
      if (!existingSnapshot.exists()) {
        console.error("registerForChat(): Error: Player record does not exist");
        return null;
      }

      const existingPlayer = existingSnapshot.val();

      // If updating details, ensures the new displayName does not conflict with another already existing one
      if (player.displayName !== existingPlayer.displayName && nameExists) {
        console.error(
          "registerForChat(): Error: New display name already exists"
        );
        return null;
      }

      // Updates the existing player record
      await existingPlayerRef.update({
        displayName: player.displayName,
        inGame: false,
        languages: player.languages,
        lastOnline: Date.now(),
        peerID: player.peerID,
        skillLevel: player.skillLevel,
      });

      if (DEBUGMODE) {
        console.log(
          "registerForChat(): Player database record updated successfully"
        );
      }

      return key;
    }
  } catch (error) {
    console.error("registerForChat(): Error handling player record:", error);
    return null;
  }
}

// Changes a flag to shut down a process in progress that has been cancelled e.g. a challenge
export function shutDownRPC() {
  shutdownFlag = true;
  console.log(`shutdownFlag = ${shutdownFlag}`);
}

// Added a looping delay that will retry sending a message until the connOpen variable is true, this is controlled by the conn.on(open) event
export async function sendRPC(method, params) {
  shutdownFlag = false;

  if (connOpen === true) {
    // Message sent successfully
    attemptNo = 1;
    const rpcMessage = {
      method: method,
      params: params,
    };

    console.log("sendRPC(): Sending message:", JSON.stringify(rpcMessage));

    setTimeout(() => {
      conn.send(JSON.stringify(rpcMessage));
    }, 100);
    return;
  } else {
    // Retry message sending
    if (attemptNo < 11) {
      if (DEBUGMODE) {
        console.log("sendRPC(): shutdownFlag:", shutdownFlag);
      }

      if (shutdownFlag === true) {
        // Shut down signal has been received from shutDownRPC()
        console.log(`sendRPC(): Shutting down RPC message process.`);
        closeConn();
        shutdownFlag = false;
        return;
      }
      setTimeout(() => {
        console.log(
          "sendRPC(): Waiting for open connection (5 seconds) Attempt:",
          attemptNo
        );
        attemptNo++;
        sendRPC(method, params);
      }, 5000);
    } else {
      // Too many failed attempts
      attemptNo = 1;
      console.log(
        `sendRPC(): Error: Connection cannot be made with the other player.`
      );
      alert(
        `sendRPC(): Error: Connection cannot be made with the other player. Please refresh your session and try again.`
      );
      shutdownFlag = false;
      return;
    }
  }
}

/////////////////////////////////////////////////////////////////////////////////////////
// AUTORUNNING LOGIC

// const firebaseVariables = await getFirebaseVariables();

// if (firebaseVariables) {
//   firebaseApp = firebaseVariables.FIREBASEAPP;
//   analytics = firebaseVariables.ANALYTICS;
//   database = firebaseVariables.DATABASE;
// }

setTimeout(() => {
  initializeFirebaseInDispatch();
}, 1000);

// Debug mode checks
if (DEBUGMODE) {
  console.log(`chat.js running`);
  console.log("Using Firebase in chat.js:", firebaseApp);
  console.log("chat.js analytics:", analytics);
  console.log("chat.js database:", database);
}

// CODE END
/////////////////////////////////////////////////////////////////////////////////////////
