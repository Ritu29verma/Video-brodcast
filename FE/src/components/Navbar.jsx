import React from 'react';

const Navbar = ({ userId, walletAmount }) => {
  return (
    <nav className="bg-black p-1.5 w-full flex justify-between items-center text-white">
      {/* Left Section */}
      <div className="flex space-x-2 items-center w-full max-w-6xl">
        <h1 className="text-red-500 font-bold text-2xl">Aviator</h1>
        <button className="text-yellow-400 bg-gray-800 px-3 py-1 rounded-md hover:bg-gray-700">
          How to play?
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-400">User: {userId}</span>
        <span className="text-green-400">Wallet: ${walletAmount.toFixed(2)}</span>
      </div>
    </nav>
  );
};

export default Navbar;
