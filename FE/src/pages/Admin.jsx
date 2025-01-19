import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from "../components/socket";

const Admin = () => {
  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  const [coinReach, setCoinReach] = useState(null); 
  const [currentMultiplier, setCurrentMultiplier] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isVideoPrepared, setIsVideoPrepared] = useState(false);
  const [currentState, setCurrentState] = useState({
    url: null,
    isPlaying: false,
    currentTime: 0,
    isMuted: false,
    action: null,
  });
  const navigate = useNavigate();
  const [stopLoop, setStopLoop] = useState(false);
  const [isCoinReachSet, setIsCoinReachSet] = useState(false);


  const handleLogout = () => {
    localStorage.removeItem("token");
    socket.emit('admin_logout');
    navigate("/login");
    resetVideoState();
  };

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
  
// Fetch the list of available videos from the server
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`)
      .then((response) => response.json())
      .then((data) => setVideoList(data.videos))
      .catch((error) => console.error('Error fetching videos:', error));
  }, []);

  useEffect(() => {
    if (localStorage.getItem('token') && currentState.isPlaying && videoRef.current) {
      const interval = setInterval(() => {
        const updatedState = {
          ...currentState,
          currentTime: videoRef.current.currentTime,
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
    socket.emit('admin_select_video', updatedState);
  
    // Ensure video element is ready to load and play
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = videoUrl;
      videoRef.current.currentTime = 0; 
      videoRef.current.muted = isMuted; 
  
      try {
        // Load and play the video
        videoRef.current.load(); 
        await videoRef.current.play(); 
        console.log('Video started playing successfully.');
      } catch (error) {
        console.error('Error starting video playback:', error);
        videoRef.current.muted = true; 
        try {
          await videoRef.current.play();
          console.log('Autoplay restriction resolved with muted playback.');
        } catch (err) {
          console.error('Autoplay retry failed:', err);
        }
      }
    }

     videoRef.current.onended = () => {
      console.log('Video ended.');
      if (video === videoList[2]) {
        console.log('Third video ended. Resetting coinReach to 0 (only in FE).');
        setCoinReach(0); // Reset coinReach only in the front-end
      }
    };

    if (video === videoList[2] && !isCoinReachSet) {
        axios.post(`${import.meta.env.VITE_BASE_URL}/api/game/set-coin-reach`, {
          coinReach: currentMultiplier,
        })
        .then(response => {
          console.log('Stored currentMultiplier as coinReach:', response.data);
          setCoinReach(currentMultiplier);
        })
        .catch(error => {
          console.error('Error storing coin reach:', error.message);
        });
      }
      // Emit video change event
      socket.emit('video_change', { url: `${import.meta.env.VITE_BASE_URL}/videos/${video}`, isPlaying: true });
      setSelectedVideo(`${import.meta.env.VITE_BASE_URL}/videos/${video}`);
    
  };
  
  useEffect(() => {
    if (selectedVideo ===  `${import.meta.env.VITE_BASE_URL}/videos/${videoList[0]}`) {
      setShowOverlay(false);
      socket.emit('hide_overlay'); }
      if (selectedVideo ===  `${import.meta.env.VITE_BASE_URL}/videos/${videoList[2]}`) {
        setShowOverlay(false);
        socket.emit('hide_overlay'); }
    if (selectedVideo ===  `${import.meta.env.VITE_BASE_URL}/videos/${videoList[1]}`) {
      setShowOverlay(true);
      socket.emit('show_overlay'); 
      setCurrentMultiplier(1);
      const interval = setInterval(() => {
        setCurrentMultiplier(prev => {
          const newMultiplier = prev + parseFloat((Math.random() * 0.4 + 0.1).toFixed(1));
          socket.emit('update_multiplier', newMultiplier);
          if (coinReach !== null && newMultiplier >= coinReach) {
            clearInterval(interval);
            setShowOverlay(false);
            socket.emit('hide_overlay');
            handleSelectVideo(videoList[2]);
          }
          return newMultiplier;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedVideo, coinReach, videoList]);

  const handleCoinReach = async () => {
    try {
      if (coinReach === null) {
        // If coinReach is not set, save it in the database
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/game/set-coin-reach`, {
          coinReach: currentMultiplier,
        });
        console.log('CoinReach stored:', response.data);
        setCoinReach(currentMultiplier); // Set coinReach after saving to DB
        handleSelectVideo(videoList[2]); // Proceed to third video immediately
      } else {
        // If coinReach is set, just navigate to third video
        handleSelectVideo(videoList[2]);
      }
    } catch (error) {
      console.error('Error setting coinReach:', error.message);
    }
  };

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


  return (
    <div className="shadow-lg hover:bg-[#021024] flex flex-col items-center min-h-screen justify-center bg-gray-900 text-white p-6">
        <>
       <div className='absolute top-4 right-4'>
       <button onClick={handleLogout} className="bg-cyan-600 text-white hover:bg-white hover:text-cyan-600 transform transition-transform hover:scale-95 font-bold px-4 py-1 rounded">
            Logout
          </button>
       </div>
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Admin Controls</h1>
          <div className="mb-4">
        <label className="text-xl font-semibold mb-2 block">Set Coin Reach Value:</label>
        <input
          type="number"
          value={coinReach}
          onChange={(e) => setCoinReach(parseFloat(e.target.value)) || 0}
          className="text-black px-2 py-1 rounded"
        />
        <button onClick={handleCoinReach} className="bg-blue-600 text-white px-4 py-2 rounded ml-2"
        disabled={isNaN(coinReach) || coinReach <= 0}>
          Set Value
        </button>
      </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Select a Video:</h2>
            <ul className="space-y-2">
              {videoList.map((video) => (
                <li key={video}>
                  <button
                    onClick={() => handleSelectVideo(video)}
                    
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedVideo === `http://localhost:5000/videos/${video}`
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    } hover:bg-blue-500`}
                  >
                     Play {video}
                  </button>
                </li>
              ))}
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
    </div>
  );
};

export default Admin;
