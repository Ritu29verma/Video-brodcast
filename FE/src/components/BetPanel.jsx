import React, { useState } from "react";

const BetButton = ({ walletAmount, setWalletAmount }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [activeTab, setActiveTab] = useState("bet"); // "bet" or "auto"
  const betOptions = [1, 2, 5, 10];

  const handleBetChange = (change) => {
    const newBet = betAmount + change;
    if (newBet >= 1) setBetAmount(newBet);
  };

  const handlePlaceBet = () => {
    if (walletAmount >= betAmount) {
      setWalletAmount(walletAmount - betAmount);
      alert(`Bet placed: $${betAmount}`);
    } else {
      alert("Insufficient balance!");
    }
  };

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

      {/* Place Bet Button */}
      <button
        className="w-full py-3 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600"
        onClick={handlePlaceBet}
      >
      <div className="flex flex-col">
      <span> BET</span>
      <span> ${betAmount.toFixed(2)} USD</span>
      </div>
      </button>
     </div>
    </div>
  );
};

const BettingGame = () => {
  const [walletAmount, setWalletAmount] = useState(100);

  return (
    <div className="flex flex-col md:flex-row">
    <div className="bg-gray-900 text-white flex flex-col items-center p-6 w-full">
      <BetButton walletAmount={walletAmount} setWalletAmount={setWalletAmount} />
    </div>
    <div className="bg-gray-900 text-white flex flex-col items-center p-6 w-full">
      <BetButton walletAmount={walletAmount} setWalletAmount={setWalletAmount} />
    </div>
  </div>
  
  );
};

export default BettingGame;
