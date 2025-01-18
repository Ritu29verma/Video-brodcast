const socketIo = require('socket.io');

let videoState = {
  url: null,
  isPlaying: false,
  currentTime: 0,
  isMuted: false,
};

module.exports = (server) => {
  const io = socketIo(server, {
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

    socket.on('admin_control', (state) => {
      videoState = { ...videoState, ...state };
      io.emit('client_control', videoState);
    });

socket.on('admin_login', () => {
  console.log('Admin has logged in.');
  adminLoggedOut = false; // Set to false when admin logs in
});

socket.on('fetch_current_state', (callback) => {
  if (typeof callback === 'function') {
    // Check if the admin is logged out
    if (adminLoggedOut) {
      const defaultState = {
        url: null,
        currentTime: 0,
        isMuted: false,
        isPlaying: false,
        action: []
      };
      console.log('Providing default state as admin is logged out.');
      callback(defaultState);
    } else {
      // Return the current admin state if the admin is logged in
      console.log('Providing current admin state.');
      callback(videoState);
    }
  } else {
    console.error('Callback is not a function.', typeof callback);
  }
});

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
