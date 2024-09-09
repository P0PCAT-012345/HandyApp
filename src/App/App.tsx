import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import Webcam from 'react-webcam';
import MenuButton2 from '../components/MenuButton2';
import Record from '../Record/Record';
import Saved from '../Saved/Saved';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import './App.css';

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
    <div onClick={handleClick} className="home-container">
      {!isConnected && <LoadingScreen />}
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

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket('ws://localhost:8765');

      socketRef.current.onopen = () => {
        setIsConnected(true);
      };

      socketRef.current.onclose = () => {
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data && data.result && data.function) {
          setSocketMessage({ result: data.result, function: data.function });
        }
      };
        socketRef.current.onclose = () => {
          setIsConnected(false);
        };

        socketRef.current.onerror = (error) => {
          setIsConnected(false);
        };

    };

    connectWebSocket();

    const intervalId = setInterval(() => {
      if (socketRef.current) {
        if (socketRef.current.readyState !== WebSocket.OPEN) {
          setIsConnected(false);
          connectWebSocket();
        }
      } else {
        console.log('WebSocket is null, attempting to reconnect...');
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
        <MenuButton2 />
        <Routes>
          <Route path="/" element={<Home socketRef={socketRef} socketMessage={socketMessage} isConnected={isConnected}/>} />
          <Route path="/record" element={<Record socketRef={socketRef} socketMessage={socketMessage} isConnected={isConnected}/>} />
          <Route path="/saved" element={<Saved />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
