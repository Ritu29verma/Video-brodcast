import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Video from './pages/Video';
import UserVideo from './pages/UserVideo';
import AdminVideo from './pages/AdminVideo';
import VideoUploadAndStream from './pages/VideoUploadAndStream';

const App = () => {
  // State to manage the video URL to be streamed
  const [streamingVideo, setStreamingVideo] = useState(null);

  return (
    <div>
      <Router>
        <Routes>
          {/* Video streaming page where the video URL is passed as a prop */}
          <Route path="/" element={<UserVideo videoUrl={streamingVideo}  />} />
          <Route path="/admin" element={<AdminVideo videoUrl={streamingVideo} setVideoUrl={setStreamingVideo}  />} />

          {/* Admin page with video upload and selection */}
          <Route path="/upload" element={<VideoUploadAndStream setStreamingVideo={setStreamingVideo} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
