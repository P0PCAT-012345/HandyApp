import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import Webcam from 'react-webcam';
import MenuButton2 from '../components/MenuButton2';
import Record from '../Record/Record';
import Saved from '../Saved/Saved';
<<<<<<< Updated upstream
import Settings from '../Settings/Settings';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import './App.css';

const Home: React.FC<{ socketRef: React.MutableRefObject<WebSocket | null>; isConnected: boolean }> = ({ socketRef, isConnected }) => {
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const handleClick = () => {
    setIsVideoVisible((prev) => !prev);
  };

  useEffect(() => {
    if (isVideoVisible && webcamRef.current) {
      const captureImage = () => {
        const video = webcamRef.current?.video;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg');
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const message = JSON.stringify({
            function: 'recieve',
            args: [base64Image],
            kwargs: { mode: 'translate' },
          });

          socketRef.current.send(message);
        }
      };

      const intervalId = setInterval(captureImage, 80);

      return () => clearInterval(intervalId);
    }
  }, [isVideoVisible, socketRef]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data && data.result) {
          setSubtitleText(data.result);
        }
      };
    }
  }, [socketRef]);

  return (
    <div onClick={handleClick} className="home-container">
      {!isConnected && <LoadingScreen />} {/* Show loading screen if WebSocket is not connected */}
      {/* Webcam video element */}
      <Webcam
        audio={false}
        ref={webcamRef}
        className={`video-element ${isVideoVisible ? 'visible' : 'blurred'}`}
        style={{
          transform: 'scaleX(-1)',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: isVideoVisible ? 'none' : 'blur(10px)',
        }}
      />
      {/* Overlay with an image and play button */}
      <img
        src="/abc350image.png"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
      {!isVideoVisible && (
        <div className="overlay">
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleClick();
            }}
            className="play-button"
          >
            <FaPlay className="play-icon" />
          </button>
        </div>
      )}
      {/* Subtitle text */}
      {subtitleText && (
        <div className="subtitle-container">
          <p className="subtitle-text">{subtitleText}</p>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false); // State to track WebSocket connection status
=======
import Settings from '../Settings/Settings'; 
import Auth from '../Login/Auth'; 
import './App.css';
import '../VideoStyles.css'; 
import Home from './Home';
import { useTranslation } from 'react-i18next';

interface SocketMessageProps {
  result: string;
  function: string;
}

const App: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [socketMessage, setSocketMessage] = useState<SocketMessageProps | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Language State
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>('en');

  // Camera State
  const [cameraId, setCameraId] = useState<string>('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedLanguage = localStorage.getItem('language');
    const savedCameraId = localStorage.getItem('cameraId');

    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) {
      setLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
    if (savedCameraId) setCameraId(savedCameraId);
  }, [i18n]);

  // Apply theme by adding a class to the body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  const handleLogin = (username: string, password: string, rememberMe: boolean) => {
    const requestList = JSON.stringify({
      function: 'login',
      kwargs: { username, password, rememberMe },
    });
    socketRef.current?.send(requestList);
  };

  const handleSignUp = (username: string, password: string, rememberMe: boolean) => {
    const requestList = JSON.stringify({
      function: 'signup',
      kwargs: { username, password, rememberMe },
    });
    socketRef.current?.send(requestList);
  };
>>>>>>> Stashed changes

  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket('ws://localhost:8765');

      socketRef.current.onopen = () => {
<<<<<<< Updated upstream
        console.log('WebSocket connection opened');
        setIsConnected(true); // WebSocket is connected
=======
        setIsConnected(true);
        console.log("WebSocket connected");
      };

      socketRef.current.onmessage = (event) => {
        console.log(event);
        try {
          const data = JSON.parse(event.data);
          if (data && "result" in data && "function" in data) {
            setSocketMessage({ result: data.result, function: data.function });
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
>>>>>>> Stashed changes
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false); // WebSocket is disconnected
      };

      socketRef.current.onerror = (error) => {
        console.log('WebSocket error', error);
        setIsConnected(false); // Treat WebSocket error as disconnected
      };
    };

    // Call connectWebSocket initially
    connectWebSocket();

    // Periodically check the connection status every 5 seconds
    const intervalId = setInterval(() => {
      if (socketRef.current) {
        if (socketRef.current.readyState !== WebSocket.OPEN) {
          console.log('WebSocket is not connected, attempting to reconnect...');
          setIsConnected(false); // Set state to show loading screen
          connectWebSocket(); // Attempt to reconnect
        }
      } else {
        // If WebSocket is null, try reconnecting
        console.log('WebSocket is null, attempting to reconnect...');
        connectWebSocket();
      }
    }, 5000); // 5000ms = 5 seconds

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearInterval(intervalId); // Clean up interval on component unmount
    };
  }, []);

<<<<<<< Updated upstream
  return (
    <Router>
      <div className="app-container">
        <MenuButton2 />
        <Routes>
          <Route path="/" element={<Home socketRef={socketRef} isConnected={isConnected} />} />
          <Route path="/record" element={<Record socketRef={socketRef} />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
=======
  useEffect(() => {
    if (window.name !== 'appWindow') {
      const windowFeatures = 'width=1200,height=800,resizable=yes,scrollbars=yes';
      const newWindow = window.open(window.location.href, 'appWindow', windowFeatures);

      if (newWindow) {
        newWindow.focus();
        setPopupBlocked(false);
      } else {
        setPopupBlocked(true);
        console.warn('Pop-up was blocked. Please allow pop-ups for this website.');
      }
    }
  }, []);

  return (
    <Router>
      <div className="app-container">
        {popupBlocked && (
          <div className="popup-warning">
            <p>
              Pop-up was blocked. Please allow pop-ups for this website to open the application in a new window.
            </p>
          </div>
        )}

        {isAuthenticated && window.name === 'appWindow' && (
          <Sidebar />
        )}

        {window.name === 'appWindow' && (
          <div className="home-section">
            <Routes>
              {!isAuthenticated ? (
                <Route
                  path="/"
                  element={
                    <Auth
                      onLogin={handleLogin}
                      onSignUp={handleSignUp}
                      setIsAuthenticated={setIsAuthenticated}
                      socketMessage={socketMessage}
                      isConnected={isConnected}
                    />
                  }
                />
              ) : (
                <>
                  <Route
                    path="/dashboard"
                    element={
                      <Home
                        socketRef={socketRef}
                        socketMessage={socketMessage}
                        isConnected={isConnected}
                        cameraId={cameraId} 
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
                        cameraId={cameraId} 
                        currentTheme={theme} 
                      />
                    }
                  />
                  <Route
                    path="/saved"
                    element={
                      <Saved
                        socketRef={socketRef}
                        socketMessage={socketMessage}
                        isConnected={isConnected}
                      />
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Settings
                        onThemeChange={(newTheme) => setTheme(newTheme)}
                        onLanguageChange={(newLang) => {
                          setLanguage(newLang);
                          i18n.changeLanguage(newLang);
                        }}
                        onCameraChange={(newCameraId) => setCameraId(newCameraId)}
                        currentTheme={theme}
                        currentLanguage={language}
                        currentCameraId={cameraId}
                      />
                    }
                  />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          </div>
        )}
>>>>>>> Stashed changes
      </div>
    </Router>
  );
};

export default App;
