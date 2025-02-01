import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const LoginUser = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const checkClient = async (code, password) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/client/login-client`, {
        params: {
          code: code,
          password: password,
        },
      });

      // Check if the status is 200 (Client found)
      if (response.status === 200) {
        const { message, client, token } = response.data;

        sessionStorage.setItem("client_code", client.code);
        sessionStorage.setItem("name", client.name);
        sessionStorage.setItem("wallet", client.wallet_amount);
        sessionStorage.setItem("role", client.role);  // Storing the role
        sessionStorage.setItem("token", token);  // Storing the token
        socket.emit("registerUser", client.code);
        console.log(message);  // Optional: Log success message
        navigate("/homepage");
      } else {
        console.error("Client not found or incorrect password.");
      }
    } catch (error) {
      // If there's an error, log it
      console.error("Error calling the API:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("code");
    const password = queryParams.get("password");

    if (code && password) {
      checkClient(code, password);
    } else {
      console.error("Missing code or password in query parameters.");
    }
  }, [location.search]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-700">
      Loading...
    </div>
  );
};

export default LoginUser;
