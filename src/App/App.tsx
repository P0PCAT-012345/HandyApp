import React, { useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Webcam from 'react-webcam';
import MenuButton2 from '../components/MenuButton2';
import Record from '../Record/Record';
import Saved from '../Saved/Saved';
import Settings from '../Settings/Settings';
import './App.css';

interface SocketMessageProps {
  result: string;
  function: string;
}

interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
}

const Home: React.FC<HomeProps> = ({ socketRef, socketMessage }) => {
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Toggle video visibility
  const handleClick = () => {
    setIsVideoVisible((prev) => !prev);
    const message = JSON.stringify({
      function: 'reset_data',
    });

    socketRef.current?.send(message);
    setSubtitleText('');
  };

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
  }, []);

  // Capture frames and send them to the server
  useEffect(() => {
    if (isVideoVisible && webcamRef.current && canvasRef.current) {
      const captureImage = () => {
        const video = webcamRef.current?.video;

        if (!video) return;

        // Dynamically set the canvas size to match the video dimensions
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw the video frame on the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert the canvas to a base64 encoded image (JPEG format)
            const base64Image = canvas.toDataURL('image/jpeg');
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              const message = JSON.stringify({
                function: 'recieve',
                args: [base64Image], // Send the base64 encoded image
                kwargs: { mode: 'translate' }, // Mode for the server
              });

              socketRef.current.send(message);
            }
          }
        }
      };

      // Capture the video frame every 50ms
      const intervalId = setInterval(captureImage, 50);

      setIsCameraInitialized(true);
      setIsLoading(false);

      return () => clearInterval(intervalId); // Cleanup when the component unmounts or the video is turned off
    }
  }, [isVideoVisible]);

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
    <div onClick={handleClick} className="home-container">
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
          filter: isVideoVisible ? 'none' : 'blur(10px)', // Apply blur when not visible
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
  const [socketMessage, setSocketMessage] = useState<SocketMessageProps | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8765');

    socketRef.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data && data.result && data.function) {
        setSocketMessage({ result: data.result, function: data.function });
      }
    };

    return () => {
      // Close the WebSocket when the component unmounts
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <Router>
      <div className="app-container">
        <MenuButton2 />
        <Routes>
          <Route path="/" element={<Home socketRef={socketRef} socketMessage={socketMessage} />} />
          <Route path="/record" element={<Record socketRef={socketRef} socketMessage={socketMessage} />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
