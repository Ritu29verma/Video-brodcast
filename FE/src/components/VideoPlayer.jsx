import React, { useEffect, useRef, useState } from 'react';
import socket from "../components/socket";
import Muted from "../components/Muted"

const VideoPlayer = ({ hasInteracted, setHasInteracted }) => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoState, setVideoState] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false); 

  const handleMuteToggle = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
   const fetchVideoList = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`);
        const data = await response.json();
        return data.videos;
      } catch (error) {
        console.error("Error fetching videos:", error);
        return [];
      }
    };
    
    useEffect(() => {
      const loadVideos = async () => {
        const videos = await fetchVideoList();
        setVideoList(videos);
      };
    
      loadVideos();
    }, []);


  useEffect(() => {
    socket.on('stop_video_loop', () => {
      if (videoRef.current) {
        const videoElement = videoRef.current;
        videoElement.pause();
        videoElement.src = ''; 
        videoElement.currentTime = 0; 
        setLoading(true);
      }
    });
    return () => {
      socket.off('stop_video_loop');
    };
  }, []);
  
  
  // Listen for real-time updates from the admin
  useEffect(() => {
    socket.on("admin_control", (state) => {
      setVideoState(state);
      const videoElement = videoRef.current;
  
      if (videoElement && state.url) {
        if (videoElement.src !== state.url) {
          setLoading(true);
          videoElement.pause();
          videoElement.src = state.url;
          videoElement.load();
  
          videoElement.onloadeddata = () => {  //  <-- ADD THIS
            setLoading(false);
            if (state.isPlaying) {
              const playPromise = videoElement.play();
              if (playPromise) {
                playPromise.catch(err => console.error("Error playing video:", err));
              }
            }
          };
        } else if (state.isPlaying) {
          const playPromise = videoElement.play();
              if (playPromise) {
                playPromise.catch(err => console.error("Error playing video:", err));
              }
        } else {
          videoElement.pause();
        }
  
        setShowOverlay(prevState => {
          const newState = state.url === `${import.meta.env.VITE_BASE_URL}/videos/Middle_second.mp4` ||
                           state.url === `${import.meta.env.VITE_BASE_URL}/videos/video3.mp4`;
  
          return newState;
        });
      }
    });
    return () => socket.off("admin_control");
  }, [isMuted]);
  
  
  


// Overlay and coin multiplier
useEffect(() => {
  socket.on("update_multiplier", (multiplier) => {
    setCurrentMultiplier(multiplier);
  });
  return () => {
    socket.off('update_multiplier');
  };
}, []);

//  Listen for real-time updates from the admin
useEffect(() => {
  socket.on("video_change", (state) => {
    setShowOverlay(prevState => {
      const newState = state.url === `${import.meta.env.VITE_BASE_URL}/videos/Middle_second.mp4` ||
                       state.url === `${import.meta.env.VITE_BASE_URL}/videos/video3.mp4`;
    
      return newState;
    });

    const videoElement = videoRef.current;
    if (videoElement && videoElement.src !== state.url) {
      videoElement.pause();
      videoElement.src = state.url;
      videoElement.load();
      videoElement.currentTime = state.currentTime || 0;
      //videoElement.muted = state.isMuted || false;

      if (state.isPlaying) {
        videoElement.play().catch((err) => console.error("Error playing video:", err));
      } else {
        videoElement.pause();
      }
    }
  });

  return () => socket.off("video_change");
}, []);



  // Handle user interaction and fetch the latest admin state
  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
  
      // Request the latest admin state upon interaction
      socket.emit('fetch_current_state', {} , (state) => {
        console.log('Fetched current state from admin:', state);
        setShowOverlay(prevState => {
          const newState = state.url === `${import.meta.env.VITE_BASE_URL}/videos/Middle_second.mp4` ||
                           state.url === `${import.meta.env.VITE_BASE_URL}/videos/video3.mp4`;
  
          return newState;
        });
  
        const videoElement = videoRef.current;
        if (videoElement && state) {
          videoElement.src = state.url;
          videoElement.currentTime = state.currentTime || 0;
         // videoElement.muted = state.isMuted || false;
  
          // Start video playback if admin is playing
          if (state.isPlaying) {
            const playPromise = videoElement.play();  // <-- Capture the Promise
            if (playPromise) {
              playPromise
                .then(() => console.log("Playback started after interaction"))
                .catch((err) => console.error('Playback error on interaction:', err));
            }
          } else {
            videoElement.pause();
          }
        }
      });
    }
  };
  
  
  useEffect(() => {
    if (hasInteracted) {
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.play().catch(err => console.warn("Autoplay prevented:", err));
      }
    }
  }, [hasInteracted]); 


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
     // videoElement.muted = isMuted;
    }
  }, [videoState]);

  useEffect(() => {
    socket.on('start_stream', (state) => {
      console.log('Received initial state:', state);
      setShowOverlay(prevState => {
        const newState = state.url === `${import.meta.env.VITE_BASE_URL}/videos/Middle_second.mp4` ||
                         state.url === `${import.meta.env.VITE_BASE_URL}/videos/video3.mp4`;
      
        return newState;
      });
      const videoElement = videoRef.current;
      if (state.url) {
        setVideoUrl(state.url);
        setShowOverlay(prevState => {
          const newState = state.url === `${import.meta.env.VITE_BASE_URL}/videos/Middle_second.mp4` ||
                           state.url === `${import.meta.env.VITE_BASE_URL}/videos/video3.mp4`;
        
          return newState;
        });
        if (videoElement) {
          videoElement.src = state.url;
          videoElement.currentTime = state.currentTime || 0;
         // videoElement.muted = isMuted;
        }
      }
    });
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      socket.off('start_stream');
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [videoUrl, hasInteracted, isMuted]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-3xl">
        <video
          ref={videoRef}
          controls={false}
          className="w-full h-full rounded shadow-lg object-contain"
          style={{ objectFit: 'contain', aspectRatio: '16/9' }}
          autoPlay
        />
        
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
            <span className="text-white font-bold text-2xl">Loading...</span>
          </div>
        )}
  
        {!loading && showOverlay && (
          <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
            <span className="text-white font-bold text-5xl">{currentMultiplier.toFixed(2)}x</span>
          </div>
        )}
  
        <Muted isMuted={isMuted} handleMuteToggle={handleMuteToggle} />
      </div>
    </div>
  );
  
};
export default VideoPlayer;
