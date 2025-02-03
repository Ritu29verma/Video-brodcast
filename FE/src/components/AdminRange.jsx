import React, { useEffect, useState } from "react";
import { FaEllipsisV, FaEdit, FaTrash} from "react-icons/fa";
import { IoIosArrowDropdown } from "react-icons/io";
const AdminRanges = () => {
  const [ranges, setRanges] = useState([]);
  const [formData, setFormData] = useState({ minTotalInGame: "", maxTotalInGame: "", minCoinReach: "", maxCoinReach: "" });
  const [editData, setEditData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

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

  const handleEditClick = (range) => {
    setEditData(range);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleDeleteClick = async (id) => {
    await fetch(`${import.meta.env.VITE_BASE_URL}/api/game/delete-gameRange/${id}`, { method: "DELETE" });
    fetchRanges();
    setOpenDropdown(null);
  };

  const handleSaveEdit = async () => {
    await fetch(`${import.meta.env.VITE_BASE_URL}/api/game/update-gameRange/${editData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setIsModalOpen(false);
    fetchRanges();
  };

  const handleModalChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });


  return (
    <div className="overflow-hidden flex-grow p-4 mt-4 bg-gray-700 rounded-lg shadow-lg w-full max-w-4xl z-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Manage Game Ranges</h2>

      {/* Responsive Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {Object.keys(formData).map((key) => (
          <div key={key} className="relative w-full group">
            <input
              type="number"
              id={key}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              required
              className="peer w-full p-3 text-white bg-transparent border border-gray-400 rounded-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition duration-150
                [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-moz-appearance:textfield]"
            />
            <label
              htmlFor={key}
              className={`absolute left-3 px-1 bg-gray-700 text-gray-400 text-sm transition-all duration-150 
                ${formData[key] ? "top-[-8px] text-white text-sm" : "top-3 group-hover:top-[-8px] group-hover:text-white"}`}
            >
              {key.replace(/([A-Z])/g, " $1").trim()}
            </label>
          </div>
        ))}
        
        <button
          type="submit"
          className="col-span-1 sm:col-span-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Add Range
        </button>
      </form>

      {/* Responsive Table with Scrollbar */}
      <div className="max-h-[calc(100vh-460px)] md:text-base text-xs overflow-y-auto border border-gray-600 rounded-lg scrollbar-hide">
        <table className="w-full border-collapse border border-gray-600">
          <thead className="sticky top-0 bg-gray-800 text-gray-300 z-20">
            <tr>
              <th className="border border-gray-600 p-2">Min Total</th>
              <th className="border border-gray-600 p-2">Max Total</th>
              <th className="border border-gray-600 p-2">Min Coin Reach</th>
              <th className="border border-gray-600 p-2">Max Coin Reach</th>
              <th className="border border-gray-600 p-2 ">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ranges.map((range, index) => (
              <tr key={index} className="text-center bg-gray-900">
                <td className="border border-gray-600 p-2">{range.minTotalInGame}</td>
                <td className="border border-gray-600 p-2">{range.maxTotalInGame}</td>
                <td className="border border-gray-600 p-2">{range.minCoinReach}</td>
                <td className="border border-gray-600 p-2">{range.maxCoinReach}</td>
                <td className="border border-gray-600 p-2 relative">
                <button
                    className="text-white p-2 rounded-full hover:bg-gray-600 transition z-10"
                    onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                  >
                   <IoIosArrowDropdown />
                  </button>
                  {openDropdown === index && (
                    <div className="absolute right-0 -mt-9 bg-gray-800 rounded-md shadow-lg z-10">
                      <ul className="text-gray-300  z-10">
                      <li
                  className="hover:bg-gray-700 cursor-pointer flex items-center p-2 "
               onClick={() => handleEditClick(range)}>
             <FaEdit className="text-lg text-purple-500" />
               </li>
             <li
             className="hover:bg-gray-700 cursor-pointer flex items-center p-2"
              onClick={() => handleDeleteClick(range.id)}>
            <FaTrash className="text-lg text-red-500" />
               </li>

                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Range</h3>
            <form>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Min Total</label>
                <input
                  type="number"
                  name="minTotalInGame"
                  value={editData.minTotalInGame}
                  onChange={handleModalChange}
                  className="w-full p-3 text-white bg-transparent border border-gray-400 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Max Total</label>
                <input
                  type="number"
                  name="maxTotalInGame"
                  value={editData.maxTotalInGame}
                  onChange={handleModalChange}
                  className="w-full p-3 text-white bg-transparent border border-gray-400 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Min Coin Reach</label>
                <input
                  type="number"
                  name="minCoinReach"
                  value={editData.minCoinReach}
                  onChange={handleModalChange}
                  className="w-full p-3 text-white bg-transparent border border-gray-400 rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Max Coin Reach</label>
                <input
                  type="number"
                  name="maxCoinReach"
                  value={editData.maxCoinReach}
                  onChange={handleModalChange}
                  className="w-full p-3 text-white bg-transparent border border-gray-400 rounded-lg"
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRanges;