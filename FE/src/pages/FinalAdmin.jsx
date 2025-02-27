import React, { useState,useRef, useEffect } from "react";
import VideoPlayer from "../components/VideoPlayer";
import socket from "../components/socket";
import AdminRanges from "../components/AdminRange";
import AdminNav from "../components/AdminNav";
import AdminTabSection from "../components/AdminTabSection";
import moment from 'moment';

const FinalAdmin = () => {
  const today = moment().format('YYYY-MM-DD');
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
  const [isFirstVideoPlaying, setIsFirstVideoPlaying] = useState(false);
  const [isSecondVideoPlaying, setIsSecondVideoPlaying] = useState(false);
  const [isThirdVideoPlaying, setIsThirdVideoPlaying] = useState(false);
  useEffect(() => {
    socket.on("admin_control", (state) => {
      setIsFirstVideoPlaying(state.url === `${import.meta.env.VITE_BASE_URL}/videos/Begin.mp4`);
      setIsSecondVideoPlaying(state.url === `${import.meta.env.VITE_BASE_URL}/videos/Middle_second.mp4`);
      setIsThirdVideoPlaying(state.url === `${import.meta.env.VITE_BASE_URL}/videos/video3.mp4`);
    });
  }, []);
  const [hasInteracted, setHasInteracted] = useState(false);
  const overlayRef = useRef(null);
  const [reservePercentage, setReservePercentage] = useState(10);
  const [reservedAmount, setReservedAmount] = useState(0);
  const [payableAmount, setPayableAmount] = useState(0);
  const [newReserve, setNewReserve] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [filterInGame,setFilterIngame] = useState(0);
  const [filterLoss,setFilterLoss]=useState(0);
  const [filterprofit, setFilterProfit]= useState(0);
  const [inputFromdate, setInputFromDate] = useState(today)
  const [inputTodate, setInputToDate] =useState(today)

  
  useEffect(() => {
    if ((toDate !== today) && (fromDate !== today)) { return; }
    socket.on("DayStats", (data) => {
      setFilterProfit(data.profit);
      setFilterLoss(data.loss);
    });
  }, []);
  const handleReserveChange = (e) => {
    setNewReserve(e.target.value);
  };
  const fetchstatsSummary = async()=>{
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/admin/stats-summary?fromDate=${fromDate}&toDate=${toDate}`
        );
        const data = await response.json();
        setFilterIngame(data.totalInGameAmount);
        setFilterLoss( data.totalLoss );
        setFilterProfit( data.totalProfit );
        console.log("Search results:", data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
  };
  
  const handleReserveSubmit = (e) => {
    e.preventDefault();
    if (!isNaN(newReserve) && newReserve > 0) {
      const value = Number(newReserve);
      socket.emit("updateReservePercentage", value);
      setNewReserve("");
    }
  };
  useEffect(() => {
    socket.on("reservePercentage", (data) => setReservePercentage(data));
    socket.on("reservedAmount", (data) => setReservedAmount(data));
    socket.on("PayableAmount", (data) => setPayableAmount(data));
    fetchstatsSummary();
    return () => {
      socket.off("reservePercentage");
      socket.off("reservedAmount");
      socket.off("PayableAmount");
    };
  }, []);

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
  const handleSearch= async()=>{
    setToDate(inputTodate);
    setFromDate(inputFromdate);
    fetchstatsSummary();
  };

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
  const isFlyButtonEnabled = isSecondVideoPlaying;
  const isButtonEnabled = isFirstVideoPlaying;

  const handleInteraction = () => {
    setHasInteracted(true);
  }
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, []);

  if (!hasInteracted) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 text-white text-3xl font-bold tracking-wide"
        onClick={handleInteraction}
        onKeyDown={(e) => {
          console.log("Key Pressed:", e.key);
          handleInteraction();
        }}
        tabIndex={0}
      >
        <h1 className="text-2xl font-bold animate-pulse">Click or Press Any Key to Start</h1>
      </div>
    );
  }

    return (
      <div className="min-h-screen md:h-full bg-gray-900 text-white ">
        <AdminNav className="h-[60px]" />
  
        {/* Main Container */}
        <div className="flex overflow-hidden md:flex-row flex-col w-full p-3 space-y-6 md:space-y-0 md:space-x-2">
  
          {/* First Row: Coin Input and Ranges */}
          <div className="w-full md:w-1/2 bg-[#0b0823] p-2 rounded-lg shadow-lg">
          <div className="bg-[#0b0823] rounded-lg p-2 w-full">
  {/* <h1 className="text-lg font-semibold text-left mb-2 text-white">Search Bets Data</h1> */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-2">
        {/* From Date Input */}
        <div className="flex-1">
          <label htmlFor="fromDate" className="block text-sm font-medium text-white mb-1">
            From Date
          </label>
          <input
            id="fromDate"
            type="date"
            value={inputFromdate}
            onChange={(e) => setInputFromDate(e.target.value)}
            className="w-full p-2 rounded border border-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* To Date Input */}
        <div className="flex-1">
          <label htmlFor="toDate" className="block text-sm font-medium text-white mb-1">
            To Date
          </label>
          <input
            id="toDate"
            type="date"
            value={inputTodate}
            onChange={(e) => setInputToDate(e.target.value)}
            className="w-full p-2 rounded border border-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full md:w-auto bg-blue-600 text-white font-semibold p-2 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-95"
            >
              Search
            </button>
          </div>
      </div>
  </div>
          <div className="">

          <AdminTabSection fromDate={fromDate} toDate={toDate} today={today}/>
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
         <div className="flex flex-col md:flex-row justify-between items-start w-full gap-2 md:mr-6">
          {/* Video Player Section */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <div className="w-[300px] h-[200px] bg-black p-2 sm:p-3 rounded-lg shadow-lg">
              <VideoPlayer hasInteracted={hasInteracted} setHasInteracted={setHasInteracted} />
            </div>
          </div>

          {/* Right Section: Reserve & Stats */}
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
            {/* Reserve Percentage */}
            <div className="p-2 bg-gray-800 rounded-lg">
              <h4 className="text-sm font-bold mb-2">Reserve Percentage</h4>
              <form onSubmit={handleReserveSubmit} className="flex justify-between">
                <input
                  type="number"
                  value={newReserve}
                  onChange={handleReserveChange}
                  className="p-1 flex-grow bg-gray-700 border rounded w-10"
                  placeholder="%"
                  required
                />
                <button type="submit" className="p-2 bg-blue-600 rounded text-white sm:text-sm">
                  Set
                </button>
              </form>
            </div>

            {/* Reserve Stats */}
            <div className="p-3 bg-blue-600 rounded-lg text-center">
              <span className="block text-sm">Reserve Percentage</span>
              <span className="md:text-lg text-sm font-bold">{reservePercentage}%</span>
            </div>
            <div className="p-3 bg-yellow-600 rounded-lg text-center">
              <span className="block text-sm">Reserved Amount</span>
              <span className="md:text-lg text-sm font-bold">₹{reservedAmount.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-green-600 rounded-lg text-center">
              <span className="block text-sm">Payable Amount</span>
              <span className="md:text-lg text-sm font-bold">₹{payableAmount.toFixed(2)}</span>
            </div>
            
          </div>
        </div>
        <div className=" md:w-2/3 bg-[#0b0823] p-4 rounded-lg shadow-lg m-4 ">
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
          </div>
        
        {/* Stats Row */}
        <h2 className="flex justify-left">Current Stats</h2>
        <div className="grid grid-cols-3 gap-4 mt-2 w-full px-4">
          
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md flex flex-col items-center">
            <span className="text-sm sm:text-base">In-Game Amount</span>
            <span className="text-lg sm:text-xl font-bold">₹{stats.InGameAmount}</span>
          </div>
          <div className="bg-green-600 text-white p-2 rounded-lg shadow-md flex flex-col items-center">
            <span className="text-sm sm:text-base">Cashouts</span>
            <span className="text-lg sm:text-xl font-bold">₹{stats.Cashouts.toFixed(2)}</span>
          </div>
          <div className={`p-2 rounded-lg shadow-md flex flex-col items-center 
            ${stats.ProfitOrLoss >= 0 ? "bg-green-500" : "bg-red-600"} text-white`}>
            <span className="text-sm sm:text-base">Profit/Loss</span>
            <span className="text-lg sm:text-xl font-bold">
              {stats.ProfitOrLoss >= 0 ? `+${stats.ProfitOrLoss.toFixed(2)}` : stats.ProfitOrLoss.toFixed(2)} ₹
            </span>
          </div>
        </div>

        <h2 className="flex justify-left mt-4">Filter Based Stats</h2>
        <div className="grid grid-cols-2 gap-4 mt-2 w-full px-4">
          
         
          <div className="bg-red-500 text-white p-2 rounded-lg shadow-md flex flex-col items-center">
            <span className="text-sm sm:text-base">Loss</span>
            <span className="text-lg sm:text-xl font-bold">₹ {filterLoss}</span>
          </div>
          <div className={`p-2 rounded-lg shadow-md flex flex-col items-center 
            bg-green-500 text-white`}>
            <span className="text-sm sm:text-base">Profit</span>
            <span className="text-lg sm:text-xl font-bold">
            ₹ {filterprofit}
            </span>
          </div>
        </div>
        
        

         </div>
         </div>
         </div>
    );
  };
  
  export default FinalAdmin;
  