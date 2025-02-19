import { useState , useEffect} from "react";
import axios from "axios";
import socket from "../components/socket";

export default function CoinReachAdmin() {
  const [coinReachList, setCoinReachList] = useState([]);
  const [coinReach, setCoinReach] = useState('');
  const [currentMultiplier, setCurrentMultiplier] = useState();

  // Add Coin Reach Value to the list (FE only)
  const handleAddCoinReach = () => {
    if (!isNaN(coinReach) && coinReach > 0) {
      setCoinReachList((prevList) => [...prevList, parseFloat(coinReach)]);
      setCoinReach(''); // Clear input
    }
  };

  // Update and remove value when condition is met
  const handleCurrentMultiplierUpdate = async (currentMultiplier) => {
    if (coinReachList.length > 0 && currentMultiplier >= coinReachList[0]) {
      const reachedValue = coinReachList[0];

      // Send reached value to the backend
      try {
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/game/set-coin-reach`,
          { coinReach: reachedValue }
        );
      } catch (error) {
        console.error("Error sending coinReach to backend:", error);
      }

      // Remove the value from the list
      setCoinReachList((prevList) => prevList.slice(1));
    }
  };

  useEffect(() => {
    socket.on("update_multiplier", (multiplier) => {
      setCurrentMultiplier(multiplier); // Update the current multiplier
      handleCurrentMultiplierUpdate(multiplier); // Check and trigger logic
    });

    return () => {
      socket.off("update_multiplier"); // Cleanup listener on unmount
    };
  }, [coinReachList]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex flex-col items-center">
        <label className="text-xl font-semibold mb-2 block">Set Coin Reach Value:</label>
        <div className="flex items-center">
          <input
            type="number"
            placeholder="Enter Coin Reach"
            value={coinReach}
            onChange={(e) => setCoinReach(e.target.value)}
            className="text-black px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddCoinReach}
            className="bg-blue-600 text-white px-4 py-2 rounded ml-2 hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isNaN(coinReach) || coinReach <= 0}
          >
            Add Value
          </button>
        </div>
      </div>

      <div className="text-black bg-gray-100 p-4 rounded-lg shadow-md max-w-md mx-auto my-4">
        <h3 className="text-lg font-semibold mb-3 text-center">Upcoming Coin Reach Values:</h3>
        {coinReachList.length > 0 ? (
          <ul className="rounded-md p-3 text-black bg-white border border-gray-300">
            {coinReachList.map((value, index) => (
              <li key={index} className="py-1 px-2 text-black">
                <span className="font-bold text-blue-600">{index + 1}. </span>
                {value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600">No Coin Reach values added yet.</p>
        )}
      </div>

      {/* <div className="bg-gray-100 p-4 rounded-lg shadow-md max-w-md mx-auto my-4">
        <h3 className="text-lg font-semibold mb-3 text-center">Current Multiplier:</h3>
        <p className="text-center text-black text-2xl">{currentMultiplier.toFixed(1)}</p>
      </div> */}
    </div>
  );
}