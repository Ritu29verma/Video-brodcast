const socketIo = require('socket.io');
let coinList = []; 
let finalCoinList = [];
let multiplier = 1.0; 
let multiplierInterval = null;
let io; 

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
      origin: 'http://localhost:5173',
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

      if (coinList.includes(multiplier)) {
        clearInterval(multiplierInterval);
        multiplierInterval = null;

        console.log("Multiplier reached CoinReach value:", multiplier);
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
    finalCoinList = [...finalCoinList, ...coinList];
    console.log("Final coinList:", finalCoinList);
    coinList = []; 
    coinReach = null; 
    console.log("Game reset for 1st video.");
    io.emit("update_coinList", coinList); 
    io.emit("update_multiplier", multiplier); 
  });

  socket.on('admin_logout', () => {
    console.log('Admin has logged out');
    videoState = {
      url: null,
      currentTime: 0,
      isMuted: false,
      isPlaying: false,
    };
    io.emit('admin_logout'); // Notify clients that the admin logged out
    io.emit('admin_control', videoState); // Reset the video state on all clients
  });

  socket.on('admin_select_video', (state) => {
    if (!state || !state.url) {
      console.error('Invalid state received from admin_select_video:', state);
      return;
    }

    console.log('Admin selected video:', state.url);

    videoState = {
      ...videoState,
      url: state.url,
      currentTime: 0,
      isPlaying: true,
      isMuted: state.isMuted,
    };

    io.emit('admin_control', videoState);
  });

  socket.on('video_change', (state) => {
    videoState = { ...state, currentTime: 0 };
    console.log('Admin changed video:', videoState.url);
    io.emit('video_change', videoState);
  });

  socket.on('stop_video_loop', () => {
    console.log('Stop video loop event received from admin');
    io.emit('stop_video_loop');
  });


  socket.on('pause', () => {
    console.log('Pause command received');
    io.emit('pause');
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
      

    socket.on('admin_login', () => {
    console.log('Admin has logged in.');
    adminLoggedOut = false; // Set to false when admin logs in
    });

    // Emit the current state depending on whether the admin is logged out
    socket.on('fetch_current_state', (callback) => {
    const state = adminLoggedOut
      ? {
          url: null,
          currentTime: 0,
          isMuted: false,
          isPlaying: false,
          action: [],
        }
      : videoState;
    console.log(`Providing ${adminLoggedOut ? 'default' : 'current admin'} state.`);
    socket.emit('fetch_current_state', state);
    });

    socket.on('set_coin_reach', (coinReach) => {
    console.log('Received coinReach update:', coinReach);
    socket.emit('set_coin_reach', coinReach); // Emit the coinReach value to listeners
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  return io;
};

module.exports.getIo = () => io;