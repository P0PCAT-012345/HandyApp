// src/Record/Record.tsx

import React, { useEffect, useRef, useState } from 'react';
import { FaRecordVinyl } from 'react-icons/fa';
import '../VideoStyles.css'; // Use shared video styles
import Webcam from 'react-webcam';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

interface SocketMessageProps {
  result: string;
  function: string;
}

interface RecordProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
}

const Record: React.FC<RecordProps> = ({ socketRef, socketMessage, isConnected }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [recordName, setRecordName] = useState('');
  const [webcamDimensions, setWebcamDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 }); 
  const [subtitleText, setSubtitleText] = useState<string>(''); // Added State Variable
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
    if (recordName && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1]; // Remove the data URL part
        const message = JSON.stringify({
          function: 'stop_recording',
          kwargs: { 
            name: recordName,
            video_data: base64data
          },
        });

        const socket = socketRef.current;
        if (socket) {
          socket.send(message);
        } else {
          console.error("WebSocket is not connected.");
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
              function: 'record',
              args: [base64Image],
            });
            socketRef.current.send(message);
          }
        }
      };

      const intervalId = setInterval(captureImage, 50);

      return () => clearInterval(intervalId); 
    }
  }, [countdown, isVideoVisible, isRecording]);

  useEffect(() => {
    if (socketMessage) {
      if (socketMessage.function === 'record' && socketMessage.result === 'MOUTH_OPEN_TRUE') {
        stopRecording();
      }

      // Handle subtitles if applicable
      if (socketMessage.function === 'translate' && socketMessage.result) {
        if (socketMessage.result === 'No match found') {
          setSubtitleText('');
        } else {
          setSubtitleText(socketMessage.result);
        }
      }
    }
  }, [socketMessage]);

  return (
    <div onClick={handleClick} className="video-container record-container">
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
      {!isVideoVisible && !isRecording && !isSaving && (
        <div className="overlay">
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleClick();
            }}
            className="button" // Ensures circular shape
            aria-label="Record Video"
          >
            <FaRecordVinyl className="button-icon" />
          </button>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown > 0 && <div className="countdown-overlay">{countdown}</div>}

      {/* Save Overlay */}
      {isSaving && (
        <div className="save-overlay">
          <input
            type="text"
            placeholder="手話の名前を入力してください"
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            aria-label="Record Name"
          />
          <div>
            <button onClick={handleSaveRecording} aria-label="Save Recording">保存する</button>
            <button onClick={resetState} aria-label="Cancel Saving">キャンセル</button>
          </div>
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

export default Record;
