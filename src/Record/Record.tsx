import React, { useEffect, useRef, useState } from 'react';
import { FaRecordVinyl } from 'react-icons/fa';
import './Record.css';
import Webcam from 'react-webcam';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
}

const Record: React.FC<HomeProps> = ({ socketRef }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [recordName, setRecordName] = useState('');
  const webcamRef = useRef<Webcam>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleClick = () => {
    if (!isRecording && !isSaving) {
      setIsVideoVisible(true);
      setCountdown(3);
    } else if (isRecording) {
      stopRecording();
    }
  };

  useEffect(() => {
    const checkWebSocketConnection = () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    };

    checkWebSocketConnection();
    const intervalId = setInterval(checkWebSocketConnection, 5000);

    return () => clearInterval(intervalId);
  }, [socketRef]);

  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (countdown === 0 && isVideoVisible) {
      startRecording();
    }
  }, [countdown, isVideoVisible]);

  const startRecording = () => {
    if (webcamRef.current && webcamRef.current.stream) {
      const stream = webcamRef.current.stream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsSaving(true);
    }
  };

  const handleSaveRecording = () => {
    if (recordName && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });

      // Save to localStorage for later use in Saved component
      const url = URL.createObjectURL(blob);
      const savedRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');
      savedRecordings.push({ name: recordName, url });
      localStorage.setItem('recordings', JSON.stringify(savedRecordings));

      resetState();
    }
  };

  const resetState = () => {
    setIsVideoVisible(false);
    setIsSaving(false);
    setRecordName('');
    setRecordedChunks([]);
  };

  return (
    <div onClick={handleClick} className="record-container">
      {!isConnected && <LoadingScreen />} {/* Show loading screen if WebSocket is not connected */}
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
      {!isVideoVisible && !isRecording && !isSaving && (
        <div className="overlay">
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleClick();
            }}
            className="record-button"
          >
            <FaRecordVinyl className="record-icon" />
          </button>
        </div>
      )}
      {countdown > 0 && (
        <div className="countdown-overlay">
          {countdown}
        </div>
      )}
      {isSaving && (
        <div className="save-overlay">
          <input
            type="text"
            placeholder="Enter name"
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
          />
          <button onClick={handleSaveRecording}>Save</button>
          <button onClick={resetState}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Record;
