const socketIo = require('socket.io');
const { Op } = require("sequelize");
const dotenv = require("dotenv");
const Game = require('./models/Game');
const UserGameResults = require('./models/UserGameResult')
const GameRangeSettings = require('./models/GameRangeSettings')
const AdminWallet = require('./models/Adminwallet')
const Stats = require("./models/stats")
const Sequence = require('./models/Sequence');
const sequelize = require('./models/sequelize')





dotenv.config();
let tempGameData = null;
const userSockets = {};
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
let activeClientsCount=0;
let isGameRangesOn = false;

async function getOrCreateAdminWallet() {
  try {
      let adminWallet = await AdminWallet.findOne();

      if (!adminWallet) {
          // If no wallet exists, create one with a 0 balance
          adminWallet = await AdminWallet.create({ balance: 0.0, reservePercentage: 10 }); //default percentage will be 10
      }

      return adminWallet;
  } catch (error) {
      console.error("Error fetching admin wallet:", error);
      // Create a new entry if an error occurs
      return await AdminWallet.create({ balance: 0.0, reservePercentage: 10 });
  }
}
let adminWallet;

const updateStats = async ({ totalAmount = 0, profit = 0, loss = 0 }) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

    let statsDoc = await Stats.findOne({ where: { date: today } });

    if (!statsDoc) {
      statsDoc = await Stats.create({
        date: today,
        totalAmount: 0,
        profit: 0,
        loss: 0,
      });
    }
    

    // Ensure both values are numbers
    const currentTotalAmount = parseFloat(statsDoc.totalAmount);
    const currentProfit = parseFloat(statsDoc.profit);
    const currentLoss = parseFloat(statsDoc.loss);

    statsDoc.totalAmount = parseFloat((currentTotalAmount + totalAmount).toFixed(2));
    statsDoc.profit = parseFloat((currentProfit + profit).toFixed(2));
    statsDoc.loss = parseFloat((currentLoss + loss).toFixed(2));
    io.emit("DayStats",{profit:statsDoc.profit,loss:statsDoc.loss})
    await statsDoc.save();

    console.log("Stats updated:", { totalAmount, profit, loss });
  } catch (error) {
    console.error("Error updating stats:", error);
  }
};

function roundToNearestPoint05(value) {
  return Math.round(value / 0.05) * 0.05;
}

function getGameRangesState() {
  return isGameRangesOn;
}
async function updateAdminWalletBalance(amount, io) {
  try {
    let wallet = await AdminWallet.findOne();

    wallet.balance += amount;
    await wallet.save();

    // Emit updated admin wallet balance
    io.emit("adminWalletUpdated", { adminWalletBalance: wallet.balance });

    return wallet;
  } catch (error) {
    console.error("Error updating admin wallet balance:", error);
  }
}


const generateUniqueGameId = async () => {
  const sequenceName = 'gameIdSequence'; // Unique name for the sequence
  try {
    // Use a transaction to ensure atomicity (critical!)
    const result = await sequelize.transaction(async (t) => {
      // 1. Find the sequence (or create if it doesn't exist)
      const sequence = await Sequence.findOne({
        where: { name: sequenceName },
        transaction: t,
      });

      let nextValue;
      if (sequence) {
        // 2. Increment the sequence value atomically
        sequence.value = sequence.value + 1;
        await sequence.save({ transaction: t });
        nextValue = sequence.value;
      } else {
        // Sequence doesn't exist, create it and start at the initial value
        const newSequence = await Sequence.create(
          { name: sequenceName, value: 1000000 },
          { transaction: t }
        );
        nextValue = newSequence.value;
      }

      return nextValue;
    });

    return result; 

  } catch (error) {
    console.error('Error generating unique gameId:', error);
    throw error; // Re-throw the error to be handled elsewhere
  }
};

const socketHandler  = (server) => {
   io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  
  io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on("registerUser", (clientCode) => {
      userSockets[clientCode] = socket.id; 
      console.log(`User registered: ${clientCode} -> ${socket.id}`);// Store socket ID for each client
  });

  socket.on("setvalue", (value) => {
    if (value && !isNaN(value)) {
      coinReach = roundToNearestPoint05(Number(value)).toFixed(2);
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

  socket.on("start_multiplier", async () => {
    
    if (multiplierInterval) {
      clearInterval(multiplierInterval);
    }

    adminWallet = await getOrCreateAdminWallet();
    let adminBalance = adminWallet.balance;
    let reservePercentage = adminWallet.reservePercentage;
    io.emit("reservePercentage",reservePercentage);
    let numberOfUsers = Object.keys(activeBets).length;
    let totalBets = tempGameData.totalInGame
    multiplier = 1.0;
    if (!coinReach) {
      if (numberOfUsers === 0) {
        coinReach = roundToNearestPoint05(Math.random() * (25 - 1) + 1).toFixed(2); // Random between 1 to 25
        console.log("No users betting, setting random coinReach:", coinReach);
        let safeLimit = (adminBalance) * (1-(reservePercentage / 100).toFixed(2)) ;
        io.emit("reservedAmount",adminBalance*(reservePercentage / 100).toFixed(2))
        io.emit("PayableAmount",safeLimit);
      } else{
          if (adminBalance - totalBets == 0) {
            coinReach = 1.0;
            io.emit("reservedAmount",adminBalance)
            io.emit("PayableAmount",0.00);
            console.log("admin bankrupt")
          } 
          else if (!isGameRangesOn) {
            let expectedPayout = totalBets * 10; // Assume worst case: 10x avg multiplier
            let safeLimit = (adminBalance) * (1-(reservePercentage / 100).toFixed(2)) ;
            io.emit("reservedAmount",adminBalance*(reservePercentage / 100).toFixed(2))
            io.emit("PayableAmount",safeLimit);
            
            let maxAllowedMultiplier = Math.max(1.0, Math.min(10, safeLimit / expectedPayout));
            coinReach = roundToNearestPoint05(Math.random() * (maxAllowedMultiplier - 1) + 1).toFixed(2);

          }
          else {
            const range = await GameRangeSettings.findOne({
              where: {
                minTotalInGame: { [Op.lte]: tempGameData.totalInGame },
                maxTotalInGame: { [Op.gte]: tempGameData.totalInGame },
              },
            });
            if (range) {
              coinReach = roundToNearestPoint05(Math.random() * (range.maxCoinReach - range.minCoinReach) + range.minCoinReach).toFixed(2);

            }      
          }
        }
        console.log('automatically set coinreach is',coinReach)
    }
    multiplierInterval = setInterval(() => {
        if (coinReach !== null && coinReach == multiplier) {
          console.log("Multiplier reached CoinReach value:", coinReach);
          io.emit("play_3rd_video"); 
          return;
        }
        multiplier = parseFloat((multiplier + 0.05).toFixed(2));
        io.emit("update_multiplier", multiplier); 
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
    adminWallet = await getOrCreateAdminWallet();
    let reservePercentage = adminWallet.reservePercentage;
    let adminBalance = adminWallet.balance;
    io.emit("reservePercentage",reservePercentage);
    let safeLimit = (adminBalance) * (1-(reservePercentage / 100).toFixed(2)) ;
    io.emit("reservedAmount",adminBalance*(reservePercentage / 100).toFixed(2))
    io.emit("PayableAmount",safeLimit);
    console.log('Admin changed video:', videoState.url);

    if (state.url === `${process.env.BASE_URL}/videos/Begin.mp4`){
      tempGameData = {
      gameId: await generateUniqueGameId(),
      coinReach: null ,
      totalInGame: 0,
      cashout: 0,
      profitLoss: 0
       };
       io.emit('gameId', tempGameData.gameId);
       io.emit('stats',tempGameData)
       activeClientsCount = Object.keys(activeBets).length;
      io.emit("activeClientsCount", activeClientsCount);
    }
    if (state.url === `${process.env.BASE_URL}/videos/video3.mp4`) {
    
      if (tempGameData) { // Check if tempGameData exists
        tempGameData.coinReach = coinReach;
        tempGameData.profitLoss = tempGameData.totalInGame - tempGameData.cashout;
        io.emit('stats',tempGameData);
        await updateStats({ totalAmount: tempGameData.totalInGame, profit: tempGameData.profitLoss > 0 ? tempGameData.profitLoss : 0, loss: tempGameData.profitLoss < 0 ? Math.abs(tempGameData.profitLoss) : 0 });
        try {
          await Game.create(tempGameData);
          io.emit('gameData', tempGameData);
          console.log(`Game recorded: ${JSON.stringify(tempGameData)}`);
        } catch (error) {
          console.error("Error saving game data:", error);
        }
      }
      for (const clientCode in activeBets) {
        for (const bet of activeBets[clientCode]) {
          const gameResult = await UserGameResults.create({
            gameId: tempGameData.gameId,
            clientCode,
            betAmount: bet.amount,
            coinReach: tempGameData.coinReach ,
            cashout: 0,
            winLoss: "loss",
          });

          const socketId = userSockets[clientCode];
          if (socketId) {
            io.to(socketId).emit("gameResult", {
              gameId: tempGameData.gameId,
              clientCode,
              betAmount: bet.amount,
              coinReach: tempGameData.coinReach,
              cashout: 0,
              winLoss: "loss",
              createdAt: gameResult.createdAt,
            });
          }
          socket.broadcast.emit("gameResultAll", {
            gameId: tempGameData.gameId,
            clientCode,
            betAmount: bet.amount,
            coinReach: tempGameData.coinReach,
            cashout: 0,
            winLoss: "loss",
            createdAt: gameResult.createdAt,
          });
        }
      }
      tempGameData = null;
      activeBets = {};
      coinReach = null;
      activeClientsCount = Object.keys(activeBets).length;
      io.emit("activeClientsCount", activeClientsCount);

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
      currentVideoState =state;
      socket.broadcast.emit('admin_control', {...state,multiplier:multiplier});
  });

  socket.on('admin_video_state', (videoState) => {
        console.log('Admin sent video state:', videoState);
        socket.emit('video_state_update', videoState);
  });

  socket.on('fetch_current_state', (callback) => {
    const state = {...videoState, multiplier : multiplier};
    console.log(`Providing 'current admin' state. Multiplier: ${multiplier}`);
    socket.emit('fetch_current_state', state);
  });
    

  socket.on("placeBet", async ({ clientCode, betAmount }, callback)  => {
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
        await updateAdminWalletBalance(betAmount, io); 
        
        const bet = { code: clientCode, amount: betAmount, cashout:0};
        if (!activeBets[clientCode]) {
          activeBets[clientCode] = [];
        }
        if (activeBets[clientCode].length < 2) {
          activeBets[clientCode].push(bet);
          activeClientsCount = Object.keys(activeBets).length;
          io.emit("activeClientsCount", activeClientsCount);
          socket.emit("walletUpdated", {WalletBalance: data.newWalletBalance});

        }
        io.emit('stats',tempGameData)
        return callback({ success: true });
      }  
       else {
        return callback({ success: false, message: "Insufficient balance." });
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      return callback({ success: false, message: "An error occurred while placing the bet." });
    }   

  });

  socket.on("updateReservePercentage", async (newPercentage) => {
    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
      console.error("Invalid reserve percentage value:", newPercentage);
      return;
    }
  
    try {
      let adminWallet = await getOrCreateAdminWallet();
      adminWallet.reservePercentage = newPercentage;
      await adminWallet.save();
  
      console.log(`Updated reserve percentage to: ${newPercentage}%`);
      io.emit("reservePercentage", newPercentage); // Notify all clients
    } catch (error) {
      console.error("Error updating reserve percentage:", error);
    }
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
      await updateAdminWalletBalance(-betAmount, io);
      socket.emit("walletUpdated", {WalletBalance: data.newWalletBalance});
      io.emit('stats',tempGameData)
    } catch (error) {
      console.error("Error refunding bet:", error);
      return;
    }
    if (activeBets[clientCode]) {
      const betIndex = activeBets[clientCode].findIndex(
        (bet) => bet.amount === betAmount
      );
      if (betIndex !== -1) {
        activeBets[clientCode].splice(betIndex, 1); // Remove only one bet
      }
      if (activeBets[clientCode].length === 0) {
        delete activeBets[clientCode];
      }
      activeClientsCount = Object.keys(activeBets).length;
      io.emit("activeClientsCount", activeClientsCount);
    }
  });


  socket.on("cashout", async ({ clientCode, userBet, cashoutAmount,currentMultiplier }) => {
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
        await updateAdminWalletBalance(-cashoutAmount, io); 
        if (activeBets[clientCode]) {
          const betIndex = activeBets[clientCode].findIndex(
            (bet) => bet.amount === userBet
          ); 
          if (betIndex !== -1) {
            activeBets[clientCode].splice(betIndex, 1); // Remove only one bet
          }
          if (activeBets[clientCode].length === 0) {
            delete activeBets[clientCode];
          }
        }
        console.log(`Cashout: ${clientCode} won $${cashoutAmount} ${data.newWalletBalance}`);
        socket.emit("walletUpdated", {WalletBalance: data.newWalletBalance});
        const gameResult = await UserGameResults.create({
          gameId: tempGameData.gameId,
          clientCode,
          betAmount: userBet,
          coinReach: currentMultiplier,
          cashout: cashoutAmount,
          winLoss: "win",
        });

        socket.emit("gameResult", {
          gameId: tempGameData.gameId,
          clientCode,
          betAmount: userBet,
          coinReach: currentMultiplier,
          cashout: cashoutAmount,
          winLoss: "win",
          createdAt: gameResult.createdAt, // Include created date and time
        });

        io.emit("gameResultAll", {
          gameId: tempGameData.gameId,
          clientCode,
          betAmount: userBet,
          coinReach: currentMultiplier,
          cashout: cashoutAmount,
          winLoss: "win",
          createdAt: gameResult.createdAt,
        });
        io.emit('stats',tempGameData)
        activeClientsCount = Object.keys(activeBets).length;
        io.emit("activeClientsCount", activeClientsCount);
      } 
      
    } catch (error) {
      console.error("Error processing cashout:", error);
    }
  });

  socket.on("toggleGameRanges", (data) => {
    isGameRangesOn = data.isGameRangesOn;
    io.emit("gameRangesUpdated", { isGameRangesOn });
  });
  io.emit("gameRangesUpdated", { isGameRangesOn });

  socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (const clientCode in userSockets) {
        if (userSockets[clientCode] === socket.id) {
          delete userSockets[clientCode]; // Remove user on disconnect
          break;
        }
      }
    });
  });
  return io;
};

module.exports = {
  socketHandler,
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
