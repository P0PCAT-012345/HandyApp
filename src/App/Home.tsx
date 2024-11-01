// src/Home/Home.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translation';
import './Home.css';
import Webcam from 'react-webcam';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

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
  const [webcamDimensions, setWebcamDimensions] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  });
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { language } = useLanguage();

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
    <div onClick={handleClick} className={`video-container home-container ${isVideoVisible ? 'visible' : 'blurred'}`}>
      {!isConnected && <LoadingScreen />}
      <Webcam
        audio={false}
        ref={webcamRef}
        className="video-element"
      />

      {isVideoVisible && (
        <img
          src="/greyperson.png"
          className="overlay-image"
          alt="Overlay"
        />
      )}

      {/* Button Overlay */}
      {!isVideoVisible && (
        <div className="overlay">
          <h1 className="overlay-title">{t('click_to_start_translation', language)}</h1>
        </div>
      )}

      {/* Subtitle */}
      {subtitleText && (
        <div className="subtitle-container">
          <p className="subtitle-text">{subtitleText.split(' ').slice(-15).join(' ')}</p>
        </div>
      )}
    </div>
  );
};

export default Home;
