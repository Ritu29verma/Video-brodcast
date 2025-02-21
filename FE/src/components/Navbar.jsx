import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaTimes, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import socket from "../components/socket";
import axios from "axios";

const Navbar = ({ userId, isMuted, handleMuteToggle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = useRef(null);
  const [walletAmount, setWalletAmount] = useState(0); // Ensure it's initialized as a number

  const fetchWalletAmount = async () => {
    try {
      const clientCode = sessionStorage.getItem("client_code");
      if (!clientCode) return 0; // Ensure we return a valid number

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/client/get-wallet-amount`,
        { params: { clientCode } }
      );

      const walletAmount = parseFloat(response.data.wallet_amount) || 0; // Ensure it's a number

      sessionStorage.setItem("wallet", walletAmount);
      return walletAmount;
    } catch (error) {
      console.error("Error fetching wallet amount:", error);
      return 0; // Return a default number in case of error
    }
  };

  useEffect(() => {
    const loadWalletAmount = async () => {
      const storedWallet = parseFloat(sessionStorage.getItem("wallet")) || 0;
      setWalletAmount(storedWallet);

      if (!storedWallet) {
        const initialWallet = await fetchWalletAmount();
        setWalletAmount(initialWallet);
      }
    };

    loadWalletAmount();

    socket.on("walletUpdated", async ({ WalletBalance }) => {
      const balance = parseFloat(WalletBalance) || 0;
      sessionStorage.setItem("wallet", balance);
      setWalletAmount(balance);
    });

    return () => {
      socket.off("walletUpdated");
    };
  }, []);

  return (
    <nav className="bg-black p-1 w-full flex justify-between items-center text-white">
      <div className="flex items-center space-x-3">
        <h1 className="text-red-500 font-bold text-2xl">Aviator</h1>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-gray-400">User : {userId}</span>
        <span className="text-green-400">
          Wallet: Rs. {walletAmount.toFixed(2)}
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
