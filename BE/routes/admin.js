const express = require('express');
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.post('/save-video', async (req, res) => {
  const { videoPath, videoName } = req.body;

  const existingVideo = await Video.findOne({ name: videoName });

  if (existingVideo) {
    return res.status(400).json({ message: 'Video already exists' });
  }

  const newVideo = new Video({
    name: videoName,
    path: videoPath,
  });

  try {
    await newVideo.save();
    res.status(200).json({ message: 'Video saved successfully', video: newVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving video', error: err });
  }
});

router.delete('/delete-video', async (req, res) => {
  const { videoName } = req.body;

  try {
    const video = await Video.findOne({ name: videoName });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    await Video.deleteOne({ name: videoName });

    const videoPath = path.join(__dirname, '..', 'videos', video.path);
    fs.unlinkSync(videoPath);

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting video', error: err });
  }
});

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
