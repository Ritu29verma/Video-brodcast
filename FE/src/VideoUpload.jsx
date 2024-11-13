import React, { useState } from 'react';
import axios from 'axios';

const VideoUpload = ({ setStreamingVideo }) => {
  const [videos, setVideos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setVideos((prevVideos) => [
        ...prevVideos,
        {
          videoUrl: response.data.videoUrl,
          thumbnailUrl: response.data.thumbnailUrl
        }
      ]);
      setUploadProgress(0); // Reset after upload
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  const handleStreamVideo = (videoUrl) => {
    setStreamingVideo(videoUrl); // Set the video URL to stream
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">Upload Video</h2>
      <input type="file" onChange={handleVideoUpload} className="mb-4" />
      {uploadProgress > 0 && (
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div
              style={{ width: `${uploadProgress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
            ></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {videos.map((video, index) => (
          <div key={index} className="relative group border border-gray-300 rounded shadow-lg overflow-hidden">
            <img src={video.thumbnailUrl} alt="Video Thumbnail" className="w-full h-auto" />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
              <button
                onClick={() => handleStreamVideo(video.videoUrl)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
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

export default VideoUpload;
