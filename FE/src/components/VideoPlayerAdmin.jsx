import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from "../components/socket";
import CoinReachAdmin from './coinReachAdmin';

const VideoPlayerAdmin = ({ videoList }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
const [hasInteracted, setHasInteracted] = useState(false);
  const videoRef = useRef(null);
  const [coinReach, setCoinReach] = useState('');
  const [currentMultiplier, setCurrentMultiplier] = useState();
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentState, setCurrentState] = useState({
    url: null,
    isPlaying: false,
    currentTime: 0,
    isMuted: false,
    action: null,    
  });
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [stopLoop, setStopLoop] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [coinReachList, setCoinReachList] = useState([]);

  useEffect(() => {
    if (!hasInteracted) return;

    // Handle user interaction and fetch the latest admin state
    const handleInteraction = () => {
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

      window.addEventListener('click', handleInteraction);
      window.addEventListener('keydown', handleInteraction);
    
      return () => {
        // Cleanup event listeners
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown',handleInteraction);
      };
    }, [videoUrl, hasInteracted]);

  const resetVideoState = () => {
    const resetState = {
      url: null,
      currentTime: 0,
      isMuted: false,
      isPlaying: false,
      action: null,
    };
    setCurrentState(resetState);
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.currentTime = 0;
    }
    socket.emit('admin_reset_state', resetState);
  };

  useEffect(() => {
    socket.on('admin_logout', resetVideoState);
    return () => socket.off('admin_logout');
  }, []);

  useEffect(() => {
    socket.on('admin_logged_in', (data) => {
      console.log('admin logged in:', data.phoneNo);
      handleSelectVideo(videoList[0]); 
    });

    return () => {
      socket.off('admin_logged_in');
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem('token') && currentState.isPlaying && videoRef.current) {
      const interval = setInterval(() => {
        const updatedState = {
          url: currentState.url,
          currentTime: videoRef.current.currentTime,
          isPlaying: !videoRef.current.paused,
          isMuted: videoRef.current.muted || false,
        };
        socket.emit('admin_control', updatedState);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentState.isPlaying, currentState.url]);

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem('token');
    if (isAdminLoggedIn) {
      // Fetch the current state from the server
      socket.emit('fetch_current_state', {}, (state) => {
        console.log('Fetched current state on login:', state);
        setCurrentState(state);
  
        const videoElement = videoRef.current;
  
        // Ensure the video element and state URL are valid
        if (videoElement) {
          if (state.url) {
            videoElement.src = state.url;
            videoElement.currentTime = state.currentTime || 0;
            videoElement.muted = state.isMuted || false;
  
            // Attempt to play the video if it's marked as playing
            if (state.isPlaying) {
              videoElement.play().catch((err) => {
                console.error('Error playing video on login:', err);
              });
            }
          } else {
            console.warn('No video URL provided in state:', state);
          }
        } else {
          console.error('Video element is not initialized.');
        }
      });
    }
  }, [socket]); 

  
   // Automatically play the next video after the current one ends
   const handleVideoEnd = () => {
    if (stopLoop) return;
    const currentIndex = videoList.indexOf(selectedVideo.split('/').pop()); 
    if (currentIndex === 0 || currentIndex === 1) {
      if (currentIndex < videoList.length - 1) {
        const nextVideo = videoList[currentIndex + 1];
        handleSelectVideo(nextVideo);
      }
    } else if (currentIndex === 2) {
      handleSelectVideo(videoList[0]); 
    }
  };

  // Stop the loop when the stop button is clicked
  const handleStopLoop = () => {
    setStopLoop(true);
    if (videoRef.current) {
      videoRef.current.pause(); 
      videoRef.current.currentTime = 0; 
      socket.emit('stop_video_loop');  
    }
  };

  const handlePlay = () => {
    videoRef.current.play();
    const updatedState = { ...currentState, isPlaying: true, action: 'play' };
    setCurrentState(updatedState);
    socket.emit('play');
  };

  const handleSelectVideo = async (video) => {
    const isAdminLoggedIn = localStorage.getItem('token');
    if (!isAdminLoggedIn) {
      console.warn('Admin is logged out, video selection is disabled.');
      return;
    }
    setStopLoop(false); 
    const videoUrl = `${import.meta.env.VITE_BASE_URL}/videos/${video}`;
    const updatedState = {
      url: videoUrl,
      currentTime: 0,
      isPlaying: true, 
      isMuted: isMuted, 
      action: ['select', 'play'],
    };
    setSelectedVideo(videoUrl);
    setCurrentState(updatedState);
    setShowOverlay(video === videoList[1]); // Show overlay for the second video
    setCurrentMultiplier(1.0); // Reset multiplier for the new game
    setIsGameRunning(video === videoList[1]); // Set game running only for the second video

    socket.emit('admin_select_video', updatedState);
    socket.emit('video_change', { url: videoUrl, isPlaying: true });

    // Ensure video element is ready to load and play
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = videoUrl;
      videoRef.current.currentTime = 0; 
      videoRef.current.muted = isMuted; 
  
      try {
        await videoRef.current.play(); 
      } catch (error) {
        videoRef.current.muted = false; 
        try {
          await videoRef.current.play();
          console.log('Autoplay restriction resolved with muted playback.');
        } catch (err) {
          console.error('Autoplay retry failed:', err);
        }
      }
    }

      // Trigger startGame when the first video is selected
  if (video === videoList[1]) {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/game/start-game`, {
        coinReach: 0, // Optional: Pass specific coinReach value
      });
      console.log('Game started:', response.data);
      setIsGameRunning(true);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  }

    if (video === videoList[2]) {
      videoRef.current.onended = () => {
        console.log('Fly Away video ended. Resetting frontend state.');
        setCoinReach(''); 
        setIsGameRunning(false);
      };
    }
  };
  
  useEffect(() => {
    if (isGameRunning && showOverlay) {
      const handleMultiplierUpdate = (newMultiplier) => {
        console.log('Received multiplier:', newMultiplier); 
        setCurrentMultiplier(newMultiplier);
  
        if (coinReachList.length > 0 && newMultiplier >= coinReachList[0]) {
          const nextCoinReach = coinReachList[0];
          console.log('Triggering Fly Away for Coin Reach:', nextCoinReach);
          setCoinReachList((prevList) => prevList.slice(1));
          handleFlyAway(nextCoinReach);
        }
      };
      const handleSetCoinReach = (newCoinReach) => {
        console.log('Received coinReach from server:', newCoinReach);
        setCoinReach(newCoinReach);
        handleSelectVideo(videoList[2]);
      };
    
  
      socket.on('update_multiplier', handleMultiplierUpdate);
      socket.on('set_coin_reach', handleSetCoinReach);
      return () => {
        socket.off('update_multiplier', handleMultiplierUpdate);
        socket.off('set_coin_reach', handleSetCoinReach);
      };
    }
  }, [isGameRunning, showOverlay, coinReach, videoList]);
  

  useEffect(() => {
    socket.on('request_video_state', () => {
      if (videoRef.current) {
        const currentVideoState = {
          url: videoRef.current.src,
          currentTime: videoRef.current.currentTime,
        };
        socket.emit('admin_video_state', currentVideoState); // Emit state to the backend
      }
    });
  
    return () => {
      socket.off('request_video_state'); // Clean up event listener
    };
  }, []);

  const handleFlyAway = async () => {
    let currentCoinReach = coinReach;
  
    if (!coinReach) {
      // If no coinReach is set, use the current multiplier as the coinReach
      currentCoinReach = currentMultiplier;
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/game/fly-away`,{ currentMultiplier: currentCoinReach });
        console.log('Coin Reach set dynamically:', currentCoinReach);
        setCoinReach(currentCoinReach); // Update local coinReach state
      } catch (error) {
        console.error('Error setting dynamic Coin Reach:', error);
      }
    } else {
      try {
        const response = await axios.post( `${import.meta.env.VITE_BASE_URL}/api/game/set-coin-reach`, { coinReach: currentCoinReach });
        console.log('Fly Away triggered:', response.data);
      } catch (error) {
        console.error('Error triggering Fly Away:', error.message);
      }
    }
  
    // Proceed to play the video after the Fly Away logic
    handleSelectVideo(videoList[2]);
  };
  

  const handleStartGame = () => {
    axios
      .post(`${import.meta.env.VITE_BASE_URL}/api/game/set-coin-reach`, { coinReach })
      .then((response) => {
        console.log('Game started:', response.data);
      })
      .catch((error) => {
        console.error('Error starting the game:', error.message);
      });
  };
  
  return (
        <>
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Admin Controls</h1>
          <div className="flex items-center">
          <input
            type="number"
            placeholder="Enter Coin Reach"
            value={coinReach} 
            // onChange={(e) => setCoinReach(e.target.value)}
            className="text-black px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleStartGame}
            className="bg-blue-600 text-white px-4 py-2 rounded ml-2 hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isNaN(coinReach) || coinReach <= 0}
          >
            Add Value
          </button>
        </div>
          <div className="mb-4">
            <ul className="flex flex-row space-x-2">
              
                <li key={videoList[0]}>
                  <button
                   onClick={() => {
                    handleSelectVideo(videoList[0]);
                    handleStartGame();
                  }}
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedVideo === `http://localhost:5000/videos/${videoList[0]}`
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    } hover:bg-blue-500`}
                  >
                     Start Game
                  </button>
                </li>
                <li key={videoList[2]}>
                  <button
                    onClick={() => {
                      handleFlyAway();
                    }}
                    
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedVideo === `http://localhost:5000/videos/${videoList[2]}`
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    } hover:bg-blue-500`}
                  >
                    Fly Away
                  </button>
                </li>
            
            </ul>
          </div>
          {selectedVideo && (
        <div className="relative">
          <video
            ref={videoRef}
            src={selectedVideo}
            onEnded={handleVideoEnd}
            className="w-full"
            
          />
          {showOverlay && (
            <div className="absolute inset-0 bg-opacity-50 flex justify-center items-center">
              <span className="text-white text-4xl">{currentMultiplier.toFixed(1)}x</span>
            </div>
          )}
        </div>
      )}
          <div className="flex gap-4">
            <button onClick={handlePlay} className="bg-green-500 px-4 py-2 rounded hover:bg-green-600">
              Play
            </button>
            <button onClick={handleStopLoop} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Stop Game
        </button>
          </div>
        </>
  );
};

export default VideoPlayerAdmin;
