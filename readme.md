# Backgammon game

To load:
In vscode, right click on index.html and 'Open with Live Server'

# Board

Point 0 = no man's land
Points = 1 to 24
(Top) Bar for red pieces = 25
(Bottom) Bar to hold white pieces = 26

# Example rpc Message

sendRPC('move', {
pieceId: move.piece.id,
player: game.currentTurn,
from: move.from,
to: move.to,
});
