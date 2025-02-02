import React, { useState, useEffect } from "react";
import VideoPlayer from "../components/VideoPlayer";
import socket from "../components/socket";
import AdminRanges from "../components/AdminRange";

const FinalAdmin = () => {
  const [inputValue, setInputValue] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoList, setVideoList] = useState([]);

  const fetchVideoList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`);
      const data = await response.json();
      return data.videos;
    } catch (error) {
      console.error("Error fetching videos:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadVideos = async () => {
      const videos = await fetchVideoList();
      setVideoList(videos);
    };

    loadVideos();
    socket.on("fetch_current_state", (state) => {
      if (state && state.url) {
        setSelectedVideo(state.url);
        console.log("Initial video state set:", state.url);
      }
    });

    socket.on("video_change", (state) => {
      if (state && state.url) {
        setSelectedVideo(state.url);
        console.log("Video changed to:", state.url);
      }
    });

    return () => {
      socket.off("fetch_current_state");
      socket.off("video_change");
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isNaN(inputValue) && inputValue > 0) {
      const value = Number(inputValue);
      socket.emit("setvalue", value);
      console.log("CoinReach value emitted:", value);
      setInputValue("");
    }
  };

  const handleFlyAway = () => {
    socket.emit("flyaway");
  };
  const isFlyButtonEnabled = selectedVideo === `${import.meta.env.VITE_BASE_URL}/videos/Middle_second.mp4`;
  const isButtonEnabled = selectedVideo === `${import.meta.env.VITE_BASE_URL}/videos/Begin.mp4`;

  return (
    <div className="flex flex-col items-center p-4 space-y-4 bg-gray-800 text-white min-h-screen">
      

      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="number"
          placeholder="Enter Coin Reach"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="text-black px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded ml-2 hover:bg-blue-700 disabled:bg-gray-400"
          disabled={!isButtonEnabled}
        >
          Add Value
        </button>
      </form>

      <AdminRanges />
      <button
        onClick={handleFlyAway}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 w-48 disabled:bg-gray-400"
        disabled={!isFlyButtonEnabled}
      >
        Fly Away
      </button>

      <div className="w-full max-w-3xl mb-6">
        <VideoPlayer />
      </div>
    </div>
  );
};

export default FinalAdmin;