import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({
  selectedVideo, 
  currentState, 
  setCurrentState, 
  coinReach, 
  currentMultiplier, 
  setCurrentMultiplier, 
  showOverlay, 
  setShowOverlay
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      videoRef.current.src = selectedVideo;
      videoRef.current.play().catch((error) => {
        console.error('Error starting video playback:', error);
        videoRef.current.muted = true;
        try {
          videoRef.current.play();
        } catch (err) {
          console.error('Autoplay retry failed:', err);
        }
      });
    }
  }, [selectedVideo]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedVideo === videoList[1]) {
        setCurrentMultiplier(prev => {
          const newMultiplier = prev + parseFloat((Math.random() * 0.4 + 0.1).toFixed(1));
          if (newMultiplier >= coinReach) {
            setShowOverlay(false);
            handleSelectVideo(videoList[2]);
          }
          return newMultiplier;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedVideo, coinReach, currentMultiplier]);

  const handleVideoEnd = () => {
    if (selectedVideo === videoList[0]) {
      handleSelectVideo(videoList[1]);
    }
  };

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={selectedVideo}
        onEnded={handleVideoEnd}
        className="video"
      />
      {showOverlay && (
        <div className="overlay">
          <span>{currentMultiplier.toFixed(1)}x</span>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
