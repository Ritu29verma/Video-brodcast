import React, { useState,useEffect } from "react";
import socket from "../components/socket";
import { toast } from 'react-toastify'; 

const BetButton = ({ isFirstVideoPlaying, isSecondVideoPlaying, isThirdVideoPlaying }) => {
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [betAmount, setBetAmount] = useState(10);
  const [activeTab, setActiveTab] = useState("bet");
  const [userBet, setUserBet] = useState(null); 
  const [waitingForNextRound, setWaitingForNextRound] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState(null);

  const betOptions = [1, 2, 5, 10];

  const handleBetChange = (change) => {
    const newBet = betAmount + change;
    if (newBet >= 1) setBetAmount(newBet);
  };

  const handlePlaceBet = () => {
    const clientCode = sessionStorage.getItem("client_code"); 
    if (isFirstVideoPlaying) {
      setUserBet(betAmount);
      setWaitingForNextRound(false);
      toast.info(`Bet sent to socket $${userBet}`);
      socket.emit("placeBet", { clientCode, betAmount });
    } else if (isSecondVideoPlaying && userBet === null) {
      setUserBet(betAmount);
      setWaitingForNextRound(true);
    } else if (isThirdVideoPlaying && userBet === null) {
      setUserBet(betAmount);
      setWaitingForNextRound(true);
    }
  };

  const handleCancelBet = () => {
    setUserBet(null);
    setWaitingForNextRound(false);
    toast.info("Bet cancelled");
  };

  const handleSocketCancelBet =()=>{
    const clientCode = sessionStorage.getItem("client_code"); // Retrieve client code from session storage
    socket.emit("cancelBet", { clientCode, betAmount: userBet });

    toast.info(`Cancelling bet $${userBet}`);
    setUserBet(null);
    setWaitingForNextRound(false);
  };

  const handleCashout = () => {
    if (userBet !== null) {
      const amount = userBet * currentMultiplier; // Capture exact amount at the moment
      setCashoutAmount(amount); // Store it in state
      setUserBet(null); // Reset user bet after cashout
      toast.info(`Bet cashed out: $${amount.toFixed(2)} USD`);
    }
  };

  useEffect(() => {
    if (isFirstVideoPlaying && waitingForNextRound && userBet !== null) {
      toast.info(`Bet auto-placed from last round: $${userBet}`);
      const clientCode = sessionStorage.getItem("client_code");
    if (clientCode) {
      socket.emit("placeBet", { clientCode, betAmount: userBet });
    }
      setWaitingForNextRound(false);
    }
  }, [isFirstVideoPlaying]);



  useEffect(() => {
    if (isThirdVideoPlaying && userBet !== null && !waitingForNextRound) {
      setUserBet(null)   
    }
  }, [isThirdVideoPlaying]);

  useEffect(() => {
    socket.on("update_multiplier", (multiplier) => {
      setCurrentMultiplier(multiplier);
    });
    return () => {
      socket.off('update_multiplier');
    };
  }, []);

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-lg p-3 w-full mx-auto">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-2 bg-gray-900 rounded-xl">
        <button
          className={`flex-1 py-2 text-center font-semibold rounded-tl-xl rounded-bl-xl ${
            activeTab === "bet"
              ? "bg-gray-700 text-white"
              : "bg-gray-900 text-gray-400"
          }`}
          onClick={() => setActiveTab("bet")}
        >
          Bet
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold rounded-tr-xl rounded-br-xl ${
            activeTab === "auto"
              ? "bg-gray-700 text-white"
              : "bg-gray-900 text-gray-400"
          }`}
          onClick={() => setActiveTab("auto")}
        >
          Auto
        </button>
      </div>


     <div className="flex space-x-2">
     <div>
        {/* Bet Adjustment Section */}
        <div className="flex items-center bg-black p-2 rounded-full justify-between mb-1">
        <button
          className="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
          onClick={() => handleBetChange(-1)}
        >
          -
        </button>
        <span className="ml-2 mr-2 text-xl font-bold">{betAmount.toFixed(2)}</span>
        <button
          className="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
          onClick={() => handleBetChange(1)}
        >
          +
        </button>
      </div>
      
       {/* Bet Options */}
       <div className="grid grid-cols-2 gap-2">
        {betOptions.map((option) => (
          <button
            key={option}
            className={`py-1 px-2 rounded-lg font-medium ${
              betAmount === option
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            } hover:bg-blue-400`}
            onClick={() => setBetAmount(option)}
          >
            {option.toFixed(2)}
          </button>
        ))}
      </div>
     </div>

      {/* Place Bet / Cancel / Cashout Buttons */}
      {isFirstVideoPlaying && !waitingForNextRound && userBet == null &&( //i.e 1st vid playing and no waiting since last round
          <button className="w-full py-3 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600" onClick={handlePlaceBet}>
            <div className="flex flex-col">
              <span>BET</span>
              <span>${betAmount.toFixed(2)} USD</span>
            </div>
          </button>
        )}

        {isFirstVideoPlaying && userBet !== null && (
          <button className="w-full py-3 bg-red-500 text-white font-bold text-lg rounded-lg hover:bg-red-600" onClick={handleSocketCancelBet}>
            CANCEL
          </button>
        )}
      

        {isSecondVideoPlaying && userBet !== null && !waitingForNextRound && (
          <button className="w-full py-3 bg-yellow-500 text-white font-bold text-lg rounded-lg hover:bg-yellow-600"
          onClick={handleCashout}>
            CASHOUT ${userBet * currentMultiplier} USD
          </button>
        )}

        {isSecondVideoPlaying && userBet !== null && waitingForNextRound && (
        <button 
          className="w-full py-3 bg-red-500 text-white font-bold text-lg rounded-lg hover:bg-red-600" 
          onClick={handleCancelBet}
        >
          CANCEL
          <br></br>
          <small>waiting for next round</small>
        </button>
        )}
        
        {isSecondVideoPlaying && userBet === null && (
          <button className="w-full py-3 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600" onClick={handlePlaceBet}>
            <div className="flex flex-col">
              <span>BET</span>
              <span>${betAmount.toFixed(2)} USD</span>
            </div>
          </button>
        )}

      {isThirdVideoPlaying && userBet !== null && (
          <button 
            className="w-full py-3 bg-red-500 text-white font-bold text-lg rounded-lg hover:bg-red-600" 
            onClick={handleCancelBet}
          >
            CANCEL
            <br></br>
            <small>waiting for next round</small>
          </button>
      )}
        {isThirdVideoPlaying && userBet === null && (
          <button className="w-full py-3 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600" onClick={handlePlaceBet}>
            <div className="flex flex-col">
              <span>BET</span>
              <span>${betAmount.toFixed(2)} USD</span>
            </div>
          </button>
        )}
     </div>
    </div>
  );
};

const BettingGame = () => {
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

  return (
    <div className="flex flex-col md:flex-row">
    <div className="bg-gray-900 text-white flex flex-col items-center p-6 w-full">
    <BetButton isFirstVideoPlaying={isFirstVideoPlaying} isSecondVideoPlaying={isSecondVideoPlaying} isThirdVideoPlaying={isThirdVideoPlaying} />
    </div>
    <div className="bg-gray-900 text-white flex flex-col items-center p-6 w-full">
    <BetButton isFirstVideoPlaying={isFirstVideoPlaying} isSecondVideoPlaying={isSecondVideoPlaying} isThirdVideoPlaying={isThirdVideoPlaying} />
    </div>
  </div>
  
  );
};

export default BettingGame;
