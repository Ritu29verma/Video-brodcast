import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem("role");

    if (!role) {
      navigate("/login");
      return;
    }
    if (role === "client") {
      navigate("/homepage");  
    // } else if (role === "admin") {
    //   navigate("/main");  
    } else {
      navigate("/main");
    }

    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin-slow border-brown"></div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
