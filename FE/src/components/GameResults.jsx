import React, { useEffect, useState } from 'react';

const GameResults = () => {
  const [gameResults, setGameResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameResults = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/game/games`); // Replace with your API URL
        const data = await response.json();
        if (data.success) {
          setGameResults(data.data);
        }
      } catch (error) {
        console.error('Error fetching game results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameResults();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Game Results</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-4 py-2">Game ID</th>
              <th className="border border-gray-400 px-4 py-2">Coin Reach</th>
              <th className="border border-gray-400 px-4 py-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {gameResults.map((game) => (
              <tr key={game.gameId}>
                <td className="border border-gray-400 px-4 py-2">{game.gameId}</td>
                <td className="border border-gray-400 px-4 py-2">{game.coinReach}</td>
                <td className="border border-gray-400 px-4 py-2">
                  {new Date(game.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GameResults;
