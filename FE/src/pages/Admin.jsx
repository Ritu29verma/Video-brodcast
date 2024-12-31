import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Admin = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const [currentState, setCurrentState] = useState({
    url: null,
    isPlaying: false,
    currentTime: 0,
    isMuted: false,
    action: null,
  });

  useEffect(() => {
    // Fetch the list of available videos from the server
    fetch('http://localhost:5000/videos-list')
      .then((response) => response.json())
      .then((data) => setVideoList(data.videos))
      .catch((error) => console.error('Error fetching videos:', error));
  }, []);

  

  // Emit the current video state every millisecond while playing
  useEffect(() => {
    let interval = null;
    if (currentState.isPlaying && videoRef.current) {
      interval = setInterval(() => {
        const updatedState = {
          ...currentState,
          currentTime: videoRef.current.currentTime,
        };
        socket.emit('admin_control', updatedState);
      }, 100); // Emit every millisecond
    }
    return () => clearInterval(interval);
  }, [currentState.isPlaying, currentState.url]);

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleSelectVideo = (video) => {
    // Create the video URL from the selected video name
    const videoUrl = `http://localhost:5000/videos/${video}`;
  
    // Set the selected video state
    setSelectedVideo(videoUrl);
  
    // Prepare the updated state for the new video
    const updatedState = {
      url: videoUrl,
      currentTime: 0,  // You can adjust this if needed (e.g., preserve the last known time)
      isPlaying: false,  // Initially stop the video (it will start playing after receiving the play command)
      isMuted: isMuted,  // Keep the current mute state
      action: 'select'   // Indicate the action being performed
    };
  
    // Set the current state for UI or further use
    setCurrentState(updatedState);
  
    // Emit the updated state to the server to notify all clients
    socket.emit('admin_select_video', updatedState);
  };
  

  const handlePlay = () => {
    videoRef.current.play();
    const updatedState = { ...currentState, isPlaying: true, action: 'play' };
    setCurrentState(updatedState);
    socket.emit('play');
  };

  const handlePause = () => {
    videoRef.current.pause();
    const updatedState = { ...currentState, isPlaying: false, action: 'pause', currentTime: videoRef.current.currentTime };
    setCurrentState(updatedState);
    socket.emit('pause');
  };

  const handleRestart = () => {
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    const updatedState = { ...currentState, isPlaying: true, action: 'restart', currentTime: 0 };
    setCurrentState(updatedState);
    socket.emit('restart');
  };

  const toggleMute = () => {
    const muted = !isMuted;
    setIsMuted(muted);
    videoRef.current.muted = muted;
    const updatedState = { ...currentState, isMuted: muted, action: 'mute' };
    setCurrentState(updatedState);
    socket.emit('admin_control', updatedState);
  };

  return (
    <div className="shadow-lg hover:bg-[#021024] flex flex-col items-center min-h-screen justify-center bg-gray-900 text-white p-6">
      {!isAuthenticated ? (
      <div className='bg-gray-800 p-1'>
         <div className='bg-gray-900 p-3 rounded-lg'>
         <div className="bg-gray-800 p-10 rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
          <div className="relative w-full mb-6">
  {/* Input Field */}
  <input
    type="password"
    placeholder=" "
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="peer w-full p-3 text-white bg-transparent border border-gray-400 rounded-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition duration-150"
    id="password"
    required
  />

  {/* Label */}
  <label
    htmlFor="password"
    className="absolute left-3 top-3 text-gray-400 text-sm transition-all duration-150 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-8px] peer-focus:text-sm peer-focus:text-white bg-gray-800 px-1"
  >
    Enter Password
  </label>
</div>

         <div className='flex flex-col items-center '> 
         <button
  onClick={handleLogin}
  className="
    px-9 py-2 rounded 
    text-lg
  text-black 
  bg-cyan-500 
  border border-cyan-500 
  shadow-[0_0_5px_cyan,0_0_25px_cyan] 
  transition-all duration-300 
  hover:shadow-[0_0_5px_cyan,0_0_25px_cyan,0_0_50px_cyan,0_0_100px_cyan,0_0_200px_cyan]
  "
  disabled={false} // Set to true to test the disabled state
>
  Login
</button>

         </div>
        </div>
       </div>
      </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Admin Controls</h1>
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
                    {video}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {selectedVideo && (
            <video
              ref={videoRef}
              src={selectedVideo}
              controls={false}
              className="w-full max-w-3xl mb-6 rounded shadow-lg"
            />
          )}
          <div className="flex gap-4">
            <button onClick={handlePlay} className="bg-green-500 px-4 py-2 rounded hover:bg-green-600">
              Play
            </button>
            <button onClick={handlePause} className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600">
              Pause
            </button>
            <button onClick={handleRestart} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">
              Restart
            </button>
            {/* <button
              onClick={toggleMute}
              className={`${
                isMuted ? 'bg-gray-500' : 'bg-purple-500'
              } px-4 py-2 rounded hover:bg-purple-600`}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button> */}
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;
