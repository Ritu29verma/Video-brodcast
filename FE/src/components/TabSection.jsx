import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from "../components/socket";

const TabSection = () => {
  const [activeTab, setActiveTab] = useState('All Bets');
  const [logsData, setLogsData] = useState([]);
  const [myBetsData, setMyBetsData] = useState([]);
  const [gameId, setGameId] = useState(() => sessionStorage.getItem("gameId") || "N/A");
  const clientCode = sessionStorage.getItem("client_code");

  const fetchMyBets = async () => {
    if (!clientCode) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/game/get-user-gameResults?clientCode=${clientCode}`);
      const bets = response.data.map((bet) => {
        const createdAt = new Date(bet.createdAt);
        const formattedDateTime = `${createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        
        return {
          gameId: bet.gameId,
          dateTime: formattedDateTime,
          bet: bet.betAmount,
          multiplier: `${bet.coinReach}`,
          cashout: bet.cashout,
          winLoss: bet.winLoss
        };
      });
      setMyBetsData(bets);
    } catch (error) {
      console.error('Error fetching my bets:', error);
    }
  };

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

  useEffect(() => {
    // Listen for 'gameId' from the server
    socket.on("gameId", (newGameId) => {
      console.log("Received gameId:", newGameId);
      setGameId(newGameId);
      sessionStorage.setItem("gameId", newGameId); // Save to sessionStorage
    });

    return () => {
      socket.off("gameId"); // Cleanup the listener when component unmounts
    };
  }, []);
  // Fetching game data for "Logs" tab
  useEffect(() => {

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

    if (activeTab === 'My Bets') {
      fetchMyBets();
      socket.on("gameResult", (newBet) => {
        if (newBet.clientCode === clientCode) {
          const createdAt = new Date();
          const formattedDateTime = `${createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

          setMyBetsData((prevBets) => [
            {
              gameId: newBet.gameId,
              dateTime: formattedDateTime,
              bet: newBet.betAmount,
              multiplier: `${newBet.coinReach}`,
              cashout: newBet.cashout,
              winLoss: newBet.winLoss
            },
            ...prevBets
          ]);
        }
      });

      return () => {
        socket.off("newBet");
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
    <div className="w-full lg:w-1/3 bg-gray-800 rounded-md shadow-lg p-2 h-auto lg:h-screen">
      <div className="flex justify-center bg-gray-900 rounded-md p-1 ">
      <span className="text-yellow-400">Game ID: {gameId}</span>

      </div>
      {/* Tabs */}
      <div className="flex justify-between border-b py-2 border-gray-700">
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

          {activeTab === 'My Bets' && (
            <div className="w-full">
              {/* Heading Row */}
              <div className="flex justify-between items-center p-2 text-yellow-400 font-bold rounded-md">
                <span>Game ID</span>
                <span>Date-Time</span>
                <span>Bet</span>
                <span>x</span>
                <span>Cashout</span>
                <span>Win/Loss</span>
              </div>

              {/* Data Rows */}
              {myBetsData.map((entry, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded-md ${
                    index % 2 === 0 ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="text-white">{entry.gameId}</span>
                  <span className="text-white">{entry.dateTime}</span>
                  <span className="text-white">{entry.bet} USD</span>
                  <span className="text-blue-400">x{entry.multiplier}</span>
                  <span className="text-white">{entry.cashout} USD</span>
                  <span className={`text-${entry.winLoss === 'win' ? 'green-400' : 'red-500'} font-semibold`}>
                    {entry.winLoss.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}


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
