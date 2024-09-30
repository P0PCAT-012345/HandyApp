// src/App.tsx

import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Record from '../Record/Record';
import Saved from '../Saved/Saved';
import Settings from '../Settings/Settings'; // Import Settings component
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import Login from '../Login/Login';
import './App.css';
import '../VideoStyles.css'; // Import shared video styles
import Webcam from 'react-webcam';
import { FaPlay } from 'react-icons/fa';

interface SocketMessageProps {
  result: string;
  function: string;
}

interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
}

const Home: React.FC<HomeProps> = ({ socketRef, socketMessage, isConnected }) => {
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [webcamDimensions, setWebcamDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleClick = () => {
    setIsVideoVisible((prev) => !prev);
    const message = JSON.stringify({
      function: 'reset_data',
    });

    socketRef.current?.send(message);
    setSubtitleText('');
  };

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
  }, []);

  useEffect(() => {
    if (isVideoVisible && webcamRef.current) {
      const updateWebcamDimensions = () => {
        const webcamElement = webcamRef.current?.video;

        if (webcamElement) {
          const { width, height, top, left } = webcamElement.getBoundingClientRect();
          setWebcamDimensions({ width, height, top, left });
        }
      };

      updateWebcamDimensions();

      window.addEventListener('resize', updateWebcamDimensions);

      return () => {
        window.removeEventListener('resize', updateWebcamDimensions);
      };
    }
  }, [isVideoVisible]);

  useEffect(() => {
    if (isVideoVisible && webcamRef.current && canvasRef.current) {
      const captureImage = () => {
        const video = webcamRef.current?.video;
        if (!video) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (canvas && ctx) {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          canvas.width = videoWidth;
          canvas.height = videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const base64Image = canvas.toDataURL('image/jpeg');
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
              function: 'recieve',
              args: [base64Image],
              kwargs: { mode: 'translate' },
            });

            socketRef.current.send(message);
          }
        }
      };

      const intervalId = setInterval(captureImage, 50);

      return () => clearInterval(intervalId);
    }
  }, [isVideoVisible, socketRef]);

  useEffect(() => {
    if (socketMessage && socketMessage.function === 'recieve' && socketMessage.result) {
      if (socketMessage.result === 'No match found') {
        setSubtitleText('');
      } else {
        setSubtitleText(socketMessage.result);
      }
    }
  }, [socketMessage]);

  return (
    <div onClick={handleClick} className="video-container home-container">
      {!isConnected && <LoadingScreen />}
      <Webcam
        audio={false}
        ref={webcamRef}
        className={`video-element ${isVideoVisible ? 'visible' : 'blurred'}`}
        style={{
          objectFit: 'contain', // Ensure the video fits vertically
        }}
      />

      {isVideoVisible && (
        <img
          src="/abc350image.png"
          style={{
            position: 'absolute',
            top: `${webcamDimensions.top}px`,
            left: `${webcamDimensions.left}px`,
            width: `${webcamDimensions.width}px`,
            height: `${webcamDimensions.height}px`,
            objectFit: 'contain',
          }}
          alt="Overlay"
        />
      )}

      {/* Button Overlay */}
      {!isVideoVisible && (
        <div className="overlay">
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleClick();
            }}
            className="button" // Ensures circular shape
            aria-label="Play Video"
          >
            <FaPlay className="button-icon" />
          </button>
        </div>
      )}

      {/* Subtitle */}
      {subtitleText && (
        <div className="subtitle-container">
          <p className="subtitle-text">{subtitleText}</p>
        </div>
      )}

      {/* Text Box for Translation/Memo */}
      <div className="text-box-container">
        <textarea
          readOnly
          value={subtitleText}
          className="text-box"
          aria-label="Translation Output"
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [socketMessage, setSocketMessage] = useState<SocketMessageProps | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (username: string, password: string) => {
    // Implement your authentication logic here
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket('ws://localhost:8765');

      socketRef.current.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.result && data.function) {
            setSocketMessage({ result: data.result, function: data.function });
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      socketRef.current.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      };

      socketRef.current.onerror = (error) => {
        setIsConnected(false);
        console.error("WebSocket error:", error);
      };
    };

    connectWebSocket();

    const intervalId = setInterval(() => {
      if (socketRef.current) {
        if (socketRef.current.readyState !== WebSocket.OPEN) {
          console.log("WebSocket not open, attempting to reconnect...");
          connectWebSocket();
        }
      } else {
        console.log("WebSocket is null, attempting to reconnect...");
        connectWebSocket();
      }
    }, 5000);

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Router>
      <div className="app-container">
        {/* Include the Sidebar */}
        {isAuthenticated && <Sidebar />}
        <div className="home-section">
          <Routes>
            {!isAuthenticated ? (
              <Route path="/" element={<Login onLogin={handleLogin} />} />
            ) : (
              <>
                <Route
                  path="/dashboard"
                  element={
                    <Home
                      socketRef={socketRef}
                      socketMessage={socketMessage}
                      isConnected={isConnected}
                    />
                  }
                />
                <Route
                  path="/record"
                  element={
                    <Record
                      socketRef={socketRef}
                      socketMessage={socketMessage}
                      isConnected={isConnected}
                    />
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <Saved
                      socketRef={socketRef}
                      isConnected={isConnected}
                    />
                  }
                />
                {/* <Route
                  path="/settings"
                  element={
                    <Settings
                      socketRef={socketRef}
                      isConnected={isConnected}
                    /> */}
                  {/* }
                /> */}
                {/* Add other routes as needed */}
                {/* Redirect unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
