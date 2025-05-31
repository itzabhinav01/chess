const socket = io();
const chess= new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRoles = null;

const renderBoard = ()=>{
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowindex + squareindex) % 2 === 0 ? "light" : "dark");

            squareElement.dataset.row= rowIndex;
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color=== 'w' ? 'white' : 'black');
                pieceElement.innerText = "";
                pieceElement.draggable= playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e)=>{
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row: rowIndex, col: squareindex}; 
                        e.dataTransfer.setData("text/plain", "");
                    }
            });
            pieceElement.addEventListener("dragend", ()=>{
                draggedPiece = null;
                sourceSquare = null;
            });

            squareElement.appendChiled(pieceElement);

        }
        squareElement.addEventListener("dragover", (e)=>{
            e.preventDefault();
        });
    });
});
}
 

const handleMove = ()=>{

}

const getPieceUnicode = ()=>{

}


//  socket.emit("churan");
//  socket.on("churan paapdi",()=>{//front end pe churan papdi recieved
//         console.log("churan paapdi event received from server");
//     })
