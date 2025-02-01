import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from "../components/socket";

const TabSection = () => {
  const [activeTab, setActiveTab] = useState('All Bets');
  const [logsData, setLogsData] = useState([]);
  const [myBetsData, setMyBetsData] = useState([]);
  const [allBetsData, setAllBetsData] = useState([]); 
  const [gameId, setGameId] = useState(() => sessionStorage.getItem("gameId") || "N/A");
  const clientCode = sessionStorage.getItem("client_code");

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
      const handleNewBet = (newBet) => {
        if (newBet.clientCode === clientCode) {
          console.log('my bet',newBet)
          const createdAt = new Date(newBet.createdAt);
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
      };
      socket.on("gameResult", handleNewBet);

      return () => {
        socket.off("gameResult", handleNewBet);
      };
    }
  }, [activeTab]);


  return (
    <div className="w-full lg:w-6/12 bg-[#06141b] rounded-md shadow-lg p-3 h-auto lg:max-h-screen">
    <div className="flex justify-center bg-gray-900 rounded-md p-2">
      <span className="text-yellow-400 text-sm sm:text-base">Game ID: {gameId}</span>
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
      <div className="space-y-0.5 overflow-y-auto">
      {activeTab === 'All Bets' && (
          <div className="w-full max-h-[480px] overflow-y-auto scrollbar-hide">
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
            {allBetsData.map((entry, index) => (
              <div
                key={index}
                className={`m-1 grid grid-cols-7 p-2 rounded-md text-center text-xs sm:text-sm bg-black`}
      >
                <span className="text-white">{entry.user}</span>
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
          </div>
        )}

          {activeTab === 'My Bets' && (
              <div className="w-full max-h-[480px] overflow-y-auto scrollbar-hide">
              {/* Heading Row */}
              <div className="grid grid-cols-6 text-yellow-400 font-bold p-2 rounded-md text-xs sm:text-sm text-center">
                <span>Game ID</span>
                <span>Date-Time</span>
                <span>Bet</span>
                <span>x</span>
                <span>Cashout</span>
                <span>Win/Loss</span>
              </div>

              {/* Data Rows */}
              <div className="w-full overflow-y-auto scrollbar-hide">
              {myBetsData.map((entry, index) => (
                <div
                  key={index}
                  className={`m-1 grid grid-cols-6 p-2 rounded-md text-center text-xs sm:text-sm bg-black`}
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
            </div>
          )}


{activeTab === 'Logs' && (
<div className="w-full max-h-[480px] overflow-y-auto scrollbar-hide">
    {/* Heading Row */}
    <div className="grid grid-cols-3 text-yellow-400 font-bold p-2 rounded-md text-xs sm:text-sm text-center">
      <span>Game ID</span>
      <span>Date-Time</span>
      <span>Coin Reach</span>
    </div>

    {/* Data Rows (Scrollable) */}
    <div className="w-full overflow-y-auto scrollbar-hide">
      {logsData.map((entry, index) => (
        <div
          key={entry.gameId}
          className="m-1 grid grid-cols-3 p-2 rounded-md text-center text-xs sm:text-sm bg-black"
        >
          <span className="text-white">{entry.gameId}</span>
          <span className="text-white">{entry.dateTime}</span>
          <span className="text-blue-400">x{entry.coinReach}</span>
        </div>
      ))}
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default TabSection;