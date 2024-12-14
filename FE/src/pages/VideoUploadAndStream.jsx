import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:5000');

const VideoUploadAndStream = ({ setStreamingVideo }) => {
  const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [progress, setProgress] = useState(0); // Progress state for the progress bar
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/saved-videos');
        console.log(response.data); // Check if response.data is an array
        setUploadedVideos(response.data.videos || []); // Ensure it's an array
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos();



    socket.on('start_stream', (url) => {
      setStreamingVideo(url); // Set the streaming URL from server broadcast
    });

    return () => socket.off('start_stream'); // Cleanup listener on unmount
  }, [setStreamingVideo]);

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
      const response = await axios.post('http://localhost:5000/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      setUploadedVideos((prev) => [
        ...prev,
        {
          videoUrl: response.data.videoUrl,
          thumbnailUrl: response.data.thumbnailUrl,
        },
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
    navigate('/admin');
  };

  const handleSaveVideo = (videoUrl) => {
    const videoName = videoUrl.split('/').pop(); // Extract video name from URL

    fetch('http://localhost:5000/admin/save-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: videoName,
        path: videoUrl,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
      })
      .catch((error) => console.error('Error saving video:', error));
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
        setUploadedVideos((prev) => prev.filter((video) => video.videoUrl !== videoUrl)); // Remove deleted video from the list
      })
      .catch((error) => console.error('Error deleting video:', error));
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
              src={video.thumbnailUrl}
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
    </div>
  );
};

export default VideoUploadAndStream;
