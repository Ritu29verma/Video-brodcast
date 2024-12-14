const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

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
app.use(bodyParser.json());
app.use(express.json());
app.use('/videos', express.static(path.join(__dirname, 'videos')));

mongoose.connect('mongodb://localhost:27017/video-streaming', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

let currentTimestamp = 0;
let isVideoPlaying = false;
let videoUrl = '';
let clients = [];

io.on('connection', (socket) => {
  console.log('New user connected');
  clients.push(socket);

  socket.on('request_initial_state', () => {
    socket.emit('initial_state', {
      currentTime: currentTimestamp,
      isPlaying: isVideoPlaying,
      videoUrl: videoUrl
    });
  });

  socket.on('start_stream', (url) => {
    videoUrl = url;
    currentTimestamp = 0;
    console.log('Broadcasting video URL:', videoUrl);
    io.emit('start_stream', videoUrl);
    io.emit('admin_control', 'play');
  });

  socket.on('admin_control', (action) => {
    console.log(`Admin control: ${action}`);
    if (action === 'play') {
      isVideoPlaying = true;
    } else if (action === 'pause') {
      isVideoPlaying = false;
    } else if (action === 'restart') {
      currentTimestamp = 0;
      isVideoPlaying = true;
    } else if (action === 'mute') {
      io.emit('admin_control', 'mute');
    } else if (action === 'unmute') {
      io.emit('admin_control', 'unmute');
    }
    io.emit('admin_control', action);
  });

  socket.on('current_time', (timestamp) => {
    currentTimestamp = timestamp;
    io.emit('current_time', currentTimestamp);
  });

  socket.emit('current_time', currentTimestamp);

  socket.on('disconnect', () => {
    clients = clients.filter(client => client !== socket);
    console.log('User disconnected');
  });
});

app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes(io));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
