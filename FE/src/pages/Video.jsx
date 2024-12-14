import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';

const socket = io.connect('http://localhost:5000');

const Video = () => {
  const videoRef = useRef(null);
 

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

    // Sync playback for non-admin users
    socket.on('current_time', (timestamp) => {
      if (videoRef.current && !isAdmin && isPlaying) {
        videoRef.current.currentTime = timestamp;
      }
    });

    // Handle admin controls for all users
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

    // Handle streaming start
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
      socket.off('start_stream');
    };
  }, [isAdmin, isPlaying]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8 relative">
     

      {/* Video Section */}
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Live Video Stream</h1>
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 overflow-hidden relative">
        <video
          className="w-full h-auto max-w-[1280px] max-h-[720px] rounded-lg shadow-lg object-contain"
          ref={videoRef}
          controls={false}
          style={{ objectFit: 'contain', aspectRatio: '16/9' }}
        />
      </div>

      {/* Admin Controls */}
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
            onClick={() => navigate('/upload')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Upload Video
          </button>
          <button
            onClick={toggleMute}
            className={`${isMuted ? 'bg-gray-500' : 'bg-purple-500'} hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded`}
          >
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
