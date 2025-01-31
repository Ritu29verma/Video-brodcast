import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from "../components/socket";

const TabSection = () => {
  const [activeTab, setActiveTab] = useState('All Bets');
  const [logsData, setLogsData] = useState([]);

  // Fetching game data for "Logs" tab
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/game/get-games`);
        const games = response.data.data.map((game) => {
          const date = new Date(game.createdAt);
          const formattedDate = date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });
          return {
            gameId: game.gameId,
            dateTime: formattedDate,
            coinReach: game.coinReach,
          };
        });
        setLogsData(games);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    if (activeTab === 'Logs') {
      fetchGameData();
      socket.on('gameData', (newGameData) => {
        setLogsData((prevLogs) => [
          {
            gameId: newGameData.gameId,
            dateTime: new Date().toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            coinReach: newGameData.coinReach ?? 'N/A',
          },
          ...prevLogs
        ]);
      });
  
      return () => {
        socket.off('gameData');
      };
    }
  }, [activeTab]);

  const tabData = {
    'All Bets': [
      { user: 'a***1', bet: '150.00', multiplier: '1.78x', cashout: '267.00' },
      { user: 'b***2', bet: '75.00', multiplier: '2.50x', cashout: '187.50' },
      { user: 'c***3', bet: '200.00', multiplier: '3.12x', cashout: '624.00' },
    ],
    'My Bets': [
      { date: '30 Jan', time: '11:30', bet: '2.00', multiplier: '1.50x', cashout: '3.00' },
      { date: '30 Jan', time: '11:29', bet: '3.50', multiplier: '2.00x', cashout: '7.00' },
      { date: '30 Jan', time: '11:28', bet: '1.25', multiplier: '3.00x', cashout: '3.75' },
    ],
  };

  return (
    <div className="w-full lg:w-1/3 bg-gray-800 rounded-md shadow-lg p-4 h-auto lg:h-screen">
      {/* Tabs */}
      <div className="flex justify-between border-b pb-2 border-gray-700">
        {['All Bets', 'My Bets', 'Logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-semibold px-2 py-1 ${
              activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3 h-full overflow-y-auto">
        {activeTab === 'All Bets' &&
          tabData['All Bets'].map((entry, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-2 rounded-md ${
                index % 2 === 0 ? 'bg-gray-700' : ''
              }`}
            >
              <span className="text-white">{entry.user}</span>
              <span className="text-white">{entry.bet} Rs.</span>
              <span className="text-blue-400">{entry.multiplier}</span>
              <span className="text-white">{entry.cashout} Rs.</span>
            </div>
          ))}

        {activeTab === 'My Bets' &&
          tabData['My Bets'].map((entry, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-2 rounded-md ${
                index % 2 === 0 ? 'bg-gray-700' : ''
              }`}
            >
              <span className="text-white">
                {entry.date} {entry.time}
              </span>
              <span className="text-white">{entry.bet} USD</span>
              <span className="text-blue-400">{entry.multiplier}</span>
              <span className="text-white">{entry.cashout} USD</span>
            </div>
          ))}

          {activeTab === 'Logs' && (
            <div className="w-full">
              {/* Heading Row */}
              <div className="flex justify-between items-center p-2  text-yellow-400 font-bold rounded-md">
                <span>Game ID</span>
                <span>Date-Time</span>
                <span>Coin Reach</span>
              </div>

              {/* Data Rows */}
              {logsData.map((entry, index) => (
                <div
                  key={entry.gameId}
                  className={`flex justify-between items-center p-2 rounded-md ${
                    index % 2 === 0 ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="text-white">{entry.gameId}</span>
                  <span className="text-white">{entry.dateTime}</span>
                  <span className="text-blue-400">x{entry.coinReach}</span>
                </div>
              ))}
            </div>
          )}

      </div>
    </div>
  );
};

export default TabSection;
