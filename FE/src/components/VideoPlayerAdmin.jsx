import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from "../components/socket";


const VideoPlayerAdmin = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [currentMultiplier, setCurrentMultiplier] = useState();
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentState, setCurrentState] = useState({
    url: null,
    isPlaying: false,
    currentTime: 0,
    isMuted: false, 
  });
  const [stopLoop, setStopLoop] = useState(false);
  const [videoList, setVideoList] = useState([]);


  const fetchVideoList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`);
      const data = await response.json();
      return data.videos; // Return the video list instead of setting state
    } catch (error) {
      console.error("Error fetching videos:", error);
      return []; 
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
    if (currentState.isPlaying && videoRef.current) {
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
  }, [socket]); 
  

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

  const handleStopLoop = () => {
    setStopLoop(true);
    if (videoRef.current) {
      videoRef.current.pause(); 
      videoRef.current.currentTime = 0; 
      socket.emit('stop_video_loop');  
    }
  };

  const handleSelectVideo = async (video) => {
    setStopLoop(false); 
    const videoUrl = `${import.meta.env.VITE_BASE_URL}/videos/${video}`;
    const updatedState = {
      url: videoUrl,
      currentTime: 0,
      isPlaying: true, 
      isMuted: isMuted, 
    };
    setSelectedVideo(videoUrl);
    setCurrentState(updatedState);
    setShowOverlay(video === videoList[1]); 
    setCurrentMultiplier(1.0); 
    console.log(videoUrl)
    socket.emit('video_change', { url: videoUrl, isPlaying: true });
    if (videoRef.current) {
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
    }};

  useEffect(() => {
    socket.on("update_multiplier", (multiplier) => {
      setCurrentMultiplier(multiplier); 
    });

    socket.on("play_3rd_video", async () => {
      console.log("Play 3rd video");
      const videos = await fetchVideoList();
      setVideoList(() => videos);
  
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
      socket.off("play_3rd_video");
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent page reload

    if (!isNaN(inputValue) && inputValue > 0) {
      const value = Number(inputValue);
      socket.emit("setvalue", value);
      console.log("CoinReach value emitted:", value);
      
      setInputValue(""); // Clear input after submission
    }
  };

  const isButtonEnabled = selectedVideo === `${import.meta.env.VITE_BASE_URL}/videos/${videoList[0]}`;

  const handleFlyAway = () => {socket.emit("flyaway");};
  
  return (
        <>
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Admin Controls</h1>
          <div className="flex items-center">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="number"
              placeholder="Enter Coin Reach"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="text-black px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded ml-2 hover:bg-blue-700 disabled:bg-gray-400"
              disabled={!isButtonEnabled}
            >
              Add Value
            </button>
    </form>
    </div>
          <div className="mb-4">
            <ul className="flex flex-row space-x-2">
              
                <li key={videoList[0]}>
                  <button
                   onClick={() => {
                    handleSelectVideo(videoList[0]);
                  }}
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedVideo === `${import.meta.env.VITE_BASE_URL}/videos/${videoList[0]}`
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
                      selectedVideo === `${import.meta.env.VITE_BASE_URL}/videos/${videoList[2]}`
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
              <span className="text-white font-bold text-5xl">{currentMultiplier.toFixed(1)}x</span>
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