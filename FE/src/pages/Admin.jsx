import React, { useEffect, useState } from 'react';
import VideoPlayerAdmin from '../components/VideoPlayerAdmin';
import socket from "../components/socket";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [videoList, setVideoList] = useState([]);
  const navigate = useNavigate();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`)
      .then((response) => response.json())
      .then((data) => setVideoList(data.videos))
      .catch((error) => console.error('Error fetching videos:', error));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    socket.emit('admin_logout');
    navigate("/login");
    resetVideoState();
  };

  return (
    <div className="shadow-lg hover:bg-[#021024] flex flex-col items-center min-h-screen justify-center bg-gray-900 text-white p-6">
    {/* Overlay for Start Screen */}
    {!hasInteracted && (
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50"
        onClick={() => setHasInteracted(true)}
      >
        <h1 className="text-3xl font-bold text-center text-blue-400 animate-pulse">
          Click Anywhere or Press any Key to Start the Admin Panel
        </h1>
      </div>
    )}

    {/* Main Content */}
    <div className="absolute top-4 right-4">
      <button
        onClick={handleLogout}
        className="bg-cyan-600 text-white hover:bg-white hover:text-cyan-600 transform transition-transform hover:scale-95 font-bold px-4 py-1 rounded"
      >
        Logout
      </button>
    </div>
    <VideoPlayerAdmin videoList={videoList} />
  </div>
  );
};

export default Admin;
