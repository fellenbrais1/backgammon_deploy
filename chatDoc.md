# chat.js

The sequence to establish chat is described. The displayName must be non-blank before this sequence can begin.

Step 1. On loading or refreshing the web page, the DOMContentLoaded event fires and performs the following:

1.1 Calls the JSPeer server to return a unique id. This is stored in a global 'peer' object.

1.2 Sets up various event handlers for peer-to-peer events, e.g. 'open', 'connection', 'data'.

Step 2. To register the local user, call registerForChat(player) where player represents a user object.

Calling registerForChat stores the user object in Firebase. Note that registerForChat can be called as many times as you like for a user. Each time, it updates the same record (as defined by the key) with the values sent to it.

Currently, a user object is follows:

username: "Mike",
languages: [ "English", "Spanish" ]
peerId: "5f2cda25-b25f-4ee1-b64b-7f8f8f089e24"
skillLevel: "beginner"

N.B. BOTH PLAYERS WILL NEED TO BE REGISTERED BEFORE COMMUNICATION CAN OCCUR

Step 3. In order to populate the players board, you will need to get a list of all registered players

Call the fetchPlayers() function. This is an array of user objects.

Step 4. Connect to the remote player
Call connectToPlayer(remoteName) where remoteName is the username of the other player.

This function populates the global conn variable, i.e.
`conn = await connectToPlayer(remoteName);`

Once a connection has been established then various types of message can be sent to the remote player:

Send a chat Message
`sendRPC('chat', { message });`

Send a challenge:
`sendRPC('challenge', user);`
where user is the user object of the challenger. See demoChallenge() for an example

Send a challenge response:
`sendRPC('challengeResponse', 'accept'); // or 'reject'`

Send dice roll

`let sampleRoll = [2, 0, 0, 0];
sendRPC('diceRoll', sampleRoll);`

Send piece move
`let sampleMove = {
player: 'r',
from: 24,
to: 22,
};

sendRPC('pieceMove', sampleMove);`
