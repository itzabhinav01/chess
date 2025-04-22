const socket = io();
 socket.emit("churan");
 socket.on("churan paapdi",()=>{//front end pe churan papdi recieved
        console.log("churan paapdi event received from server");
    })