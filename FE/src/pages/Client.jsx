import React, { useState,useEffect} from 'react';
import VideoPlayer from '../components/VideoPlayer'; 
import Navbar from '../components/Navbar';
import BettingGame from '../components/BetPanel';
import TabSection from '../components/TabSection';
import socket from "../components/socket";
const Client = () => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedName = sessionStorage.getItem("name");
    const clientCode = sessionStorage.getItem("client_code");

    if (storedName) setUserName(storedName);

    if (clientCode) {
      socket.emit("registerUser", clientCode);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar userId={userName} className="h-[60px]" />

      {!hasInteracted && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setHasInteracted(true)}
        >
          <h1 className="text-3xl font-bold text-center text-blue-400 animate-pulse">
            Click Anywhere or Press any Key to Start the Game
          </h1>
        </div>
      )}

      <div className="flex scrollbar-hide flex-col lg:flex-row lg:justify-between lg:space-x-3 p-1 overflow-y-scroll">

        {/* Video and Betting Game Section */}
        <div className="w-full h-full lg:w-2/3 flex flex-col flex-grow">
          <div className="w-full h-4/5 flex items-center justify-center bg-black rounded-md shadow-lg p-1">
            {hasInteracted && <VideoPlayer hasInteracted={hasInteracted} setHasInteracted={setHasInteracted} />}
          </div>
          <BettingGame />
        </div>
        <div className="w-full scrollbar-hide max-h-[calc(100vh-60px)] lg:w-6/12 flex flex-col flex-grow overflow-hidden">
          <TabSection />
        </div>
      </div> 
    </div>
  );
};

export default Client;
