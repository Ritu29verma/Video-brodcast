import React, {  useState , useEffect} from "react";
import VideoPlayer from "../components/VideoPlayer";
import socket from "../components/socket";

const FinalAdmin = () => {
    const [inputValue, setInputValue] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoList, setVideoList] = useState([]);

 const fetchVideoList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`);
      const data = await response.json();
      return data.videos;
    } catch (error) {
      console.error("Error fetching videos:", error);
      return []; 
    }
  };
  
  useEffect(() => {
    const loadVideos = async () => {
      const videos = await fetchVideoList();
      setVideoList(videos);
      console.log(videoList); // Log the fetched videos
    };
  
    loadVideos();
    socket.on("fetch_current_state", (state) => {
        if (state && state.url) {
          setSelectedVideo(state.url);
          console.log("Initial video state set:", state.url);
        }
      });
  
      socket.on("video_change", (state) => {
        if (state && state.url) {
          setSelectedVideo(state.url);
          console.log("Video changed to:", state.url);
        }
      });
      return () => {
        socket.off("fetch_current_state");
        socket.off("video_change");
      };
  }, []);
    
    const handleSubmit = (e) => {
      e.preventDefault();
  
      if (!isNaN(inputValue) && inputValue > 0) {
        const value = Number(inputValue);
        socket.emit("setvalue", value);
        console.log("CoinReach value emitted:", value);
        setInputValue(""); // Clear input after submission
      }
    };
  
    const handleFlyAway = () => {socket.emit("flyaway");};
  
    const isButtonEnabled = selectedVideo === `${import.meta.env.VITE_BASE_URL}/videos/${videoList[0]}`;
  
    return (
      <div className="flex flex-col items-center p-4 space-y-4 bg-gray-800 text-white h-screen">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="number"
            placeholder="Enter Coin Reach"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="text-black px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded ml-2 hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!isButtonEnabled}
          >
            Add Value
          </button>
        </form>

          {/* Video Player Section */}
      <div className="w-full max-w-4xl mb-6">
        <VideoPlayer />
      </div>
  
        <ul className="w-full max-w-4xl space-y-2">
          <li key={videoList[2]}>
            <button
              onClick={() => {
                handleFlyAway();
              }}
              className={`w-full text-left px-4 py-2 rounded ${
                selectedVideo === `${import.meta.env.VITE_BASE_URL}/videos/${videoList[2]}`
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-200"
              } hover:bg-blue-500`}
            >
              Fly Away
            </button>
          </li>
        </ul>
      </div>
    );
  };
  
  export default FinalAdmin;