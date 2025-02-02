import React, { useState, useEffect } from "react";
import VideoPlayer from "../components/VideoPlayer";
import socket from "../components/socket";
import AdminRanges from "../components/AdminRange";
import AdminNav from "../components/AdminNav";

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
      <div className="min-h-screen md:h-full bg-gray-900 text-white">
        <AdminNav className="h-[60px]" />
  
        {/* Main Container */}
        <div className="flex overflow-hidden md:flex-row flex-col w-full p-4 space-y-6 md:space-y-0 md:space-x-6">
  
          {/* First Row: Coin Input and Ranges */}
          <div className="w-full md:w-1/2 bg-[#0b0823]  sm:p-6 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="relative w-full group">
         <input
          type="number"
          id="coinReach"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="peer w-full p-3 text-white bg-transparent border border-gray-400 rounded-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition duration-150
           [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-moz-appearance:textfield]"
          required
         />
         <label
         htmlFor="coinReach"
         className={`absolute left-3 px-1 bg-[#0b0823] text-gray-400 text-sm transition-all duration-150 
                     ${inputValue ? "top-[-8px] text-white text-sm" : "top-3 group-hover:top-[-8px] group-hover:text-white"}`}
                   >
            Enter Coin Reach
         </label>
        </div>

            <button
              type="submit"
              className="bg-blue-600 text-white m-1 p-1 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition"
              disabled={!isButtonEnabled}
            >
              Add Value
            </button>
          </form>
            <AdminRanges />
          </div>
  
          {/* Second Row: Video Player */}
          <div className="w-full h-full md:h-3/4 md:w-1/2 flex flex-col items-center">
          <div className="w-full h-full bg-black p-4 sm:p-6 rounded-lg shadow-lg flex flex-col items-center">
          <VideoPlayer />
          </div>
          <button
          onClick={handleFlyAway}
          className="mt-4 sm:mt-6 bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          disabled={!isFlyButtonEnabled}
          >
         Fly Away
         </button>
         </div>
         </div>
         </div>
    );
  };
  
  export default FinalAdmin;
  