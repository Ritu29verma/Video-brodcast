import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Video from './Video';
import VideoUploadAndStream from './VideoUploadAndStream';

const App = () => {
  // State to manage the video URL to be streamed
  const [streamingVideo, setStreamingVideo] = useState(null);

  return (
    <div>
      <Router>
        <Routes>
          {/* Video streaming page where the video URL is passed as a prop */}
          <Route path="/" element={<Video videoUrl={streamingVideo} />} />

          {/* Admin page with video upload and selection */}
          <Route path="/admin" element={<VideoUploadAndStream setStreamingVideo={setStreamingVideo} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
