import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:5000');

const Video = () => {
  const videoRef = useRef(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const correctPassword = 'admin123';

  useEffect(() => {
    // Sync video timestamp and play/pause/restart actions
    socket.on('current_time', (timestamp) => {
      setCurrentTimestamp(timestamp);
      if (videoRef.current && isPlaying) {
        videoRef.current.currentTime = timestamp;
      }
    });

    socket.on('admin_control', (action) => {
      if (videoRef.current) {
        if (action === 'play') {
          videoRef.current.play().catch((error) => console.error('Error playing video:', error));
          setIsPlaying(true);
        } else if (action === 'pause') {
          videoRef.current.pause();
          setIsPlaying(false);
        } else if (action === 'restart') {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch((error) => console.error('Error restarting video:', error));
          setIsPlaying(true);
        }
      }
    });

    socket.on('admin_logged_in', () => {
      setShowAdminPrompt(false); // Remove admin login prompt from other users' screens
    });

    return () => {
      socket.off('current_time');
      socket.off('admin_control');
      socket.off('admin_logged_in');
    };
  }, [isPlaying]);

  const handleAdminLogin = () => {
    if (password === correctPassword) {
      setIsAdmin(true);
      setShowAdminPrompt(false);
      socket.emit('admin_logged_in'); // Notify all clients that admin has logged in
    } else {
      alert('Incorrect password!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white relative">
      {!isAdmin && (
        <button
          onClick={() => setShowAdminPrompt(true)}
          className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 z-10"
        >
          Admin
        </button>
      )}

      {showAdminPrompt && !isAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Login</h2>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-4 text-black border rounded-lg border-gray-300"
            />
            <button
              onClick={handleAdminLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Live Video Stream</h1>
      <div className="w-full max-w-2xl p-4 bg-gray-800 rounded-lg shadow-lg relative">
        <video
          className="w-full h-auto rounded-lg shadow-lg overflow-hidden"
          ref={videoRef}
          controls={false} // Hide native controls
          muted // Mute video for autoplay
        >
          <source src="http://localhost:5000/videos/my-video.mp4" type="video/mp4" />
        </video>
        <p className="mt-4 text-center text-gray-400">
          Current Timestamp: {Math.floor(currentTimestamp)} seconds
        </p>
      </div>

      {isAdmin && (
        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => socket.emit('admin_control', 'play')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Play
          </button>
          <button
            onClick={() => socket.emit('admin_control', 'pause')}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            Pause
          </button>
          <button
            onClick={() => socket.emit('admin_control', 'restart')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Restart
          </button>
          <button
            onClick={() => setIsAdmin(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Video;
