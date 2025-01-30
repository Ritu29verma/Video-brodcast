const socketIo = require('socket.io');
const dotenv = require("dotenv");
let coinList = []; 
let finalCoinList = [];
let multiplier = 1.0; 
let multiplierInterval = null;
let io; 
let activeBets = {}; 
let adminLoggedOut = true;
let videoState = {
  url: null,
  isPlaying: false,
  currentTime: 0, 
  isMuted: false,
};



module.exports = (server) => {
   io = socketIo(server, {
    cors: {
      origin: process.env.SOCKET_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
  socket.on("setvalue", (value) => {
    if (value && !isNaN(value)) {
      coinReach = Number(value); 
      console.log("CoinReach manually set to:", coinReach);
      if (coinReach === multiplier) {
        coinList.push(coinReach); 
        console.log("CoinReach matches multiplier:", multiplier);
        io.emit("play_3rd_video");
        io.emit("update_coinList", coinList);
      }
    }
  });

  socket.on("flyaway", () => {
    console.log("Fly Away clicked");

    if (multiplierInterval) {
      clearInterval(multiplierInterval);
      multiplierInterval = null;
    }
    coinList.push(multiplier); 
    console.log("CoinReach added by Fly Away:", multiplier);
    io.emit("update_coinList", coinList); 
    io.emit("play_3rd_video"); 
  });

  socket.on("start_multiplier", () => {
    if (multiplierInterval) {
      clearInterval(multiplierInterval);
    }

    multiplier = 1.0;

    multiplierInterval = setInterval(() => {
      multiplier = parseFloat((multiplier + 0.1).toFixed(1));
      io.emit("update_multiplier", multiplier); 
        if (coinReach !== null && coinReach === multiplier) {
          coinList.push(coinReach); 
          console.log("Multiplier reached CoinReach value:", multiplier);
          io.emit("play_3rd_video"); 
          io.emit("update_coinList", coinList);
          coinReach = null; 
        }
    }, 150);
  });


  socket.on("reset_game", () => {
    if (multiplierInterval) {
      clearInterval(multiplierInterval);
      multiplierInterval = null;
    }

    multiplier = 1.0; 
    finalCoinList = [...finalCoinList, ...coinList];
    console.log("Final coinList:", finalCoinList);
    coinList = []; 
    coinReach = null; 
    console.log("Game reset for 1st video.");
    io.emit("update_coinList", coinList); 
    io.emit("update_multiplier", multiplier); 
  });


  socket.on('video_change', (state) => {
    videoState = { ...state, currentTime: 0 };
    console.log('Admin changed video:', videoState.url);
    if ((state.url)===`${process.env.BASE_URL}/videos/video3.mp4`){
      activeBets = {}; 
    }
    io.emit('video_change', videoState);
  });

  socket.on('stop_video_loop', () => {
    console.log('Stop video loop event received from admin');
    io.emit('stop_video_loop');
  });


  socket.emit('start_stream', videoState);

   // Admin updates the video state
  socket.on('admin_control', (state) => {
      currentVideoState = state; // Update the state globally
      // console.log('Admin updated video state:', state);
      socket.broadcast.emit('admin_control', state);
  });

  socket.on('admin_video_state', (videoState) => {
        console.log('Admin sent video state:', videoState);
        socket.emit('video_state_update', videoState);
  });

    socket.on('fetch_current_state', (callback) => {
    const state = videoState;
    console.log(`Providing 'current admin' state.`);
    socket.emit('fetch_current_state', state);
    });
    

  socket.on("placeBet", ({ clientCode, betAmount }) => {
    if (!clientCode || !betAmount) return;
    const now = new Date().toISOString(); // Get current timestamp
    const bet = { code: clientCode, amount: betAmount, timestamp: now };
    if (!activeBets[clientCode]) {
      activeBets[clientCode] = [];
    }

    if (activeBets[clientCode].length < 2) {
      activeBets[clientCode].push(bet);
      console.log(`Bet placed by ${clientCode}: $${betAmount} at ${now}`);
    }

  });

  socket.on("cancelBet", ({ clientCode, betAmount }) => {
    if (!clientCode || !betAmount) return;
  
    if (activeBets[clientCode]) {
      // Find the bet and remove it
      activeBets[clientCode] = activeBets[clientCode].filter(
        (bet) => bet.amount !== betAmount);

      console.log(`Bet cancelled for ${clientCode}: $${betAmount}`);

    }
  });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  return io;
};

module.exports.getIo = () => io;