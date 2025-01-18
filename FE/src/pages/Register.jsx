import React, { useState } from "react";
import { FaLock, FaUserAlt, FaPhoneAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "../App.css";

const Register = () => {
  const [phoneNo, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordVisible1, setIsPasswordVisible1] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
  
    // Ensure passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
  
    // Ensure country code and phone number are valid
    if (!countryCode || !phoneNo) {
      toast.error("Please enter a valid phone number and country code");
      return;
    }
  
    // Remove the country code from phone number
    const phoneNumber = phoneNo.slice(countryCode.length);
  
    // Ensure phone number is valid (e.g., has at least 10 digits after removing the country code)
    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
  
    try {
      // Send registration data to the server
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/admin/register`,
        {
          phoneNo: phoneNumber,  
          countryCode,           
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
  
      if (response.status === 201) {
        toast.success("Sign up successful");
        
        setTimeout(() => {
          navigate("/login");
        }, 1500);

      }
    } catch (error) {
      // Log the full error object for debugging
      console.error("Error during registration:", error);
  
      if (error.response?.data?.error) {
        // Handle specific backend error messages
        if (Array.isArray(error.response.data.error)) {
          error.response.data.error.forEach((err) => toast.error(err.message));
        } else {
          toast.error(error.response.data.error);
        }
      } else {
        // Fallback error message if no specific error is provided
        toast.error("Sign up failed. Please try again.");
      }
    }
  };
  
  const handlePhoneNumberChange = (value, countryData) => {
    setPhoneNo(value); // Set phone number
    setCountryCode(countryData.dialCode); // Extract the country code separately
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const togglePasswordVisibility1 = () => {
    setIsPasswordVisible1(!isPasswordVisible1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-customBlue p-6">
      <div className="bg-gray-900 text-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold mb-2 text-center">Register As Admin</h2>
        <p className="text-center text-gray-400 mb-6">Please register by phone number</p>
        <hr className="border-blue-500 mt-2 p-2" />

        {/* Phone Number Input */}
        <label className="block text-gray-400 text-sm font-semibold mb-2">
        <FaPhoneAlt className="inline-block mr-2" /> Phone number
      </label>
      <div className="">
      <PhoneInput
          country={"in"}
          value={phoneNo}
          onChange={(value, countryData) => handlePhoneNumberChange(value, countryData)}
          specialLabel="Phone Number"
          placeholder="XXXXXXXXXX"
          inputClass=""
    
          containerStyle={{
            backgroundColor: "#1f2937", // Matches bg-gray-800
            borderRadius: "8px", // Matches rounded-md
            padding: "8px", // Matches p-2
            marginBottom: "16px", // Matches mb-4
          }}
          
          disableDropdown={false}
        />

        </div>
        <p className="text-xs text-gray-500 mb-4">The phone number cannot start with 0 when registering!</p>

        {/* Password Input */}
        <label className="block text-gray-400 text-sm font-semibold mb-2">Set Password</label>
        <div className="flex items-center bg-gray-800 rounded-md p-2 mb-4">
          <input
            type={isPasswordVisible ? "text" : "password"}
            placeholder="Please enter the password"
            className="bg-transparent p-2 flex-grow outline-none text-gray-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div onClick={togglePasswordVisibility} className="cursor-pointer text-gray-500">
            {isPasswordVisible ? <FaEye /> : <FaEyeSlash />}
          </div>
        </div>

        {/* Confirm Password Input */}
        <label className="block text-gray-400 text-sm font-semibold mb-2">
          <FaLock className="inline-block mr-2" /> Confirm Password
        </label>
        <div className="flex items-center bg-gray-800 rounded-md p-2 mb-4">
          <input
            type={isPasswordVisible1 ? "text" : "password"}
            placeholder="Please enter the confirm password"
            className="bg-transparent p-2 flex-grow outline-none text-gray-200"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div onClick={togglePasswordVisibility1} className="cursor-pointer text-gray-500">
            {isPasswordVisible1 ? <FaEye /> : <FaEyeSlash />}
          </div>
        </div>

        {/* Register Button */}
        <button
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition-colors mb-4"
          onClick={handleRegister}
        >
          Register
        </button>

        {/* Navigate to Login Page */}
        <p className="text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Log in
          </span>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Register;
