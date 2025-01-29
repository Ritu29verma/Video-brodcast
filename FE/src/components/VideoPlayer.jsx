import React, { useEffect, useRef, useState } from 'react';
import socket from "../components/socket";

const Client = () => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false); 
  const [adminState, setAdminState] = useState({
    url: null,
    currentTime: 0,
    isMuted: false,
    isPlaying: false
  }); 
  const [videoState, setVideoState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoList, setVideoList] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [coinReach, setCoinReach] = useState(0);
  
  useEffect(() => {
    socket.on('admin_logout', () => {
      console.log('Admin has logged out, resetting video state');
      setVideoUrl(null);
      setIsPlaying(false);
      setAdminState({
        url: null,
        currentTime: 0,
        isMuted: false,
        isPlaying: false,
        action: []
      });
  
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
        videoElement.currentTime = 0;
      }
    });
  
    return () => {
      socket.off('admin_logout');
    };
  }, []);

  useEffect(() => {
    socket.on('stop_video_loop', () => {
      if (videoRef.current) {
        const videoElement = videoRef.current;
        videoElement.pause();
        videoElement.src = ''; 
        videoElement.currentTime = 0; 
      }
    });
    return () => {
      socket.off('stop_video_loop');
    };
  }, []);
  
  useEffect(() => {
    socket.on('admin_reset_state', (resetState) => {
      console.log('Received reset state from admin:', resetState);
  
      // Reset the video state on client-side
      setVideoState(resetState);
      setIsPlaying(resetState.isPlaying);
      setAdminState(resetState);
  
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
        videoElement.currentTime = 0;
      }
    });
  
    return () => {
      socket.off('admin_reset_state');
    };
  }, []);
  
  // Listen for real-time updates from the admin
  useEffect(() => {
    socket.on('admin_control', (state) => {
      // console.log('Real-time state update from admin:', state);
      setVideoState(state);
  
      const videoElement = videoRef.current;
      if (videoElement && state.url) {
        if (videoElement.src !== state.url) {
          videoElement.src = state.url;
          videoElement.currentTime = state.currentTime || 0;
          videoElement.load();
  
          videoElement.onloadeddata = () => {
            if (state.isPlaying) {
              videoElement
                .play()
                .catch((err) => console.error('Error playing video:', err));
            }
          };
        } else if (state.isPlaying) {
          videoElement.play().catch((err) => console.error('Error playing video:', err));
        } else {
          videoElement.pause();
        }
  
        videoElement.muted = state.isMuted || false;
      }
    });
  
    return () => socket.off('admin_control');
  }, []);
  


// Overlay and coin multiplier
useEffect(() => {
  
  socket.on('show_overlay', () => setShowOverlay(true));
  socket.on('hide_overlay', () => setShowOverlay(false));
  socket.on('set_coin_reach', (value) => setCoinReach(value));
  socket.on("update_multiplier", (multiplier) => {
    console.log("Multiplier updated:", multiplier);
    setCurrentMultiplier(multiplier); 
  });
  return () => {
    socket.off('show_overlay');
    socket.off('hide_overlay');
    socket.off('set_coin_reach');
    socket.off('update_multiplier');
  };
}, []);

//  Listen for real-time updates from the admin
 useEffect(() => {
  socket.on('video_change', (state) => {
    console.log('Received video switch from admin:', state);
    console.log('Current video list:', videoList);
    console.log('State URL:', state.url);

    setVideoUrl(state.url);
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.src = state.url;
      videoElement.currentTime = state.currentTime || 0;
      videoElement.muted = state.isMuted || false;

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
}, [videoList]);


  // Handle user interaction and fetch the latest admin state
  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);

      // Request the latest admin state upon interaction
      socket.emit('fetch_current_state', {} , (state) => {
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
          } else {
            videoElement.pause();
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
      socket.off('restart');
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [videoUrl, hasInteracted]);

  return (
    <div className="flex flex-col items-center w-full ">
    <video
      ref={videoRef}
      controls={false}
      className="w-full max-w-3xl rounded shadow-lg"
      style={{ objectFit: 'contain', aspectRatio: '16/9' }}
      autoPlay
      muted
    />
    {showOverlay && (
            <div className="absolute inset-0 bg-opacity-50 flex justify-center items-center">
              <span className="text-white text-4xl">{currentMultiplier.toFixed(1)}x</span>
            </div>
          )}
        </div>
  );
};

export default Client;
