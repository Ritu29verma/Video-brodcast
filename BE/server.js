const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');

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

// Configure Multer storage for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'videos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Create 'videos' folder if it doesn't exist
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

mongoose.connect('mongodb://localhost:27017/video-streaming', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

let currentTimestamp = 0;
let isVideoPlaying = false;
let videoUrl = '';

// Increment timestamp every second if video is playing
const incrementTimestamp = () => {
  if (isVideoPlaying) {
    currentTimestamp += 1;
    io.emit('current_time', currentTimestamp); // Broadcast timestamp to all clients
  }
};
setInterval(incrementTimestamp, 1000);

// Upload route to handle video file upload and FFmpeg processing
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const inputFilePath = req.file.path;
  const videoName = path.parse(req.file.filename).name;
  const outputDir = path.join(__dirname, 'videos', videoName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const outputVideoPath = `${outputDir}/output.m3u8`;
  const thumbnailPath = `${outputDir}/thumbnail.jpg`;

  // Generate thumbnail and convert video to HLS
  ffmpeg(inputFilePath)
    .screenshots({
      timestamps: ['50%'],
      filename: 'thumbnail.jpg',
      folder: outputDir,
      size: '320x240'
    })
    .on('end', () => {
      console.log('Thumbnail created successfully');

      ffmpeg(inputFilePath)
        .output(outputVideoPath)
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 1',
          '-hls_list_size 0',
          // '-hls_flags delete_segments+append_list', // Optimize for low-latency
          '-f hls',
          '-g 30'
        ])
        .on('end', () => {
          fs.unlinkSync(inputFilePath); // Clean up uploaded file

          // Set the new video URL
          videoUrl = `http://localhost:5000/videos/${videoName}/output.m3u8`;

          // Emit the new video URL to all clients
          io.emit('start_stream', videoUrl);

          res.status(200).json({
            message: 'File uploaded and processed successfully!',
            videoUrl: videoUrl,
            thumbnailUrl: `http://localhost:5000/videos/${videoName}/thumbnail.jpg`
          });
        })
        .on('error', (err) => {
          console.error('Error processing video:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error processing video' });
          }
        })
        .run();
    })
    .on('error', (err) => {
      console.error('Error creating thumbnail:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error creating thumbnail' });
      }
    });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New user connected');

  // Send current state to the new client on request
  socket.on('request_initial_state', () => {
    socket.emit('initial_state', {
      currentTime: currentTimestamp,
      isPlaying: isVideoPlaying,
      videoUrl: videoUrl
    });
  });

  // Handle admin-triggered start of a video stream
  socket.on('start_stream', (url) => {
    videoUrl = url;
    currentTimestamp = 0; // Reset timestamp on new video
    console.log('Broadcasting video URL:', videoUrl);
    io.emit('start_stream', videoUrl); // Broadcast to all clients
  });

  // Listen for admin control actions
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
    io.emit('admin_control', action); // Broadcast the action to all clients
  });

  // Send current timestamp periodically to all clients
  socket.emit('current_time', currentTimestamp);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Use admin routes
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
