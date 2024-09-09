import React, { useEffect, useRef, useState } from 'react';
import { FaRecordVinyl } from 'react-icons/fa';
import './Record.css';
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

const Record: React.FC<HomeProps> = ({ socketRef, socketMessage, isConnected }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [recordName, setRecordName] = useState('');
  const [webcamDimensions, setWebcamDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 }); // Store webcam size and position
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleClick = () => {
    if (!isRecording && !isSaving && socketRef.current) {
      setIsVideoVisible(true);
      setCountdown(3);
      const message = JSON.stringify({
        function: 'reset_data',
      });

      socketRef.current.send(message);
    } else if (isRecording) {
      stopRecording();
    }
  };

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
    console.log(recordName);
    if (recordName && socketRef.current) {
      const message = JSON.stringify({
        function: 'stop_recording',
        kwargs: { name: recordName },
      });

      socketRef.current.send(message);
    }

    if (recordName && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      console.log('blob ready');
      reader.onloadend = () => {
        console.log('Reading');
        const base64data = reader.result;
        console.log('Data ready');
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          console.log('Socket ready');
        }

        resetState();
      };

      reader.readAsDataURL(blob);
    }
  };

  const resetState = () => {
    setIsVideoVisible(false);
    setIsSaving(false);
    setRecordName('');
    setRecordedChunks([]);
  };

  useEffect(() => {
    // Initialize the canvas once when the component mounts
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

  useEffect(() => {
    if (isVideoVisible && webcamRef.current && countdown === 0 && isRecording) {
      const captureImage = () => {
        const video = webcamRef.current?.video;
        if (!video || !canvasRef.current) return;

        // Use the existing canvas to capture the video frame
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to Base64 encoded image (JPEG format)
        const base64Image = canvas.toDataURL('image/jpeg');
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const message = JSON.stringify({
            function: 'record',
            args: [base64Image],
          });
          socketRef.current.send(message);
        }
      };

      const intervalId = setInterval(captureImage, 50);

      return () => clearInterval(intervalId); // Cleanup when the component unmounts or the video is turned off
    }
  }, [countdown, isVideoVisible, isRecording]);

  useEffect(() => {
    if (socketMessage && socketMessage.function === 'record' && socketMessage.result === 'MOUTH_OPEN_TRUE') {
      stopRecording();
    }
  }, [socketMessage]);

  return (
    
    <div onClick={handleClick} className="record-container">
      {!isConnected && <LoadingScreen />}
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
      {countdown > 0 && <div className="countdown-overlay">{countdown}</div>}
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