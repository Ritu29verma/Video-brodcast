import React from 'react';

const CoinReachInput = ({ coinReach, setCoinReach, handleCoinReach }) => {
  return (
    <div className="coin-reach-input">
      <label>Set Coin Reach Value:</label>
      <input
        type="number"
        value={coinReach}
        onChange={(e) => setCoinReach(parseFloat(e.target.value))}
        className="input"
      />
      <button onClick={handleCoinReach}>Set Value</button>
    </div>
  );
};

export default CoinReachInput;
