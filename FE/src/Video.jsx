import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Hls from 'hls.js';

const socket = io.connect('http://localhost:5000');

const Video = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const correctPassword = 'admin123';
  
  useEffect(() => {
    // Request initial state from the server on component mount
    socket.emit('request_initial_state');

    socket.on('initial_state', ({ currentTime, isPlaying }) => {
      if (videoRef.current) {
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

    socket.on('current_time', (timestamp) => {
      if (videoRef.current && !isAdmin && isPlaying) {
        videoRef.current.currentTime = timestamp;
      }
    });

    socket.on('admin_control', (action) => {
      if (videoRef.current) {
        if (action === 'play') {
          videoRef.current.play().catch(console.error);
          setIsPlaying(true);
        } else if (action === 'pause') {
          videoRef.current.pause();
          setIsPlaying(false);
        } else if (action === 'restart') {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }
    });

       socket.on('start_stream', (videoUrl) => {
      if (Hls.isSupported() && videoRef.current) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          videoRef.current.play().catch((error) => console.error('Error playing stream:', error));
          setIsPlaying(true);
        });
      } else if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.play().catch((error) => console.error('Error playing video:', error));
        setIsPlaying(true);
      }
    });

    return () => {
      socket.off('initial_state');
      socket.off('current_time');
      socket.off('admin_control');
    };
  }, [isAdmin]);

  const handleAdminLogin = () => {
    if (password === correctPassword) {
      setIsAdmin(true);
      setShowAdminPrompt(false);
      socket.emit('admin_logged_in');
    } else {
      alert('Incorrect password!');
    }
  };

  const handlePlay = () => {
    videoRef.current.play().catch(console.error);
    setIsPlaying(true);
    socket.emit('admin_control', 'play');
  };

  const handlePause = () => {
    videoRef.current.pause();
    setIsPlaying(false);
    socket.emit('admin_control', 'pause');
  };

  const handleRestart = () => {
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(console.error);
    setIsPlaying(true);
    socket.emit('admin_control', 'restart');
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8 relative">
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

      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Live Video Stream</h1>

      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 overflow-hidden relative">
        <video
          className="w-full h-auto max-w-[1280px] max-h-[720px] rounded-lg shadow-lg object-contain"
          ref={videoRef}
          controls={false}
          style={{ objectFit: 'contain', aspectRatio: '16/9' }}
        >
          <source src="http://localhost:5000/videos/my-video2.mp4" type="video/mp4" />
        </video>
      </div>

      {isAdmin && (
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button onClick={handlePlay} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Play
          </button>
          <button onClick={handlePause} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
            Pause
          </button>
          <button onClick={handleRestart} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Restart
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Upload Video
          </button>
          <button onClick={toggleMute} className={`${isMuted ? 'bg-gray-500' : 'bg-purple-500'} hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded`}>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={() => setIsAdmin(false)} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Video;
