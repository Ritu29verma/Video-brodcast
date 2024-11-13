const express = require('express');
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.post('/save-video', async (req, res) => {
  const { videoPath, videoName } = req.body;

  // Ensure the video doesn't already exist in the database
  const existingVideo = await Video.findOne({ name: videoName });

  if (existingVideo) {
    return res.status(400).json({ message: 'Video already exists' });
  }

  // Create a new video document
  const newVideo = new Video({
    name: videoName,
    path: videoPath,
  });

  try {
    // Save video metadata to MongoDB
    await newVideo.save();
    res.status(200).json({ message: 'Video saved successfully', video: newVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving video', error: err });
  }
});

// DELETE route to delete video from MongoDB and file system
router.delete('/delete-video', async (req, res) => {
  const { videoName } = req.body;

  try {
    // Find the video by name
    const video = await Video.findOne({ name: videoName });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete video from MongoDB
    await Video.deleteOne({ name: videoName });

    // Delete the video file from the filesystem
    const videoPath = path.join(__dirname, '..', 'videos', video.path);
    fs.unlinkSync(videoPath); // This deletes the video file from the server

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting video', error: err });
  }
});

// Route to get all saved videos
router.get('/saved-videos', async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json({ savedVideos: videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching videos', error: err });
  }
});

module.exports = router;
