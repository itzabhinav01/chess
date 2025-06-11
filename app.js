const express = require('express');
const socket = require('socket.io');
const http= require('http');
const {Chess} = require('chess.js');
const path = require('path');
const { title } = require('process');
// const { console } = require('inspector');


console.log("App.js started!");

const app = express();

const server=http.createServer(app);
const io= socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "W";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res)=>{
    res.render("index", {title: "Chess Game"});
});

io.on("connection", (uniquesocket)=>{
    console.log("New user connected: " + uniquesocket.id);
    // uniquesocket.on("churan",()=>{
    //     console.log("churan event received from client");
    //     io.emit("churan paapdi");// ye sbko kuch na kuch bhej dega frntend ko I mean bcz its backend
    // })
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole", "w");// ye sirf us specific bande ko btayega
        //check
    }
    else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    else{
        uniquesocket.emit("spectator", "You are spectating the game");
        // return;
    }
    uniquesocket.on("disconnect", ()=>{
        if(uniquesocket.id == players.white){
            delete players.white;
        } 
        else if(uniquesocket.id == players.black){
            delete players.black;
        }

    
});
    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn() =='w' && uniquesocket.id!== players.white)return;// galt bnde ke move chane pe return
            if(chess.turn() =='b' && uniquesocket.id!== players.black)return;

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();   
                io.emit("move",move);// ye sbko bhej dega
                io.emit("boardState", chess.fen());// ye sbko current board state bhej dega 


            }
            else{
                console.log("Invalid move attempted by player: " , move);
                uniquesocket.emit("invalidMove", move);// ye sirf us specific bande ko btayega ki move invalid hai

            }
        }
        catch(err){
            console.error("Error processing move: ", err);
            uniquesocket.emit("error", "An error occurred while processing your move.");
        }
    })

});


server.listen(3000,()=>{
    // alert("Server is running on port 3000");
    console.log("Server is running on port 3000");
});










