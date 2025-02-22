import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from "../components/socket";

const VideoPlayerAdmin = () => {
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef(null);
    const [currentMultiplier, setCurrentMultiplier] = useState();
    const [showOverlay, setShowOverlay] = useState(false);
    const [currentState, setCurrentState] = useState({
        url: null,
        isPlaying: false,
        currentTime: 0,
        isMuted: false,
    });
    const [stopLoop, setStopLoop] = useState(false);
    const [videoList, setVideoList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);  // Added loading state

    const fetchVideoList = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/videos-list`);
            const data = await response.json();
            return data.videos; // Return the video list instead of setting state
        } catch (error) {
            console.error("Error fetching videos:", error);
            return [];
        }
    };

    //Moved the content of the loadVideos to this use effect
    useEffect(() => {
        const loadVideosAndStart = async () => {
            setIsLoading(true); // Set loading to true while fetching
            try {
                const videos = await fetchVideoList();
                setVideoList(videos);
                console.log("Fetched video list:", videos); // Log the fetched videos
                if (videos.length > 0) {
                    await handleSelectVideo(videos[0]);  // Start with the first video
                } else {
                    console.warn("No videos found in the list!");
                }
            } catch (error) {
                console.error("Error during video loading:", error);
            } finally {
                setIsLoading(false); // Set loading to false when done
            }
        };

        loadVideosAndStart();
    }, []);

    useEffect(() => {
        if (currentState.isPlaying && videoRef.current) {
            const interval = setInterval(() => {
                const updatedState = {
                    url: currentState.url,
                    currentTime: videoRef.current.currentTime,
                    isPlaying: !videoRef.current.paused,
                    isMuted: videoRef.current.muted || false,
                };
                socket.emit('admin_control', updatedState);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [currentState.isPlaying, currentState.url]);

    const handleVideoEnd = () => {
        if (stopLoop) return;
        const currentIndex = videoList.indexOf(selectedVideo.split('/').pop());
        if (currentIndex === 0 || currentIndex === 1) {
            if (currentIndex < videoList.length - 1) {
                const nextVideo = videoList[currentIndex + 1];
                handleSelectVideo(nextVideo);
            }
        } else if (currentIndex === 2) {
            handleSelectVideo(videoList[0]);
        }
    };

    const handleSelectVideo = async (video) => {
        setStopLoop(false);
        const videoUrl = `${import.meta.env.VITE_BASE_URL}/videos/${video}`;
        const updatedState = {
            url: videoUrl,
            currentTime: 0,
            isPlaying: true,
            isMuted: isMuted,
        };
        setSelectedVideo(videoUrl);
        setCurrentState(updatedState);
        setShowOverlay(video === videoList[1]);
        setCurrentMultiplier(1.0);
        console.log(videoUrl);
        socket.emit('video_change', { url: videoUrl, isPlaying: true });

        if (videoRef.current) {
            videoRef.current.src = videoUrl;
            videoRef.current.currentTime = 0;
            videoRef.current.muted = true;

            try {
                await videoRef.current.play();
            } catch (error) {
                videoRef.current.muted = false;
                try {
                    await videoRef.current.play();
                    console.log('Autoplay restriction resolved with muted playback.');
                } catch (err) {
                    console.error('Autoplay retry failed:', err);
                }
            }
        }

        if (video === videoList[1]) {
            socket.emit("start_multiplier"); // Emit to start multiplier
        }
        if (video === videoList[0]) {
            socket.emit("reset_game"); // Emit to reset the game
        }
    };

    useEffect(() => {
        socket.on("update_multiplier", (multiplier) => {
            setCurrentMultiplier(multiplier);
        });

        socket.on("play_3rd_video", async () => {
            console.log("Play 3rd video");
            const videos = await fetchVideoList();
            setVideoList(() => videos);

            // Ensure handleSelectVideo runs after videoList is updated
            if (videos.length > 2) {
                console.log(videos[2]); // Debugging: Check if index 2 exists
                handleSelectVideo(videos[2]);
            } else {
                console.warn("Not enough videos in the list!");
            }
        });
        return () => {
            socket.off("update_multiplier");
            socket.off("play_3rd_video");
        };
    }, []);

    return (
        <>
            <div className="flex items-center">
            </div>
            {isLoading ? (
                <p>Loading videos...</p> // Display loading message
            ) : (
                <div className="relative">
                    {selectedVideo && (
                        <video
                            ref={videoRef}
                            src={selectedVideo}
                            onEnded={handleVideoEnd}
                            className="w-full"
                            data-testid="video-element" // Add data-testid
                            autoPlay
                            muted  // Ensure the video is muted for autoplay
                        />
                    )}
                    {showOverlay && (
                        <div className="absolute inset-0 bg-opacity-50 flex justify-center items-center">
                            <span className="text-white font-bold text-5xl">{currentMultiplier?.toFixed(1)}x</span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default VideoPlayerAdmin;
