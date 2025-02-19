import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import socket from "../components/socket";
import axios from 'axios';

const Navbar = ({ userId , isMuted, handleMuteToggle  }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Dropdown state
  const videoRef = useRef(null); // Video reference
  const [walletAmount, setWalletAmount] = useState(0);

  const fetchWalletAmount = async () => {
    try {
      const clientCode = sessionStorage.getItem("client_code");
      if (!clientCode) return null;

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/client/get-wallet-amount`,
        { params: { clientCode } }
      );

      const walletAmount = response.data.wallet_amount;

      // Store in sessionStorage
      sessionStorage.setItem("wallet", walletAmount);
      return walletAmount;
    } catch (error) {
      console.error("Error fetching wallet amount:", error);
      return null;
    }
  };

  useEffect(() => {
    // Fetch wallet amount once when the page loads
    const loadWalletAmount = async () => {
      const storedWallet = sessionStorage.getItem("wallet");

      if (storedWallet) {
        setWalletAmount(parseFloat(storedWallet));
      } else {
        const initialWallet = await fetchWalletAmount();
        if (initialWallet !== null) {
          setWalletAmount(initialWallet);
        }
      }
    };

    loadWalletAmount();

    // Listen for WebSocket wallet updates
    socket.on("walletUpdated", async ({ WalletBalance }) => {
      sessionStorage.setItem("wallet", WalletBalance);
      loadWalletAmount();
    });

    return () => {
      socket.off("walletUpdated");
    };
  }, []);

  // Ensure video mute state updates
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    socket.on("walletUpdated", ({ WalletBalance}) => {
        setWalletAmount(WalletBalance);
    });

    return () => {
      socket.off("walletUpdated");
    };
  }, [setWalletAmount]);

  return (
    <nav className="bg-black p-1 w-full flex justify-between items-center text-white">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        <h1 className="text-red-500 font-bold text-2xl">Aviator</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-400">User : {userId}</span>
        <span className="text-green-400">
          Wallet: Rs.{walletAmount}
        </span>

        {/* Mute/Unmute Button (Desktop) */}
        {/* <button
          onClick={handleMuteToggle}
          className="hidden md:block bg-gray-800 p-2 rounded-md hover:bg-gray-700"
        >
          {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
        </button> */}

        {/* Hamburger Menu (Mobile) */}
        {/* <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button> */}
      </div>

      {/* Dropdown Menu (Mobile) */}
      {/* {isMenuOpen && (
        <div className="absolute top-14 right-4 bg-gray-900 text-white z-1 rounded-md shadow-lg p-3 w-40 z-50">
          <button 
            onClick={handleMuteToggle}
            className="flex items-center space-x-2 w-full text-left py-2 px-3 hover:bg-gray-700 rounded-md"
          >
            {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        </div>
      )} */}
    </nav>
  );
};

export default Navbar;
