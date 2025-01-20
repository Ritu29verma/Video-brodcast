import React, { useState } from 'react';
import VideoPlayer from '../components/VideoPlayer'; 
import Navbar from '../components/Navbar';

const Client = () => {
  const [hasInteracted, setHasInteracted] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center space-y-6">
      <Navbar />

      {/* Overlay for Start Screen */}
      {!hasInteracted && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-9,0 flex items-center justify-center z-50"
          onClick={() => setHasInteracted(true)}
        >
          <h1 className="text-3xl font-bold text-center text-blue-400 animate-pulse">
            Click Anywhere or Press any Key to Start the Game
          </h1>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl space-y-6 lg:space-y-0 lg:space-x-6">
        {/* Bets Table */}
        <div className="w-full lg:w-1/4 bg-gray-800 rounded-md shadow-lg p-4">
          <div className="flex justify-between border-b pb-2 border-gray-700">
            <button className="text-white font-semibold">All Bets</button>
            <button className="text-yellow-400 font-semibold border-b-2 border-yellow-400">
              My Bets
            </button>
            <button className="text-white font-semibold">Top</button>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { time: '21:24', bet: '1.00', multiplier: '1.18x', cashout: '1.18' },
              { time: '21:24', bet: '1.00', multiplier: '1.33x', cashout: '1.13' },
              { time: '21:22', bet: '1.00', multiplier: '2.33x', cashout: '2.33' },
              { time: '21:22', bet: '1.00', multiplier: '2.39x', cashout: '2.39' },
              { time: '21:21', bet: '50.13', multiplier: '3.68x', cashout: '3.68' },
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
        </div>

        {/* Game Section */}
        <div
          className={`w-full lg:w-3/4 rounded-md shadow-lg flex-col relative flex items-center justify-center bg-gray-700 text-white p-6 transition-opacity duration-500 ${
            hasInteracted ? '' : 'opacity-100 pointer-events-none'
          }`}
        >
          {hasInteracted && (
            <VideoPlayer
              hasInteracted={hasInteracted}
              setHasInteracted={setHasInteracted}
            />
          )}
        </div>
      </div>

      {/* Betting Section */}
      <div className="flex flex-col lg:flex-row items-center w-full max-w-6xl justify-between space-y-6 lg:space-y-0">
        {/* Left Betting Section */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md">5</button>
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md">10</button>
          </div>
          <div className="bg-green-500 text-white text-lg font-bold px-6 py-3 rounded-md text-center cursor-pointer hover:bg-green-600">
            BET 1.00 USD
          </div>
        </div>

        {/* Right Betting Section */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md">100</button>
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md">200</button>
          </div>
          <div className="bg-green-500 text-white text-lg font-bold px-6 py-3 rounded-md text-center cursor-pointer hover:bg-green-600">
            BET 1.00 USD
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;
