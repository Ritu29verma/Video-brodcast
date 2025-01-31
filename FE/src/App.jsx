import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './pages/Admin';
import Client from './pages/Client';
import Login from './pages/Login';
import Register from './pages/Register';
import LoginUser from "./pages/LoginUser"
import PrivateRoute from './pages/PrivateRoute';
import GameResults from './components/GameResults';
import { ToastContainer,toast } from 'react-toastify'; 
import FinalAdmin from './pages/FinalAdmin';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/homepage" element={<PrivateRoute role="client"><Client /></PrivateRoute>}  />
        <Route path="/" element={<PrivateRoute><Client /></PrivateRoute>}  />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login-client" element={<LoginUser />} />
        <Route path="/game" element={<GameResults/>} />

        <Route path="/admin" element={<Admin/>} />
        <Route path="/main" element={<PrivateRoute ><FinalAdmin/></PrivateRoute>} />
         </Routes>
         <ToastContainer autoClose={600} />
      

      
    </Router>
  );
};

export default App;
