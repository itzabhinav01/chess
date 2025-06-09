// const { render } = require("ejs");

const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null; // 🟢 Consistent name

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
        // console.log(square);
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
        pieceElement.innerText = getPieceUnicode(square); // 🟢 Fixed typo

        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement); // 🟢 Fixed typo
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
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
  if(playerRole === "b"){
    boardElement.classList.add("flipped");
  }
  else{
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
    const move = {
        from:`${String.fromCharCode(97+source.col)}${8-source.row}`, // Convert to chess notation,
        to:`${String.fromCharCode(97+target.col)}${8-target.row}` ,
        promotion: "q" // Always promote to queen for simplicity
    }
    socket.emit("move", move); // Emit the move to the server
    chess.move(move); // Update local chess state

};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    "wp": "♙", // white pawn
    "wr": "♖",
    "wn": "♘",
    "wb": "♗",
    "wq": "♕",
    "wk": "♔",
    "bp": "♟",
    "br": "♜",
    "bn": "♞",
    "bb": "♝",
    "bq": "♛",
    "bk": "♚",
  };

  const key = piece.color + piece.type;
  return unicodePieces[key] || "";
};

socket.on("playerRole", function(color){
    console.log("Received player color:", color); // Confirm!
    playerRole = color;
    renderBoard();
});



socket.on("spectatorRole", function(){
    playerRole = null; // Spectators cannot move pieces
    renderBoard();
});

socket.on("boardState", function(fen){
    chess.load(fen);
    renderBoard();
})

socket.on("move", function(move){
    chess.move(move);
    renderBoard();
})

renderBoard();

// Example socket event (uncomment if needed)
// socket.emit("churan");
// socket.on("churan paapdi", () => {
//   console.log("churan paapdi event received from server");
// });
