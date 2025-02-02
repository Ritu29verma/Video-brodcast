import React, { useState, useEffect, useRef } from 'react';
import socket from "../components/socket";
import { useNavigate } from 'react-router-dom';

const AdminNav = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role")
      navigate("/login");
      socket.emit('admin_logout');
    };

  return (
    <nav className="bg-black p-3 w-full flex justify-between items-center text-white">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        <h1 className="text-red-500 font-bold text-2xl">Aviator</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
      <button
        onClick={handleLogout}
        className="bg-cyan-600 text-white hover:bg-white hover:text-cyan-600 transform transition-transform hover:scale-95 font-bold px-4 py-1 rounded"
      >
        Logout
      </button>
     </div>
    </nav>
  );
};

export default AdminNav;
