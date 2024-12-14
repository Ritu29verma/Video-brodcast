import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io.connect('http://localhost:5000');

const AdminVideo = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  useEffect(() => {
    // Request initial state from the server on component mount
    socket.emit('request_initial_state');

    // Listen for initial state from the server
    socket.on('initial_state', ({ currentTime, isPlaying, videoUrl }) => {
      setVideoUrl(videoUrl);
      setCurrentTimestamp(currentTime);
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

    // Listen for start stream event and update video URL
    socket.on('start_stream', (url) => {
      setVideoUrl(url); // Update the video URL dynamically
      if (videoRef.current) {
        videoRef.current.load(); // Ensure the video is reloaded with the new URL
        if (isPlaying) {
          videoRef.current.play().catch(console.error);
        }
      }
    });

    socket.on('admin_control', (action) => {
      if (videoRef.current) {
        switch (action) {
          case 'play':
            videoRef.current.play().catch(console.error);
            break;
          case 'pause':
            videoRef.current.pause();
            break;
          case 'mute':
            videoRef.current.muted = true;
            break;
          case 'unmute':
            videoRef.current.muted = false;
            break;
          case 'restart':
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(console.error);
            break;
          default:
            break;
        }
      }
    });


    return () => {
      socket.off('admin_control');
      socket.off('start_stream');
    };
  }, [videoUrl , isPlaying]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      socket.emit('admin_control', 'play');
    } else {
      console.error('Video element is not available.');
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      socket.emit('admin_control', 'pause');
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      socket.emit('admin_control', 'restart');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      // socket.emit('admin_control', isMuted ? 'unmute' : 'mute');
    }
  };

  // const handlePlay = () => {
  //   setIsPlaying(true);
  //   socket.emit('admin_control', 'play');
  // };

  // const handlePause = () => {
  //   setIsPlaying(false);
  //   socket.emit('admin_control', 'pause');
  // };

  // const handleRestart = () => {
  //   socket.emit('admin_control', 'restart');
  // };

  // const toggleMute = () => {
  //   setIsMuted(!isMuted);
  //   socket.emit('admin_control', isMuted ? 'unmute' : 'mute');
  // };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Admin Video Controls</h1>
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
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
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button
          onClick={handlePlay}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          disabled={isPlaying}
        >
          Play
        </button>
        <button
          onClick={handlePause}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          disabled={!isPlaying}
        >
          Pause
        </button>
        <button
          onClick={handleRestart}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
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
      </div>
    </div>
  );
};

export default AdminVideo;
