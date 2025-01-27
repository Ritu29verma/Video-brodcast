const socketIo = require('socket.io');
let adminLoggedOut = true;
let videoState = {
  url: null,
  isPlaying: false,
  currentTime: 0, 
  isMuted: false,
};

let io; 

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

    socket.on('show_overlay', () => {
      io.emit('show_overlay'); 
    });
  
    socket.on('hide_overlay', () => {
      io.emit('hide_overlay'); 
    });

    socket.on('update_multiplier', (multiplier) => {
      io.emit('update_multiplier', multiplier); 
    });

    socket.on('play', () => {
      console.log('Play command received');
      videoState.isPlaying = true;
      io.emit('play');
    });

    socket.on('pause', () => {
      console.log('Pause command received');
      io.emit('pause');
    });

    socket.on('mute', () => {
      console.log('Mute command received');
      io.emit('mute');
    });

    socket.on('unmute', () => {
      console.log('Unmute command received');
      io.emit('unmute');
    });

    socket.on('restart', () => {
      console.log('Restart command received');
      io.emit('restart');
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