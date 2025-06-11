const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

console.log("App.js started!");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {}; // { white: socketId, black: socketId }
let currentPlayer = "w";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Serve main page
app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

// Handle socket connections
io.on("connection", (uniquesocket) => {
  console.log("New user connected:", uniquesocket.id);

  // Assign player roles
  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole", "You are spectating the game");
  }

  // Restart game handler
  uniquesocket.on("restartGame", () => {
    if (uniquesocket.id === players.white || uniquesocket.id === players.black) {
      chess.reset();
      io.emit("boardState", chess.fen());
    }
  });

  // Handle disconnection
  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
    console.log("User disconnected:", uniquesocket.id);
  });

  // Handle move event
  uniquesocket.on("move", (move) => {
    try {
      const turn = chess.turn(); // 'w' or 'b'
      const isWhite = uniquesocket.id === players.white;
      const isBlack = uniquesocket.id === players.black;

      if ((turn === 'w' && !isWhite) || (turn === 'b' && !isBlack)) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move); // Broadcast the move
        io.emit("boardState", chess.fen()); // Broadcast the FEN state

        // Check game over conditions
        if (chess.in_checkmate()) {
          io.emit("gameOver", { result: "checkmate", winner: uniquesocket.id });
        } else if (chess.in_draw()) {
          io.emit("gameOver", { result: "draw" });
        } else if (chess.in_stalemate()) {
          io.emit("gameOver", { result: "stalemate" });
        } else if (chess.in_threefold_repetition()) {
          io.emit("gameOver", { result: "threefold repetition" });
        } else if (chess.insufficient_material()) {
          io.emit("gameOver", { result: "insufficient material" });
        }

      } else {
        console.log("Invalid move attempted by:", uniquesocket.id, move);
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.error("Error processing move:", err);
      uniquesocket.emit("error", "An error occurred while processing your move.");
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
