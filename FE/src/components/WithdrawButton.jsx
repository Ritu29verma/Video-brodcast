import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; 
import socket from "../components/socket";

const WithdrawButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');


  const handleWithdraw = async (e) => {
    e.preventDefault();


    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/withdraw`, { amount: parseFloat(amount) });
      toast.success(`Withdrawal successful.`);
      
      setAmount(''); // Clear input field after successful withdrawal
      setShowModal(false); // Hide modal after successful withdrawal
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to withdraw amount');
      }
    }
  };

  const handleToggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="bg-cyan-600 text-white hover:bg-white hover:text-cyan-600 transform transition-transform hover:scale-95 font-bold px-4 py-1 rounded"
        onClick={handleToggleModal}
      >
        Withdraw
      </button>
      {showModal && (
        <div
          className="bg-white shadow-md rounded absolute top-full right-0 mt-2 p-4 w-64"
          style={{ zIndex: 1 }}
        >
          <form onSubmit={handleWithdraw}>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="p-2 border border-gray-400 rounded mb-4 w-full text-gray-900"
            />
            <div className="flex justify-between">
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                onClick={handleToggleModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Confirm
              </button>
            </div>
          </form>

        </div>
      )}
    </div>
  );
};

export default WithdrawButton;
