const socketIo = require('socket.io');
const dotenv = require("dotenv");
// const { v4: uuidv4 } = require('uuid');
const Game = require('./models/Game');
let tempGameData = null;
let stats = {
  totalProfit: 0,
  activeBetsTotal: 0,
};

let coinReach = null;
let multiplier = 1.0;
let multiplierInterval = null;
let io;
let activeBets = {};
let videoState = {
  url: null,
  isPlaying: false,
  currentTime: 0, 
  isMuted: false,
};

const generateNumericGameId = () => {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit unique ID
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
    }
  });

  socket.on("flyaway", () => {
    console.log("Fly Away clicked");
    coinReach = multiplier;
    if (multiplierInterval) {
      clearInterval(multiplierInterval);
      multiplierInterval = null;
    }
    console.log("CoinReach set by Fly Away:", coinReach);
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
          console.log("Multiplier reached CoinReach value:", coinReach);
          io.emit("play_3rd_video"); 
        }
    }, 150);
  });


  socket.on("reset_game", () => {
    if (multiplierInterval) {
      clearInterval(multiplierInterval);
      multiplierInterval = null;
    }
    multiplier = 1.0; 
    coinReach = null; 
    console.log("Game reset for 1st video.");
    io.emit("update_multiplier", multiplier); 
  });


  socket.on('video_change', async (state) => {
    videoState = { ...state, currentTime: 0 };
    console.log('Admin changed video:', videoState.url);
    if (state.url === `${process.env.BASE_URL}/videos/Begin.mp4`){
      tempGameData = {
      gameId: generateNumericGameId(),
      coinReach: null ,
      totalInGame: 0,
      cashout: 0,
      profitLoss: 0
       };
    }
    if (state.url === `${process.env.BASE_URL}/videos/video3.mp4`) {
      if (tempGameData) {
        tempGameData.coinReach = coinReach;
        try {
          await Game.create(tempGameData);
          io.emit('gameData', tempGameData);
          console.log(`Game recorded: ${JSON.stringify(tempGameData)}`);
        } catch (error) {
          console.error("Error saving game data:", error);
        }
      }
      tempGameData = null;
      activeBets = {};
      coinReach = null;
      if (multiplierInterval) {
        clearInterval(multiplierInterval);
        multiplierInterval = null;
      }
    }
    io.emit('video_change', videoState);
  });

  socket.on('stop_video_loop', () => {
    console.log('Stop video loop event received from admin');
    io.emit('stop_video_loop');
  });


  socket.emit('start_stream', videoState);

  socket.on('admin_control', (state) => {
      currentVideoState = state;
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
    

  socket.on("placeBet", async ({ clientCode, betAmount }) => {
    if (!clientCode || !betAmount) return;
    try {
      const response = await fetch(`${process.env.BASE_URL}/api/client/deductBetAmount`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCode, betAmount }),
      });
      const data = await response.json();
      if (response.status === 200) {
        if (!tempGameData) return;
        if (!tempGameData.totalInGame) tempGameData.totalInGame = 0;
        tempGameData.totalInGame += betAmount;
        const bet = { code: clientCode, amount: betAmount, cashout:0};
        if (!activeBets[clientCode]) {
          activeBets[clientCode] = [];
        }
        if (activeBets[clientCode].length < 2) {
          activeBets[clientCode].push(bet);
          stats.activeBetsTotal += betAmount;
          socket.emit("walletUpdated", {WalletBalance: data.newWalletBalance});
        }}    
    } catch (error) {
      console.error("Error placing bet:", error);}
  });

  socket.on("cancelBet", async ({ clientCode, betAmount }) => {
    if (!clientCode || !betAmount) return;
  
    try {
      const response = await fetch(`${process.env.BASE_URL}/api/client/addBetAmount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCode, betAmount }),
      });
  
      const data = await response.json();
      
      if (response.status !== 200) {
        console.error("Error processing bet refund:", data.error);
        return;
      }
      if (!tempGameData) return;
      tempGameData.totalInGame -= betAmount;
      socket.emit("walletUpdated", {WalletBalance: data.newWalletBalance});
    } catch (error) {
      console.error("Error refunding bet:", error);
      return;
    }
    if (activeBets[clientCode]) {
      // Remove the bet from active bets
      activeBets[clientCode] = activeBets[clientCode].filter(
        (bet) => bet.amount !== betAmount
      );
      console.log(`Bet cancelled for ${clientCode}: $${betAmount}`);
    }
  });


  socket.on("cashout", async ({ clientCode, userBet, cashoutAmount }) => {
    if (!clientCode || !userBet || !cashoutAmount) return; 
    try {
      const response = await fetch(`${process.env.BASE_URL}/api/client/cashoutWallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCode, cashoutAmount }),
      });

      const data = await response.json();
      if (response.status === 200) {
        if (!tempGameData) return; // Ensure a game is active

        tempGameData.cashout += cashoutAmount; // Update cashout amount
        tempGameData.profitLoss = tempGameData.totalInGame - tempGameData.cashout; 
        if (activeBets[clientCode]) {
          activeBets[clientCode] = activeBets[clientCode].filter(
            (bet) => bet.amount !== userBet
          );
        }
        stats.totalProfit -= cashoutAmount;
        stats.activeBetsTotal -= userBet;
  
        console.log(`Cashout: ${clientCode} won $${cashoutAmount} ${data.newWalletBalance}`);
        socket.emit("walletUpdated", {WalletBalance: data.newWalletBalance});
      } 
    } catch (error) {
      console.error("Error processing cashout:", error);
    }
  });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  return io;
};

module.exports.getIo = () => io;