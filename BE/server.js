const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', // Frontend origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Use CORS for REST API endpoints
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Static route to serve videos from the "videos" folder
const videosDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);
app.use('/videos', express.static(videosDir));

// Endpoint to list all videos in the "videos" folder
app.get('/videos-list', (req, res) => {
  fs.readdir(videosDir, (err, files) => {
    if (err) {
      console.error('Error reading videos directory:', err);
      return res.status(500).json({ error: 'Unable to list videos' });
    }
    const videoFiles = files.filter((file) => /\.(mp4|mov|avi|mkv)$/i.test(file));
    res.status(200).json({ videos: videoFiles });
  });
});

// Video state (to sync admin and clients)
let videoState = {
  url: null,
  isPlaying: false,
  currentTime: 0,
  isMuted: false
};

let currentVideoUrl = '';  // Track the current video URL
let currentTime = 0;       // Track the current time of the video
let isPlaying = false;     // Track whether the video is playing or paused
let isMuted = false;       // Track the mute state

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

    // Listen for the admin selecting a new video
    socket.on('admin_select_video', (videoUrl) => {
      console.log('Admin selected video:', videoUrl);
  
      // Stop the current video and broadcast the new video URL
      isPlaying = false;  // Stop the current video
      currentVideoUrl = videoUrl;
      currentTime = 0;  // Reset time or keep it based on your preference
      isMuted = false;   // Optionally reset mute state
  
      // Broadcast the new video to all clients
      io.emit('video_change', {
        url: currentVideoUrl,
        currentTime: currentTime,
        isPlaying: isPlaying,
        isMuted: isMuted,
      });
      io.emit('admin_control', videoState);
    });

  socket.on('play', () => {
    console.log('Play command received');
    io.emit('play'); // Broadcast play to all clients
  });

  socket.on('pause', () => {
    console.log('Pause command received');
    io.emit('pause'); // Broadcast pause to all clients
  });

  socket.on('mute', () => {
    console.log('Mute command received');
    io.emit('mute'); // Broadcast mute to all clients
  });

  socket.on('unmute', () => {
    console.log('Unmute command received');
    io.emit('unmute'); // Broadcast unmute to all clients
  });

  socket.on('restart', () => {
    console.log('Restart command received');
    io.emit('restart'); // Broadcast restart to all clients
  });

  // Send the current video state to new clients
  socket.emit('start_stream', videoState);

  // Listen to admin commands
  socket.on('admin_control', (state) => {
    videoState = { ...videoState, ...state };

    

    // Broadcast updated state to all clients
    io.emit('client_control', videoState);
  });

  // Handle fetch_current_state event
socket.on('fetch_current_state', (data, callback) => {
  console.log('Client requested current state');
  callback(videoState); // Send the current video state to the client
});


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
}); 

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
