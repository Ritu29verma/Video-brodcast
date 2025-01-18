import React from 'react';

const Navbar = ({ userId, walletAmount }) => {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center text-white">
      <div className="flex items-center space-x-4">
        <a href="#" className="hover:text-yellow-500">FreeBets</a>
        <a href="#" className="hover:text-yellow-500">MyBetHistory</a>
        <a href="#" className="hover:text-yellow-500">GameLimits</a>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-400">User: {userId}</span>
        <span className="text-green-400">Wallet: ${walletAmount.toFixed(2)}</span>
      </div>
    </nav>
  );
};

export default Navbar;
