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
  const [webcamDimensions, setWebcamDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 }); // Store webcam size and position
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

  // Update the webcam size and position when it's visible
  useEffect(() => {
    if (isVideoVisible && webcamRef.current) {
      const updateWebcamDimensions = () => {
        const webcamElement = webcamRef.current?.video;

        if (webcamElement) {
          const { width, height, top, left } = webcamElement.getBoundingClientRect();
          setWebcamDimensions({ width, height, top, left });
        }
      };

      // Initial call to set the dimensions
      updateWebcamDimensions();

      // Add a resize listener to update dimensions when window resizes
      window.addEventListener('resize', updateWebcamDimensions);

      return () => {
        window.removeEventListener('resize', updateWebcamDimensions);
      };
    }
  }, [isVideoVisible]);

  // Capture frames and send them to the server
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

          // Set canvas size based on the video size
          canvas.width = videoWidth;
          canvas.height = videoHeight;

          // Draw the video frame on the resized canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      };

      // Capture the video frame every 50ms
      const intervalId = setInterval(captureImage, 50);

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
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          margin: 'auto',
          display: 'block',
          filter: isVideoVisible ? 'none' : 'blur(10px)',
        }}
      />

      {/* Resized and positioned image based on webcam size */}
      {isVideoVisible && (
        <img
          src="/abc350image.png"
          style={{
            position: 'absolute',
            top: `${webcamDimensions.top}px`, // Align with the webcam's top
            left: `${webcamDimensions.left}px`, // Align with the webcam's left
            width: `${webcamDimensions.width}px`, // Match the webcam's width
            height: `${webcamDimensions.height}px`, // Match the webcam's height
            objectFit: 'contain', // Maintain aspect ratio
          }}
        />
      )}

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
