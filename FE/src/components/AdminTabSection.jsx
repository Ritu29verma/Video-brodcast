import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from "../components/socket";

const AdminTabSection = () => {
  const [activeTab, setActiveTab] = useState('All Bets');
  const [logsData, setLogsData] = useState([]);
  const [allBetsData, setAllBetsData] = useState([]); 
  const [gameId, setGameId] = useState(() => sessionStorage.getItem("gameId") || "N/A");


  const fetchAllBets = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/game/get-all-gameResults`);
      const bets = response.data.map((bet) => {
        const createdAt = new Date(bet.createdAt);
        const formattedDateTime = `${createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

        return {
          user: `${bet.clientCode.substring(0, 1)}**${bet.clientCode.slice(-1)}`, // Masked User
          gameId: bet.gameId,
          dateTime: formattedDateTime,
          bet: bet.betAmount,
          multiplier: `${bet.coinReach}`,
          cashout: bet.cashout,
          winLoss: bet.winLoss
        };
      });
      setAllBetsData(bets);
    } catch (error) {
      console.error('Error fetching all bets:', error);
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
          totalInGame: game.totalInGame,
          cashout: game.cashout,
          profitLoss: game.profitLoss,
        };
      });
      setLogsData(games);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };
  

  
  useEffect(() => {
    if (activeTab === 'All Bets') {
      fetchAllBets();
      const handleGameResultAll = (newBet) => {
        console.log('all game:', newBet);
        const createdAt = new Date(newBet.createdAt);
        const formattedDateTime = `${createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  
        setAllBetsData((prevBets) => [
          {
            user: `${newBet.clientCode.substring(0, 1)}**${newBet.clientCode.slice(-1)}`,
            gameId: newBet.gameId,
            dateTime: formattedDateTime,
            bet: newBet.betAmount,
            multiplier: `${newBet.coinReach}`,
            cashout: newBet.cashout,
            winLoss: newBet.winLoss
          },
          ...prevBets
        ]);
      };
  
      socket.on("gameResultAll", handleGameResultAll);
  
      return () => {
        socket.off("gameResultAll", handleGameResultAll);
      };
    }

    if (activeTab === 'Logs') {
        fetchGameData(); // Fetch initial logs data
      
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
              coinReach: newGameData.coinReach,
              totalInGame: newGameData.totalInGame,
              cashout: newGameData.cashout,
              profitLoss: newGameData.profitLoss ?? 0,
            },
            ...prevLogs,
          ]);
        });
      
        return () => {
          socket.off('gameData');
        };
      }
      

  }, [activeTab]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-[#171858] rounded-md shadow-lg p-3 mt-2">

        
            {/* Tabs */}
        <div className="flex w-full border-b border-gray-700">
        {['All Bets', 'Logs'].map((tab) => (
            <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center font-semibold px-2 py-1 ${
                activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white'
            }`}
            >
            {tab}
            </button>
        ))}
        </div>



      {/* Tab Content */}
      <div className="scrollbar-hide space-y-0.5 flex-grow overflow-y-auto min-h-0">
      {activeTab === 'All Bets' && (
          <div className="w-full h-full overflow-y-auto scrollbar-hide">
           <div className="grid grid-cols-7 text-yellow-400 font-bold p-2 rounded-md text-xs sm:text-sm text-center">
              <span>User</span>
              <span>Game ID</span>
              <span>Date-Time</span>
              <span>Bet</span>
              <span>x</span>
              <span>Cashout</span>
              <span>Win/Loss</span>
            </div>
            <div className="w-full overflow-y-auto scrollbar-hide">
            {allBetsData.length == 0 ? (
        <div>
          <p className="text-center text-white font-sm p-4">No bets available</p>
        </div>
      ) : (allBetsData.map((entry, index) => (
              <div
                key={index}
                className={`m-1 grid grid-cols-7 p-2 rounded-md text-center text-xs sm:text-sm bg-black`}
      >
                <span className="text-white">{entry.user}</span>
                <span className="text-white">{entry.gameId}</span>
                <span className="text-white">{entry.dateTime}</span>
                <span className="text-white">{entry.bet} ₹</span>
                <span className="text-blue-400">x{entry.multiplier}</span>
                <span className="text-white">{entry.cashout} ₹</span>
                <span className={`text-${entry.winLoss === 'win' ? 'green-400' : 'red-500'} font-semibold`}>
                  {entry.winLoss.toUpperCase()}
                </span>
              </div>
            )))}
          </div>
          </div>
        )}




{activeTab === 'Logs' && (
        <div className="w-full h-full overflow-y-auto scrollbar-hide">
            {/* Heading Row */}
            <div className="grid grid-cols-6 text-yellow-400 font-bold p-2 rounded-md text-xs sm:text-sm text-center">
        <span>Game ID</span>
        <span>Date-Time</span>
        <span>Coin Reach</span>
        <span>Total Bet</span>
        <span>Cashout</span>
        <span>Profit/Loss</span>
        </div>

        {/* Data Rows */}
        <div className="w-full overflow-y-auto scrollbar-hide">
        {logsData.length == 0 ? (
            <div>
            <p className="text-center text-white font-sm p-4">No logs available</p>
            </div>
        ) : (
            logsData.map((entry, index) => (
            <div key={index} className="m-1 grid grid-cols-6 p-2 rounded-md text-center text-xs sm:text-sm bg-black">
                <span className="text-white">{entry.gameId}</span>
                <span className="text-white">{entry.dateTime}</span>
                <span className="text-blue-400">x{entry.coinReach}</span>
                <span className="text-white">{entry.totalInGame} ₹</span>
                <span className="text-white">{entry.cashout} ₹</span>
                <span className={`text-${entry.profitLoss >= 0 ? 'green-400' : 'red-500'} font-semibold`}>
                {(Number(entry.profitLoss) || 0).toFixed(2)} ₹
                </span>
            </div>
            ))
        )}
        </div>

  </div>
)}

      </div>
    </div>
  );
};

export default AdminTabSection;