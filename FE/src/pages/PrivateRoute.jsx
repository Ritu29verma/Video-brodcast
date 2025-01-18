import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (!role) {
      // Redirect to login if no role found
      navigate("/login");
      return;
    }

    // Redirect based on role
    if (role === "client") {
      navigate("/homepage");  // Redirect to client homepage
    } else if (role === "admin") {
      navigate("/admin");  // Redirect to admin page
    } else {
      navigate("/unauthorized");  // Redirect to unauthorized page if role is not recognized
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
