import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaPlay } from 'react-icons/fa';
import * as Hands from '@mediapipe/hands';
import * as Camera from '@mediapipe/camera_utils';
import './Home.css';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

const Home: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const cameraRef = useRef<Camera.Camera | null>(null);
  const handsRef = useRef<Hands.Hands | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8765');

    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const initializeMediaPipe = useCallback(async () => {
    if (isCameraInitialized || !videoRef.current) return;

    console.log('Initializing MediaPipe');
    
    handsRef.current = new Hands.Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
      }
    });
  
    handsRef.current.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  
    handsRef.current.onResults(onResults);
  
    try {
      cameraRef.current = new Camera.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current && 
              videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            await handsRef.current.send({image: videoRef.current});
          }
        },
        width: 640,
        height: 480
      });
      await cameraRef.current.start();
      console.log('Camera started');
      setIsCameraInitialized(true);
      setIsVideoVisible(true);
    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('Camera access denied. Please allow camera access and reload the page.');
      }
    }
  }, [isCameraInitialized]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      setIsCameraInitialized(false);
    };
  }, []);

  const onResults = (results: Hands.Results) => {
    const message = {
      function: 'recieve',
      args: [results],
    };
    socketRef.current?.send(JSON.stringify(message));
  };

  const handleClick = () => {
    setIsVideoVisible((prev) => !prev);
  };

  const handlePlayButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handleClick();
    if (!isCameraInitialized) {
      initializeMediaPipe();
    }
  };

  return (
    <div onClick={handleClick} className="home-container">
      <video 
        ref={videoRef} 
        className={`video-element ${isVideoVisible ? 'visible' : 'blurred'}`} 
        autoPlay 
        playsInline 
        muted 
        style={{
          transform: 'scaleX(-1)',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }} 
      />
      {!isVideoVisible && (
        <div className="overlay">
          <button onClick={handlePlayButtonClick} className="play-button">
            <FaPlay className="play-icon" />
          </button>
        </div>
      )}
      {isLoading && <LoadingScreen />}
    </div>
  );
};

export default Home;