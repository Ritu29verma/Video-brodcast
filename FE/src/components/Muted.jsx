import { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

const Muted = () => {
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const socket = useRef(null);  // Use a ref to keep the socket connection consistent

  useEffect(() => {
    // Connect to the socket server
    socket.current = io(import.meta.env.VITE_BASE_URL);

    // Listen for mute/unmute events from the backend
    socket.current.on('toggle_mute', (muteState) => {
      setIsMuted(muteState);
      if (videoRef.current) {
        videoRef.current.muted = muteState;
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // Toggle mute/unmute and send the state to the backend
  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
    socket.current.emit('toggle_mute', !isMuted); // Send the new mute state to the backend
  };

  return (
    <div>
      <button onClick={handleMuteToggle}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
};

export default Muted;
