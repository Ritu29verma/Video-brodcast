import React, { useState,useEffect } from "react";
import socket from "../components/socket";
import { toast } from 'react-toastify'; 

const CashoutPopup = ({ multiplier, amount, onClose }) => {
  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-2 py-2 rounded-full shadow-lg flex items-center">
      <div className="mr-2 ml-2 text-base">
        <p className="text-sm">You have cashed out!</p>
        <p className="font-bold">{multiplier.toFixed(2)}x</p>
      </div>
      <div className="bg-green-500 px-2 py-2 rounded-lg text-base font-semibold">
        Win Rs. {amount.toFixed(2)}
      </div>
      <button className="ml-2 mr-2 text-white font-semibold text-base" onClick={onClose}>
        ✖
      </button>
    </div>
  );
};

const LossPopup = ({ multiplier, amount, onClose }) => {
  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-2 rounded-full shadow-lg flex items-center">
      <div className="mr-2 ml-2 text-base">
        <p className="text-sm">You could not cashout!</p>
        <p className="font-bold">{multiplier.toFixed(2)}x</p>
      </div>
      <div className="bg-red-500 px-2 py-2 rounded-lg text-base font-semibold">
        Loss Rs. {amount.toFixed(2)}
      </div>
      <button className="ml-2 mr-2 text-white font-semibold text-base" onClick={onClose}>
        ✖
      </button>
    </div>
  );
};


const BetButton = ({ isFirstVideoPlaying, isSecondVideoPlaying, isThirdVideoPlaying }) => {
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [betAmount, setBetAmount] = useState(10);
  const [activeTab, setActiveTab] = useState("bet");
  const [userBet, setUserBet] = useState(null); 
  const [waitingForNextRound, setWaitingForNextRound] = useState(false);
  const [cashoutData, setCashoutData] = useState(null);
  const [lossData,setLossData]= useState(null)
  const betOptions = [100, 200, 500, 1000];
  const betOptionsMultiply = [1, 2, 5, 10];
  const [lastClicked, setLastClicked] = useState(null);

  const handleBetClick = (option) => {
    if (lastClicked === option) {
      setBetAmount((prev) => prev + option);
    } else {
      setBetAmount(option);
      setLastClicked(option);
    }
  };


  const handleBetChange = (change) => {
    const newBet = betAmount + change;
    if (newBet >= 1) setBetAmount(newBet);
  };

  const handlePlaceBet = () => {
    const clientCode = sessionStorage.getItem("client_code"); 
    if (isFirstVideoPlaying) {
      setUserBet(betAmount);
      setWaitingForNextRound(false);
      socket.emit("placeBet", { clientCode, betAmount }, (response) => {
        if (response.success) {
          setUserBet(betAmount);
          setWaitingForNextRound(false);
          // toast.success(`Bet placed successfully: ${betAmount} Rs.`);
        } else {
          setUserBet(null);
          setWaitingForNextRound(false);
          toast.error(response.message || "Failed to place bet.");
        }
      });
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
    // toast.info("Bet cancelled");
  };

  const handleSocketCancelBet =()=>{
    const clientCode = sessionStorage.getItem("client_code"); // Retrieve client code from session storage
    socket.emit("cancelBet", { clientCode, betAmount: userBet });

    // toast.info(`Cancelling bet $${userBet}`);
    setUserBet(null);
    setWaitingForNextRound(false);
  };

  const handleCashout = () => {
    if (userBet !== null) {
      const clientCode = sessionStorage.getItem("client_code");
      const cashoutAmount = userBet * currentMultiplier;
      socket.emit("cashout", { clientCode, userBet, cashoutAmount,currentMultiplier});
      setUserBet(null);
      setCashoutData({ amount: cashoutAmount, multiplier: currentMultiplier });
      setTimeout(() => setCashoutData(null), 3000);
    }
  };

  useEffect(() => {
    if (isFirstVideoPlaying && waitingForNextRound && userBet !== null) {
      // toast.info(`Bet auto-placed from last round: ${userBet} Rs.`);
    const clientCode = sessionStorage.getItem("client_code");
    if (clientCode) {
      socket.emit("placeBet", { clientCode, betAmount: userBet }, (response) => {
        if (response.success) {
          setWaitingForNextRound(false);
          // toast.success(`Bet placed successfully: ${betAmount} Rs.`);
        } else {
          setUserBet(null)
          setWaitingForNextRound(false);
          toast.error(response.message);
        }
      });
    }  
    }
  }, [isFirstVideoPlaying]);



  useEffect(() => {
    if (isThirdVideoPlaying && userBet !== null && !waitingForNextRound) {
      setLossData({ amount: userBet, multiplier: currentMultiplier });
      setTimeout(() => setLossData(null), 3000);
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
    <>
    {cashoutData && (
      <CashoutPopup
        multiplier={cashoutData.multiplier}
        amount={cashoutData.amount}
        onClose={() => setCashoutData(null)}
      />
    )}
    {lossData && (
      <LossPopup
        multiplier={lossData.multiplier}
        amount={lossData.amount}
        onClose={() => setLossData(null)}
      />
    )}
    <div className="bg-gray-800 text-white rounded-lg shadow-lg p-1 w-full mx-auto">
     <div className="flex space-x-2 bg-gray-800 m-1">
      <div>
     <div className="bg-gray-800">
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
       <div className="bg-gray-800 grid grid-cols-2 gap-2 p-2">
      {betOptions.map((option) => (
        <button
          key={option}
          className={`"w-full py-2 px-8 rounded-lg font-bold text-base flex items-center justify-center ${
            lastClicked === option
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-gray-300"
          } hover:bg-green-400 transition duration-200`}
          onClick={() => handleBetClick(option)}
        >
          {option.toFixed(2)}
        </button>
      ))}
    </div>
     </div>
      </div>
      
      {/* Place Bet / Cancel / Cashout Buttons */}
      {isFirstVideoPlaying && !waitingForNextRound && userBet == null &&( //i.e 1st vid playing and no waiting since last round
          <button className="w-full py-3 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600" onClick={handlePlaceBet}>
            <div className="flex flex-col">
              <span className="">BET</span>
              <span>{betAmount.toFixed(2)} Rs.</span>
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
            CASHOUT {(userBet * currentMultiplier).toFixed(2)} Rs.
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
              <span>{betAmount.toFixed(2)} Rs.</span>
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
              <span>{betAmount.toFixed(2)} Rs.</span>
            </div>
          </button>
        )}
     </div>
     {/* <div className="bg-gray-800 grid grid-cols-4 gap-2">
        {betOptionsMultiply.map((option) => (
          <button
            key={option}
            className={`py-1 px-2 rounded-lg font-medium ${
              betAmount === option
                ? "bg-green-500 text-white"
                : "bg-gray-700 text-gray-300"
            } hover:bg-green-400`}
            onClick={() => setBetAmount((prev) => prev * option)}
          >
            {option}x
          </button>
        ))}
      </div> */}
    </div>
    </>
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
    <div className="flex flex-col md:flex-row gap-1 flex-grow">
    <div className="bg-gray-900 text-white flex flex-col items-center p-1 w-full md:w-1/2">
      <BetButton isFirstVideoPlaying={isFirstVideoPlaying} isSecondVideoPlaying={isSecondVideoPlaying} isThirdVideoPlaying={isThirdVideoPlaying} />
    </div>
    <div className="bg-gray-900 text-white flex flex-col items-center p-1 w-full md:w-1/2">
      <BetButton isFirstVideoPlaying={isFirstVideoPlaying} isSecondVideoPlaying={isSecondVideoPlaying} isThirdVideoPlaying={isThirdVideoPlaying} />
    </div>
  </div>
  
  );
};

export default BettingGame;
