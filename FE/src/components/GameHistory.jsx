import React from 'react';

const GameHistory = ({ history }) => {
  return (
    <div className="p-4 bg-gray-800 rounded shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4">Game History</h3>
      <ul className="space-y-2">
        {history.map((game, index) => (
          <li
            key={index}
            className="flex justify-between items-center text-gray-400 border-b border-gray-700 pb-2"
          >
            <span>Game {index + 1}</span>
            <span>Coin Reach: {game.coinReach}x</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameHistory;
