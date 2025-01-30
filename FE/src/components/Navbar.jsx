import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

const Navbar = ({ userId , walletAmount }) => {
  const [isMuted, setIsMuted] = useState(true); // Mute state
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Dropdown state
  const videoRef = useRef(null); // Video reference

  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Ensure video mute state updates
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <nav className="bg-black p-3 w-full flex justify-between items-center text-white">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        <h1 className="text-red-500 font-bold text-2xl">Aviator</h1>
        {/* <button className="text-yellow-400 bg-gray-800 px-3 py-1 rounded-md hover:bg-gray-700">
          How to play?
        </button> */}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-400">User : {userId}</span>
        <span className="text-green-400">Wallet: Rs.{walletAmount.toFixed(2)}</span>

        {/* Mute/Unmute Button (Desktop) */}
        <button
          onClick={toggleMute}
          className="hidden md:block bg-gray-800 p-2 rounded-md hover:bg-gray-700"
        >
          {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
        </button>

        {/* Hamburger Menu (Mobile) */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Dropdown Menu (Mobile) */}
      {isMenuOpen && (
        <div className="absolute top-14 right-4 bg-gray-900 text-white z-1 rounded-md shadow-lg p-3 w-40 z-50">
          <button 
            onClick={toggleMute}
            className="flex items-center space-x-2 w-full text-left py-2 px-3 hover:bg-gray-700 rounded-md"
          >
            {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
