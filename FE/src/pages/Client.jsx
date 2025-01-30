import React, { useState,useEffect} from 'react';
import VideoPlayer from '../components/VideoPlayer'; 
import Navbar from '../components/Navbar';
import BettingGame from '../components/BetPanel';
import TabSection from '../components/TabSection';

const Client = () => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const [walletAmount, setWalletAmount] = useState(0);

  useEffect(() => {
    const storedName = sessionStorage.getItem("name");
    const storedWallet = sessionStorage.getItem("wallet");

    if (storedName) setUserName(storedName);
    if (storedWallet) setWalletAmount(parseFloat(storedWallet));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar userId={userName} walletAmount={walletAmount} />

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

      <div className="flex flex-col lg:flex-row lg:justify-between lg:space-x-3 p-4">

        {/* Video and Betting Game Section */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-md shadow-lg p-1">
            {hasInteracted && <VideoPlayer hasInteracted={hasInteracted} setHasInteracted={setHasInteracted} />}
          </div>
          <BettingGame />
        </div>

        {/* Betting Section */}
        {/* <div className="w-full lg:w-1/3 bg-gray-800 rounded-md shadow-lg p-4 h-auto lg:h-screen">
          <div className="flex justify-between border-b pb-2 border-gray-700">
            <button className="text-white font-semibold">All Bets</button>
            <button className="text-yellow-400 font-semibold border-b-2 border-yellow-400">
              My Bets
            </button>
            <button className="text-white font-semibold">Top</button>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { time: '21:21', bet: '50.13', multiplier: '3.68x', cashout: '3.68' },
              // Additional mock data...
            ].map((entry, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded-md ${
                  index % 2 === 0 ? 'bg-gray-700' : ''
                }`}
              >
                <span>{entry.time}</span>
                <span>{entry.bet} USD</span>
                <span className="text-blue-400">{entry.multiplier}</span>
                <span>{entry.cashout} USD</span>
              </div>
            ))}
          </div>
        </div> */}
        
        <TabSection/>
        
      </div> 
    </div>
  );
};

export default Client;
