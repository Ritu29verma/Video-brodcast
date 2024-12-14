// routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const router = express.Router();

module.exports = (io) => {
  // Configure Multer storage for video uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'videos');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Create 'videos' folder if it doesn't exist
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  });
  const upload = multer({ storage: storage });

  router.post('/video', upload.single('video'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const inputFilePath = req.file.path;
    const videoName = path.parse(req.file.filename).name;
    const outputDir = path.join(__dirname, '..', 'videos', videoName);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const outputVideoPath = `${outputDir}/output.mp4`;
    const thumbnailPath = `${outputDir}/thumbnail.jpg`;

    // Generate thumbnail and convert video to MP4
    ffmpeg(inputFilePath)
      .screenshots({
        timestamps: ['50%'],
        filename: 'thumbnail.jpg',
        folder: outputDir,
        size: '320x240',
      })
      .on('end', () => {
        console.log('Thumbnail created successfully');

        ffmpeg(inputFilePath)
          .output(outputVideoPath)
          .outputOptions([
            '-preset veryfast',
            '-movflags +faststart',
            '-vf scale=1280:720',
            '-c:v libx264',
            '-c:a aac',
            '-b:v 1500k',
          ])
          .on('end', () => {
            fs.unlinkSync(inputFilePath); // Clean up uploaded file

            const videoUrl = `http://localhost:5000/videos/${videoName}/output.mp4`;

            io.emit('start_stream', videoUrl);

            res.status(200).json({
              message: 'File uploaded and processed successfully!',
              videoUrl: videoUrl,
              thumbnailUrl: `http://localhost:5000/videos/${videoName}/thumbnail.jpg`,
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

  return router;
};
