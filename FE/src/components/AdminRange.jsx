import React, { useEffect, useState } from "react";

const AdminRanges = () => {
  const [ranges, setRanges] = useState([]);
  const [formData, setFormData] = useState({ minTotalInGame: "", maxTotalInGame: "", minCoinReach: "", maxCoinReach: "" });

  useEffect(() => {
    fetchRanges();
  }, []);

  const fetchRanges = async () => {
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/game/get-gameRanges`);
    const data = await response.json();
    setRanges(data);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formattedData = {
      minTotalInGame: parseFloat(formData.minTotalInGame),
      maxTotalInGame: parseFloat(formData.maxTotalInGame),
      minCoinReach: parseFloat(formData.minCoinReach),
      maxCoinReach: parseFloat(formData.maxCoinReach),
    };
  
    await fetch(`${import.meta.env.VITE_BASE_URL}/api/game/set-gameRange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formattedData),
    });
  
    setFormData({ minTotalInGame: "", maxTotalInGame: "", minCoinReach: "", maxCoinReach: "" });
    fetchRanges(); // Refresh data after submission
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Game Ranges</h2>
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
        {Object.keys(formData).map((key) => (
          <input 
            key={key}
            type="number" 
            name={key} 
            placeholder={key.replace(/([A-Z])/g, ' $1').trim()} 
            step="any" 
            value={formData[key]} 
            onChange={handleChange} 
            required 
            className="p-2 border border-gray-300 rounded text-gray-800"
          />
        ))}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Range</button>
      </form>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-gray-800">
            <th className="border border-gray-300 p-2">Min Total</th>
            <th className="border border-gray-300 p-2">Max Total</th>
            <th className="border border-gray-300 p-2">Min Coin Reach</th>
            <th className="border border-gray-300 p-2">Max Coin Reach</th>
          </tr>
        </thead>
        <tbody>
          {ranges.map((range, index) => (
            <tr key={index} className="text-center">
              <td className="border border-gray-300 p-2">{range.minTotalInGame}</td>
              <td className="border border-gray-300 p-2">{range.maxTotalInGame}</td>
              <td className="border border-gray-300 p-2">{range.minCoinReach}</td>
              <td className="border border-gray-300 p-2">{range.maxCoinReach}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRanges;