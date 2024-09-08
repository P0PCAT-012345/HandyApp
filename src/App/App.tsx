import React, { useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Webcam from 'react-webcam';
import MenuButton2 from '../components/MenuButton2';
import Record from '../Record/Record';
import Saved from '../Saved/Saved';
import Settings from '../Settings/Settings';
import './App.css';



interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
}

const Home: React.FC<HomeProps> = ({ socketRef }) => {
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webcamRef = useRef<Webcam>(null);

  // Toggle video visibility
  const handleClick = () => {
    setIsVideoVisible((prev) => !prev);
  };

  // Capture frames and send them to the server
  useEffect(() => {
    if (isVideoVisible && webcamRef.current) {
      const captureImage = () => {
        const video = webcamRef.current?.video;

        if (!video) return;

        // Create a canvas to capture the video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to Base64 encoded image (JPEG format)
        const base64Image = canvas.toDataURL('image/jpeg');
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const message = JSON.stringify({
            function: 'recieve',
            args: [base64Image], // Send the base64 encoded image
            kwargs: { mode: 'translate' }, // Mode for the server
          });

          socketRef.current.send(message);
        }
      };

      const intervalId = setInterval(captureImage, 80);

      setIsCameraInitialized(true);
      setIsLoading(false);

      return () => clearInterval(intervalId); // Cleanup when the component unmounts or the video is turned off
    }
  }, [isVideoVisible]);

  useEffect(()=>{
    if (socketRef && socketRef.current){
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data && data.result) {
          setSubtitleText(data.result);
        }
      };
    }  
  }, [socketRef])

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
        src='/abc350image.png'
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
          <button onClick={(event) => { event.stopPropagation(); handleClick(); }} className="play-button">
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
  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8765');

    socketRef.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
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
          <Route path="/" element={<Home socketRef={socketRef} />} />
          <Route path="/record" element={<Record socketRef={socketRef}/>} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;