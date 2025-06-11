const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const roleDisplay = document.getElementById("roleDisplay");
const restartBtn = document.getElementById("restartBtn");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let gameIsOver = false;

// Render the board based on current chess state
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);

        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece && !gameIsOver) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

// Convert internal row/col into chess notation & emit move
const handleMove = (source, target) => {
  if (gameIsOver) return;

  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // Always promote to queen
  };

  socket.emit("move", move);
  chess.move(move); // Locally update to reduce flicker
};

// Convert piece to Unicode symbol
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    wp: "♙",
    wr: "♖",
    wn: "♘",
    wb: "♗",
    wq: "♕",
    wk: "♔",
    bp: "♟",
    br: "♜",
    bn: "♞",
    bb: "♝",
    bq: "♛",
    bk: "♚",
  };

  const key = piece.color + piece.type;
  return unicodePieces[key] || "";
};

// Role assignment
socket.on("playerRole", function (color) {
  playerRole = color;
  gameIsOver = false;
  roleDisplay.innerText = color === "w" ? "You are White" : "You are Black";
  restartBtn.classList.add("hidden");
  renderBoard();
});

// Spectator mode
socket.on("spectatorRole", function () {
  playerRole = null;
  roleDisplay.innerText = "You are a Spectator";
  renderBoard();
});

// Board sync from server
socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

// Handle move broadcast
socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
});

// Game over handler
socket.on("gameOver", function (data) {
  gameIsOver = true;
  let message = "";

  switch (data.result) {
    case "checkmate":
      message =
        playerRole && socket.id === data.winner
          ? "You won by checkmate!"
          : "You lost. Checkmate.";
      break;
    case "draw":
      message = "Game ended in a draw.";
      break;
    case "stalemate":
      message = "Stalemate! It's a draw.";
      break;
    case "threefold repetition":
      message = "Draw by threefold repetition.";
      break;
    case "insufficient material":
      message = "Draw due to insufficient material.";
      break;
  }

  setTimeout(() => {
    alert(message);
  }, 100);

  restartBtn.classList.remove("hidden");
});

// Restart button click
restartBtn.addEventListener("click", () => {
  socket.emit("restartGame");
  gameIsOver = false;
  restartBtn.classList.add("hidden");
});

// Initial render
renderBoard();
