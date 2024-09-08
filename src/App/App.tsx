import React, { useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import * as Hands from '@mediapipe/hands';
import * as Camera from '@mediapipe/camera_utils';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MenuButton2 from '../components/MenuButton2';
import Record from '../Record/Record';
import Saved from '../Saved/Saved';
import Settings from '../Settings/Settings';
import './App.css';

const Home: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [subtitleText, setSubtitleText] = useState<string>('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8765');

    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
      const message = {
        function: 'reset_data',
        args: [],
      };
      socketRef.current?.send(JSON.stringify(message));
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.result) {
        setSubtitleText(data.result);
      }
      console.log('Message from server:', data);
    };
  }, []);

  useEffect(() => {
    const hands = new Hands.Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current as Hands.InputImage});
        },
        width: 640,
        height: 480
      });
      camera.start();
    }
  }, []);

  const onResults = (results: Hands.Results) => {
    const message = {
      function: 'recieve',
      args: [results, "translate"],
    };
    socketRef.current?.send(JSON.stringify(message));
  };

  const handleClick = () => {
    setIsVideoVisible((prev) => !prev);
  };

  const handlePlayButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handleClick();
  };



  return (
    <div onClick={handleClick} className="home-container">
      <video 
        ref={videoRef} 
        className={`video-element ${isVideoVisible ? 'visible' : 'blurred'}`} 
        autoPlay 
        playsInline 
        muted 
        style={{transform: 'scaleX(-1)'}} 
      />
      <img 
        src='/abc350image.png' 
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '80%', // Adjust this value as needed
          height: 'auto', // Maintain aspect ratio
          maxWidth: '100%', // Prevent overflow
          maxHeight: '100%' // Prevent overflow
        }} 
      />
      {!isVideoVisible && (
        <div className="overlay">
          <button onClick={handlePlayButtonClick} className="play-button">
            <FaPlay className="play-icon" />
          </button>
        </div>
      )}
      {subtitleText && (
        <div className="subtitle-container">
          <p className="subtitle-text">{subtitleText}</p>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <MenuButton2 />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/record" element={<Record />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;