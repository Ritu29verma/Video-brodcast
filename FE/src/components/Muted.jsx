const Muted = ({ isMuted, handleMuteToggle }) => {
  return (
    <div>
      <button
        onClick={handleMuteToggle}
        className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition"
      >
        {isMuted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
};

export default Muted;
