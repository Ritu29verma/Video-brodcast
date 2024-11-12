const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/video_streaming', { useNewUrlParser: true, useUnifiedTopology: true });

// Initialize timestamp and control variables
let currentTimestamp = 0;
let isVideoPlaying = false;

// Function to increment timestamp every second when video is playing
const incrementTimestamp = () => {
  if (isVideoPlaying) {
    currentTimestamp += 1;
    io.emit('current_time', currentTimestamp); // Broadcast timestamp to all connected clients
  }
};
setInterval(incrementTimestamp, 1000);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New user connected');

  // Send the current timestamp to the new user immediately upon connection
  socket.emit('current_time', currentTimestamp);

  // Handle admin control actions
  socket.on('admin_control', (action) => {
    console.log(`Admin control: ${action}`);
    if (action === 'play') {
      isVideoPlaying = true;
    } else if (action === 'pause') {
      isVideoPlaying = false;
    } else if (action === 'restart') {
      currentTimestamp = 0;
      isVideoPlaying = true;
    }
    io.emit('admin_control', action); // Broadcast the action to all connected clients
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
