import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from "../components/socket";


const VideoPlayerAdmin = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const [coinReach, setCoinReach] = useState(null);
  const [inputValue, setInputValue] = useState("");
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
  const [videoList, setVideoList] = useState([]);

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

  const fetchVideoList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`);
      const data = await response.json();
      return data.videos; // Return the video list instead of setting state
    } catch (error) {
      console.error("Error fetching videos:", error);
      return []; // Return an empty array on error
    }
  };
  
  useEffect(() => {
    const loadVideos = async () => {
      const videos = await fetchVideoList();
      setVideoList(videos);
      console.log(videoList); // Log the fetched videos
    };
  
    loadVideos();
  }, []);
  
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
    setShowOverlay(video === videoList[1]); 
    setCurrentMultiplier(1.0); 
    setIsGameRunning(video === videoList[1]); 
    console.log(videoUrl)
    socket.emit('admin_select_video', updatedState);
    socket.emit('video_change', { url: videoUrl, isPlaying: true });

 
    if (videoRef.current) {
      // videoRef.current.pause();
      videoRef.current.src = videoUrl;
      videoRef.current.currentTime = 0; 
      videoRef.current.muted = true; 
  
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

    if (video === videoList[1]) {
      socket.emit("start_multiplier"); // Emit to start multiplier
    }

    if (video === videoList[0]) {
      socket.emit("reset_game"); // Emit to reset the game
    }
  
  };

  useEffect(() => {

    socket.on("update_multiplier", (multiplier) => {
      console.log("Multiplier updated:", multiplier);
      setCurrentMultiplier(multiplier); 
    });

    socket.on("play_3rd_video", async () => {
      console.log("Play 3rd video");
  
      // Fetch video list and wait for it to complete
      const videos = await fetchVideoList();
      setVideoList(videos);
  
      // Ensure handleSelectVideo runs after videoList is updated
      if (videos.length > 2) {
        console.log(videos[2]); // Debugging: Check if index 2 exists
        handleSelectVideo(videos[2]); 
      } else {
        console.warn("Not enough videos in the list!");
      }
    });
  
  
    return () => {
      socket.off("update_multiplier");
      socket.off("update_coinList");
      socket.off("play_3rd_video");
    };
  }, []);

  const handleStartGame = () => {
    if (!isNaN(inputValue) && inputValue > 0) {
      const value = Number(inputValue); 
      setCoinReach(value); 
      socket.emit("setvalue", value); 
      console.log("CoinReach value emitted:", value);
    }
  };

  // useEffect(() => {
  //  socket.on('video_3', (data) => { setVideo(data); });
  //   return () => { socket.off('video_3'); }; }, [socket]);

  const handleFlyAway = () => {
      socket.emit("flyaway");
  };
  
  
  return (
        <>
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Admin Controls</h1>
          <div className="flex items-center">
      <input
        type="number"
        placeholder="Enter Coin Reach"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)} 
        className="text-black px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleStartGame} 
        className="bg-blue-600 text-white px-4 py-2 rounded ml-2 hover:bg-blue-700 disabled:bg-gray-400"
        disabled={isNaN(inputValue) || inputValue <= 0}
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
          
            <button onClick={handleStopLoop} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Stop Game
        </button>
          </div>
        </>
  );
};

export default VideoPlayerAdmin;
