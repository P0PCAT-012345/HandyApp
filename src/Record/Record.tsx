import React, { useEffect, useRef, useState } from 'react';
import { FaRecordVinyl } from 'react-icons/fa';
import './Record.css';
import Webcam from 'react-webcam';

interface SocketMessageProps {
  result: string;
  function: string;
}

interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
}

const Record: React.FC<HomeProps> = ({ socketRef, socketMessage }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [recordName, setRecordName] = useState('');
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleClick = () => {
    if (!isRecording && !isSaving && socketRef.current) {
      setIsVideoVisible(true);
      setCountdown(3);
      const message = JSON.stringify({
        function: 'reset_recording',
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
    if (recordName && socketRef.current){
      const message = JSON.stringify({
        function: 'stop_recording',
        kwargs: {name: recordName}
      });
  
      socketRef.current.send(message);  
    }

    if (recordName && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      console.log("blob ready");
      reader.onloadend = () => {
        console.log("Reading");
        const base64data = reader.result;
        console.log("Data ready");
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          console.log("Socket ready");
          // const message = JSON.stringify({
          //   function: 'record',
          //   kwargs: {
          //     data: base64data,
          //     name: recordName,
          //   },
          // });

          // socketRef.current.send(message);
          console.log("Sent!");
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
            args: [base64Image]
          });
          socketRef.current.send(message);
        }
      };

      const intervalId = setInterval(captureImage, 80);

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