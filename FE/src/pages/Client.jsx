import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Client = () => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false); // Track user interaction
  const [adminState, setAdminState] = useState(null); // Track the admin's video state
  const [videoState, setVideoState] = useState(null);

  // Listen for real-time updates from the admin
  useEffect(() => {
    socket.on('admin_control', (state) => {
      setVideoState(state);
  
      const videoElement = videoRef.current;
      if (videoElement && state.url) {
        if (videoElement.src !== state.url) {
          videoElement.src = state.url;
          videoElement.currentTime = 0;
          videoElement.load();
  
          videoElement.onloadeddata = () => {
            if (state.isPlaying) {
              videoElement
                .play()
                .then(() => console.log('Client video started playing'))
                .catch((err) => console.error('Error playing video:', err));
            }
          };
        } else if (state.isPlaying) {
          videoElement.play().catch((err) => console.error('Error playing video:', err));
        } else {
          videoElement.pause();
        }
        videoElement.muted = state.isMuted;
      }
    });
  
    return () => socket.off('admin_control');
  }, []);  

 // Listen for real-time updates from the admin
 useEffect(() => {
  // When admin selects a new video, broadcast the URL to all clients
  socket.on('video_change', (state) => {
    console.log('Received video switch from admin:', state);
    setVideoUrl(state.url);

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.src = state.url;
      videoElement.currentTime = state.currentTime || 0;
      videoElement.muted = state.isMuted || false;

      // If the video should play, start it
      if (state.isPlaying) {
        videoElement.play().catch((err) => console.error('Error playing video:', err));
      } else {
        videoElement.pause();
      }
    }
  });

  return () => {
    socket.off('video_change');
  };
}, []);

  // Handle user interaction and fetch the latest admin state
  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);

      // Request the latest admin state upon interaction
      socket.emit('fetch_current_state', {}, (state) => {
        console.log('Fetched current state from admin:', state);
        setAdminState(state);

        const videoElement = videoRef.current;
        if (videoElement && state) {
          videoElement.src = state.url;
          videoElement.currentTime = state.currentTime || 0;
          videoElement.muted = state.isMuted || false;

          // Start video playback if admin is playing
          if (state.isPlaying) {
            videoElement
              .play()
              .catch((err) => console.error('Playback error on interaction:', err));
          }
        }
      });
    }
  };

  // Sync video playback position with the admin's current time
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoState && videoElement) {
      const { url, isPlaying, currentTime, isMuted } = videoState;

      // Update video source
      if (videoElement.src !== url) {
        videoElement.src = url;
        videoElement.load();
      }

      // Sync playback position
      const clientTime = videoElement.currentTime;
      const drift = currentTime - clientTime;

      if (Math.abs(drift) > 0.5) {
        // Large drift: Seek to the correct position
        videoElement.currentTime = currentTime;
      } else {
        // Small drift: Adjust playback speed
        videoElement.playbackRate = drift > 0 ? 1.05 : 0.95;
      }

      // Sync play/pause state
      if (isPlaying) {
        videoElement.play();
      } else {
        videoElement.pause();
      }

      // Sync mute state
      videoElement.muted = isMuted;
    }
  }, [videoState]);

  useEffect(() => {
    // Listen for initial stream state for new clients
    socket.on('start_stream', (state) => {
      console.log('Received initial state:', state);
      setAdminState(state);
  
      const videoElement = videoRef.current;
      if (state.url) {
        setVideoUrl(state.url);
        if (videoElement) {
          videoElement.src = state.url;
          videoElement.currentTime = state.currentTime || 0;
          videoElement.muted = state.isMuted || false;
        }
      }
    });
  
    // Listen for video change
    socket.on('video_change', (state) => {
      console.log('Video changed to:', state);
      setAdminState(state);
  
      const videoElement = videoRef.current;
      if (state.url) {
        setVideoUrl(state.url);
        if (videoElement) {
          videoElement.src = state.url;
          videoElement.currentTime = state.currentTime || 0;
          videoElement.muted = state.isMuted || false;
  
          if (state.isPlaying) {
            videoElement.play().catch((err) => {
              console.error('Error playing video:', err);
            });
          }
        }
      }
    });
  
    // Listen for play command
    socket.on('play', () => {
      console.log('Play command received');
      const videoElement = videoRef.current;
      if (videoElement && videoElement.src) {
        videoElement.play().catch((err) => console.error('Error playing video:', err));
      } else {
        console.warn('No valid video source to play.');
      }
    });

    socket.on('pause', () => {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.pause();
      }
    });

    socket.on('mute', () => {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.muted = true;
      }
    });

    socket.on('unmute', () => {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.muted = false;
      }
    });

    socket.on('restart', () => {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play()
          .catch((err) => console.error('Error restarting video:', err));
      }
    });

    // Attach event listeners for interaction
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      socket.off('start_stream');
      socket.off('play');
      socket.off('pause');
      socket.off('mute');
      socket.off('unmute');
      socket.off('restart');
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [videoUrl, hasInteracted]);

  return (
    <div
    className={`flex items-center justify-center min-h-screen bg-gray-900 text-white p-6 transition-opacity duration-500 ${
      hasInteracted ? ' pointer-events-none' : 'opacity-100'
    }`}
    onClick={handleUserInteraction}
  >
    {!hasInteracted && (
      <h1 className="text-3xl font-bold text-center text-blue-400 animate-pulse">
        Click Anywhere or Press any Key to Start the Game
      </h1>
    )}
    {hasInteracted && (
      <div className="flex flex-col items-center w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
          Live Video Stream
        </h1>
        <video
          ref={videoRef}
          controls={false}
          className="w-full max-w-3xl rounded shadow-lg"
          style={{ objectFit: 'contain', aspectRatio: '16/9' }}
          autoPlay
          muted
        />
      </div>
    )}
  </div>
  );
};

export default Client;
