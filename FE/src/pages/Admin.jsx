import React, {useRef, useEffect, useState } from 'react';
import VideoPlayerAdmin from '../components/VideoPlayerAdmin';
import socket from "../components/socket";
import { useNavigate } from 'react-router-dom';


const Admin = () => {

  return (
    <div className="shadow-lg hover:bg-[#021024] flex flex-col items-center min-h-screen justify-center bg-gray-900 text-white p-6">
    <VideoPlayerAdmin />
  </div>
  );
};

export default Admin;
