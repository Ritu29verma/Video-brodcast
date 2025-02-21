import React, { useState,useRef, useEffect } from "react";
import VideoPlayer from "../components/VideoPlayer";
import socket from "../components/socket";
import AdminRanges from "../components/AdminRange";
import AdminNav from "../components/AdminNav";
import AdminTabSection from "../components/AdminTabSection";

const FinalAdmin = () => {
  const [inputValue, setInputValue] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [gameId, setGameId] = useState(() => sessionStorage.getItem("gameId") || "N/A");
  const [users, setUsers] =useState(0)
  const [stats, setStats] = useState({
    InGameAmount: 0,
    Cashouts: 0,
    ProfitOrLoss: 0,
  });
  const [hasInteracted, setHasInteracted] = useState(false);
  const overlayRef = useRef(null);
  useEffect(() => {
    socket.on("gameId", (newGameId) => {
      console.log("Received gameId:", newGameId);
      setGameId(newGameId);
      sessionStorage.setItem("gameId", newGameId); 
    });

    return () => {
      socket.off("gameId"); 
    };
  }, []);
  
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
    socket.on("activeClientsCount",(activeClientsCount) =>{
      console.log("users:", activeClientsCount);
      setUsers(activeClientsCount);
    })
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
    socket.on("stats", (newStats) => {
      console.log("Received stats:", newStats);
      setStats({
        InGameAmount: newStats.totalInGame,
        Cashouts: newStats.cashout,
        ProfitOrLoss: newStats.profitLoss,
      });
    });

    return () => {
      socket.off("activeClientsCount");
      socket.off("fetch_current_state");
      socket.off("video_change");
      socket.off("stats");
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

  const handleInteraction = () => {
    setHasInteracted(true);
  }
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus(); // Ensure the div gets focus
    }
  }, []);

  if (!hasInteracted) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 text-white text-3xl font-bold tracking-wide"
        onClick={handleInteraction}
        onKeyDown={(e) => {
          console.log("Key Pressed:", e.key); // Debugging
          handleInteraction();
        }}
        tabIndex={0}
      >
        <h1 className="text-2xl font-bold animate-pulse">Click or Press Any Key to Start</h1>
      </div>
    );
  }

    return (
      <div className="min-h-screen md:h-full bg-gray-900 text-white">
        <AdminNav className="h-[60px]" />
  
        {/* Main Container */}
        <div className="flex overflow-hidden md:flex-row flex-col w-full p-4 space-y-6 md:space-y-0 md:space-x-2">
  
          {/* First Row: Coin Input and Ranges */}
          <div className="w-full md:w-1/2 bg-[#0b0823] p-4 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="flex items-center space-x-1">
          <div className="relative w-full group">
         <input
          type="number"
          id="coinReach"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="peer w-full p-2 text-white bg-transparent border border-gray-400 rounded-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition duration-150
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
              className="bg-blue-600 text-white text-sm m-1 p-1 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition"
              disabled={!isButtonEnabled}
            >
              Add Value
            </button>
          </form>
          <div className="">
          {/* <AdminRanges />
           */}
          <AdminTabSection/>
        </div>
          </div>
  
          {/* Second Row: Video Player */}
          <div className="w-full h-full md:h-3/4 md:w-1/2 flex flex-col items-center">
          <div className="flex flex-row gap-4 justify-center">
          <div className="flex justify-center bg-gray-800 rounded-md p-2 mb-4">
            <span className="text-yellow-400 text-sm sm:text-base">Game ID: {gameId} </span>
          </div>
          <button
          onClick={handleFlyAway}
          className=" bg-blue-600 text-white px-8 p-2 mb-4 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          disabled={!isFlyButtonEnabled}
          >
         Fly Away
         </button>
         <div className="flex justify-center bg-gray-800 rounded-md p-2 mb-4">
            <span className="text-yellow-400 text-sm sm:text-base">Users: {users} </span>
          </div>
         </div>
          <div className="w-full h-full bg-black p-4 sm:p-6 rounded-lg shadow-lg flex flex-col items-center">
          <VideoPlayer />
          </div>
           {/* Game Stats Section */}
           <div className="grid grid-cols-3 gap-4 mt-6 w-full px-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md flex flex-col items-center">
              <span className="text-sm sm:text-base">In-Game Amount</span>
              <span className="text-lg sm:text-xl font-bold">₹{stats.InGameAmount}</span>
            </div>

            <div className="bg-green-600 text-white p-2 rounded-lg shadow-md flex flex-col items-center">
              <span className="text-sm sm:text-base">Cashouts</span>
              <span className="text-lg sm:text-xl font-bold">₹{stats.Cashouts}</span>
            </div>

            <div className={`p-2 rounded-lg shadow-md flex flex-col items-center 
              ${stats.ProfitOrLoss >= 0 ? "bg-green-500" : "bg-red-600"} text-white`}>
              <span className="text-sm sm:text-base">Profit/Loss</span>
              <span className="text-lg sm:text-xl font-bold">
                {stats.ProfitOrLoss >= 0 ? `+${stats.ProfitOrLoss.toFixed(2)}` : stats.ProfitOrLoss} ₹
              </span>
            </div>
          </div>
         </div>
         </div>
         </div>
    );
  };
  
  export default FinalAdmin;
  