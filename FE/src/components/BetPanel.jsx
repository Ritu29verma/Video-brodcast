import React, { useState, useEffect } from "react";

const BetButton = ({ walletAmount, setWalletAmount, videoState, videoNumber }) => {
  const [betAmount, setBetAmount] = useState(1); // Default bet amount
  const [buttonState, setButtonState] = useState("place"); // place, cashout, cancel
  const [multiplier, setMultiplier] = useState(1); // Multiplier for winnings
  const [betLocked, setBetLocked] = useState(false); // Indicates if betting is allowed

  useEffect(() => {
    // Disable betting when the second video starts playing
    if (videoState.isPlaying && videoNumber === 2) {
      setBetLocked(true);
    } else {
      setBetLocked(false);
    }

    // Reset the button state when the third video starts playing
    if (videoState.isPlaying && videoNumber === 3) {
      if (buttonState === "cashout") {
        setButtonState("place");
        alert("You missed the cashout! Bet lost.");
      }
    }
  }, [videoState, videoNumber]);

  const handlePlaceBet = () => {
    if (walletAmount >= betAmount) {
      setWalletAmount(walletAmount - betAmount);
      setButtonState("cashout");
    } else {
      alert("Insufficient balance!");
    }
  };

  const handleCashout = () => {
    const winnings = betAmount * multiplier;
    setWalletAmount(walletAmount + winnings);
    setButtonState("place");
    alert(`You cashed out and won ${winnings.toFixed(2)}!`);
  };

  const handleCancel = () => {
    if (!videoState.isPlaying || videoNumber !== 2) {
      setWalletAmount(walletAmount + betAmount);
      setButtonState("place");
      alert("Bet canceled.");
    }
  };

  const getButtonStyles = () => {
    switch (buttonState) {
      case "place":
        return "bg-green-500 text-white";
      case "cashout":
        return "bg-yellow-500 text-white";
      case "cancel":
        return "bg-red-500 text-white";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex space-x-2">
        {/* Bet Button */}
        <button
          className={`p-4 rounded-lg shadow-lg w-40 ${getButtonStyles()}`}
          onClick={() => {
            if (buttonState === "place") {
              handlePlaceBet();
            } else if (buttonState === "cashout") {
              handleCashout();
            }
          }}
          disabled={betLocked && buttonState === "place"}
        >
          {buttonState === "place"
            ? `BET ${betAmount.toFixed(2)} USD`
            : buttonState === "cashout"
            ? `CASH OUT ${betAmount * multiplier} USD`
            : "PLACE BET"}
        </button>

        {/* Cancel Button */}
        {buttonState === "cashout" && (
          <button
            className="p-4 rounded-lg shadow-lg bg-red-500 text-white w-40"
            onClick={handleCancel}
          >
            CANCEL
          </button>
        )}
      </div>

      {/* Bet Amount Selector */}
      <div className="mt-4 space-x-2">
        {[1, 2, 5, 10].map((amount) => (
          <button
            key={amount}
            className={`p-2 rounded-lg border ${
              betAmount === amount ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-200"
            }`}
            onClick={() => setBetAmount(amount)}
          >
            {amount} USD
          </button>
        ))}
      </div>
    </div>
  );
};

const BettingGame = () => {
  const [walletAmount, setWalletAmount] = useState(1000); // Initial wallet balance
  const [videoState, setVideoState] = useState({ isPlaying: false }); // Video state
  const [videoNumber, setVideoNumber] = useState(1); // Current video number

  // Simulate video state changes
  useEffect(() => {
    const interval = setInterval(() => {
      setVideoNumber((prev) => (prev === 3 ? 1 : prev + 1));
      setVideoState({ isPlaying: Math.random() > 0.5 }); // Randomly simulate play/pause
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className=" bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Betting Game</h1>
      <div className="text-center mb-6">
        <p>Wallet: ${walletAmount.toFixed(2)}</p>
        <p>Current Video: {videoNumber}</p>
        <p>Video Playing: {videoState.isPlaying ? "Yes" : "No"}</p>
      </div>

      {/* Two Betting Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BetButton
          walletAmount={walletAmount}
          setWalletAmount={setWalletAmount}
          videoState={videoState}
          videoNumber={videoNumber}
        />
        <BetButton
          walletAmount={walletAmount}
          setWalletAmount={setWalletAmount}
          videoState={videoState}
          videoNumber={videoNumber}
        />
      </div>
    </div>
  );
};

export default BettingGame;
