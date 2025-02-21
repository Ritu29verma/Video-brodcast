import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import Navbar from '../components/Navbar';
import BettingGame from '../components/BetPanel';
import TabSection from '../components/TabSection';
import socket from "../components/socket";

const getRandomColor = () => {
  const colors = ["text-red-500", "text-blue-400", "text-yellow-400", "text-green-400", "text-purple-400", "text-pink-400"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Client = () => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [userName, setUserName] = useState("");
  const [multipliers, setMultipliers] = useState([]);
  const [screenSize, setScreenSize] = useState(window.innerWidth);
  const overlayRef = useRef(null);

  useEffect(() => {
    const fetchMultipliers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/game/get-multipliers`);
        const data = await response.json();

        if (data.multipliers) {
          setMultipliers(data.multipliers.map(value => ({
            value,
            color: getRandomColor(),
          })));
        }
      } catch (error) {
        console.error('Error fetching multipliers:', error);
      }
    };

    fetchMultipliers();
  }, []);

  useEffect(() => {
    const storedName = sessionStorage.getItem("name");
    const clientCode = sessionStorage.getItem("client_code");

    if (storedName) setUserName(storedName);

    if (clientCode) {
      socket.emit("registerUser", clientCode);
    }

    // Listen for gameData event
    socket.on('gameData', (data) => {
      if (data.coinReach !== null) {
        // Update multipliers with new coinReach
        setMultipliers(prevMultipliers => [
          { value: data.coinReach, color: getRandomColor() },
          ...prevMultipliers
        ]);
      }
    });

    return () => {
      // Clean up the event listener on unmount
      socket.off('gameData');
    };
  }, []);

  // Track screen size to update multipliers display count
  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleInteraction = () => {
    setHasInteracted(true);
  };

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
        onKeyDown={(e) => handleInteraction()}
        tabIndex={0}
      >
        <h1 className="text-2xl font-bold animate-pulse">Click or Press Any Key to Start</h1>
      </div>
    );
  }

  // Determine how many multipliers to show based on screen size
  const displayMultipliers = screenSize < 640 ? 8 : 17;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar userId={userName} className="h-[60px]" />

      <div className="flex scrollbar-hide flex-col lg:flex-row lg:justify-between lg:space-x-3 p-1 overflow-y-scroll">
        <div className="w-full h-full lg:w-2/3 flex flex-col flex-grow">
          {/* Multiplier Section */}
          <div className='flex flex-wrap justify-center space-x-2 bg-black bg-opacity-50 px-2 py-1 rounded-t-md shadow-md overflow-hidden'>
            {multipliers.slice(0, displayMultipliers).map((multiplier, index) => (
              <span key={index} className={`text-base ${multiplier.color}`}>
                {multiplier.value}x
              </span>
            ))}
          </div>

          {/* Video and Betting Game Section */}
          <div className="w-full h-4/5 flex items-center justify-center bg-black rounded-b-md shadow-lg p-1">
            <VideoPlayer hasInteracted={hasInteracted} setHasInteracted={setHasInteracted} />
          </div>
          <div className="mt-2">
            <BettingGame />
          </div>
        </div>

        {/* Tab Section */}
        <div className="w-full scrollbar-hide max-h-[calc(100vh-60px)] lg:w-6/12 flex flex-col flex-grow overflow-hidden">
          <TabSection />
        </div>
      </div>
    </div>
  );
};

export default Client;
