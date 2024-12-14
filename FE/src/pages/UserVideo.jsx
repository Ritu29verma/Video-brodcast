import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Navigate, useNavigate } from 'react-router-dom';

const socket = io.connect('http://localhost:5000');

const UserVideo = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const correctPassword = 'admin123';
  const [videoUrl, setVideoUrl] = useState(''); 
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Request initial state from the server on component mount
    socket.emit('request_initial_state');

    // Receive initial state from the server (video status and timestamp)
    socket.on('initial_state', ({ currentTime, isPlaying, videoUrl }) => {
      setVideoUrl(videoUrl);
      setCurrentTimestamp(currentTime);

      if (videoRef.current) {
        videoRef.current.src = videoUrl; // Set video source dynamically
        videoRef.current.currentTime = currentTime;
        if (isPlaying) {
          videoRef.current.play().catch(console.error);
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    });

     // Update video timestamp periodically from server
     socket.on('current_time', (timestamp) => {
        if (videoRef.current) {
          const delta = Math.abs(videoRef.current.currentTime - timestamp);
          if (delta > 0.5) {
            videoRef.current.currentTime = timestamp; // Adjust the timestamp if drift is detected
          }
        }
      });
  

   // Receive start stream event with a new video URL
   socket.on('start_stream', (url) => {
    setVideoUrl(url);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load(); // Load the new video
      videoRef.current.play().catch(console.error); // Play immediately
      setIsPlaying(true);
    }
  });

   // Receive play/pause commands from admin
   socket.on('admin_control', (action) => {
    if (videoRef.current) {
      if (action === 'play') {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else if (action === 'pause') {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  });

    // Cleanup on component unmount
    return () => {
      socket.off('initial_state');
      socket.off('current_time');
      socket.off('start_stream');
      socket.off('admin_control');
    };
  }, [isPlaying]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleAdminLogin = () => {
    if (password === correctPassword) {
      setIsAdmin(true);
      setShowAdminPrompt(false);
      socket.emit('admin_logged_in'); // Notify the server that the admin logged in
      navigate("/admin"); // Navigate to admin dashboard
    } else {
      alert('Incorrect password!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Live Video Stream</h1>
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        {/* Admin Login Button */}
        {!isAdmin && (
          <button
            onClick={() => setShowAdminPrompt(true)}
            className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 z-10"
          >
            Admin
          </button>
        )}

        {/* Admin Login Prompt */}
        {showAdminPrompt && !isAdmin && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="bg-white p-6 rounded-lg w-11/12 sm:w-96 shadow-lg">
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

        {/* Video Player */}
        {videoUrl ? (
          <video
            className="w-full h-auto max-w-[1280px] max-h-[720px] rounded-lg shadow-lg object-contain"
            ref={videoRef}
            controls={false} // Disable default controls to use custom controls
            autoPlay
            style={{ objectFit: 'contain', aspectRatio: '16/9' }}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p className="text-gray-500">No video is currently streaming.</p>
        )}
      </div>

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className={`${isMuted ? 'bg-gray-500' : 'bg-purple-500'} hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded mt-6`}
      >
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
};

export default UserVideo;
