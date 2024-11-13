import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client'; 
import Hls from 'hls.js';

const socket = io.connect('http://localhost:5000');

const VideoUploadAndStream = ({ setStreamingVideo }) => {
  const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [progress, setProgress] = useState(0); // Progress state for the progress bar
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('start_stream', (url) => {
      setStreamingVideo(url); // Set the streaming URL from server broadcast
    });
  
    return () => socket.off('start_stream'); // Cleanup listener on unmount
  }, []);

  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setProgress(0); // Reset progress on new file selection
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
    // Update the uploadedVideos state with both videoUrl and thumbnailUrl
    setUploadedVideos((prev) => [
        ...prev,
        {
          videoUrl: response.data.videoUrl,
          thumbnailUrl: response.data.thumbnailUrl
        }
      ]);
      setFile(null);
      setProgress(0); // Reset progress after successful upload
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleStreamVideo = (videoUrl) => {
    setStreamingVideo(videoUrl);
    socket.emit('start_stream', videoUrl);
    navigate('/');
  };

//   const handleSaveVideo = (videoUrl) => {
//     fetch('http://localhost:5000/admin/save-video', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ videoUrl }),
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         alert(data.message);
//       })
//       .catch((error) => console.error('Error saving video', error));
//   };

const handleSaveVideo = (videoUrl) => {
    // Extract video name from URL or generate it dynamically (you may need to modify this)
    const videoName = videoUrl.split('/').pop(); // Assuming the name is the last part of the URL
  
    fetch('http://localhost:5000/admin/save-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: videoName,    // Name of the video
        path: videoUrl,     // Path/URL to the video
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
      })
      .catch((error) => console.error('Error saving video', error));
  };

  
  const handleDeleteVideo = (videoUrl) => {
    fetch('http://localhost:5000/admin/delete-video', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        setUploadedVideos(uploadedVideos.filter((url) => url !== videoUrl));  // Remove deleted video from the list
      })
      .catch((error) => console.error('Error deleting video', error));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-semibold mb-6 text-center text-blue-600">Video Upload & Streaming</h2>

      {/* Upload Form */}
      <div className="mb-6 text-center">
        <form onSubmit={handleUpload} className="inline-flex flex-col items-center">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="p-2 border rounded mb-2"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-200 ease-in-out"
          >
            Upload Video
          </button>

          {progress > 0 && (
            <div className="w-full bg-gray-300 rounded-full h-2.5 mt-4 max-w-xs">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </form>
      </div>

      {/* Uploaded Videos Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {uploadedVideos.map((video, index) => (
          <div
            key={index}
            className="relative group rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-white"
          >
            <img
              src={video.thumbnailUrl} // Use the actual thumbnail generated by ffmpeg
              alt={`Video ${index + 1}`}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <button
                onClick={() => handleStreamVideo(video.videoUrl)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
              >
                Stream Video
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Video Player */}
      {selectedVideo && (
        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold mb-4 text-blue-600">Currently Streaming Video</h3>
          <video ref={videoRef} controls className="w-full max-w-lg mx-auto rounded shadow-lg" src={selectedVideo}>
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoUploadAndStream;
