import React, { useEffect, useRef, useState } from 'react';
import { FaRecordVinyl } from 'react-icons/fa';
import * as Hands from '@mediapipe/hands';
import * as FaceMesh from '@mediapipe/face_mesh';
import * as Camera from '@mediapipe/camera_utils';
import './Record.css';



const Record: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const isRecordingRef = useRef(isRecording);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const [countdown, setCountdown] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [recordName, setRecordName] = useState('');
  const [recordings, setRecordings] = useState<{ name: string; url: string }[]>(() => {
    const savedRecordings = localStorage.getItem('recordings');
    return savedRecordings ? JSON.parse(savedRecordings) : [];
  });
  const [mouthState, setMouthState] = useState<string>('closed');

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8765');

    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    }; 

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };
  }, []);

  useEffect(() => {
    const hands = new Hands.Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
      }
    });
    
    const faceMesh = new FaceMesh.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face@0.4.1646424915/${file}`;
      }
    });
    
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onHandsResults);

    faceMesh.setOptions({
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onFaceResults);

    if (videoRef.current) {
      const camera = new Camera.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current as Hands.InputImage});
          await faceMesh.send({ image: videoRef.current as Hands.InputImage});
        }, 
        width: 640,
        height: 480
      });
      camera.start();
    }
  }, []);


  const onFaceResults = (results: FaceMesh.Results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      if ( isMouthOpen(results.multiFaceLandmarks[0])) {
        stopRecording()
      } 
    }
  };

  const isMouthOpen = (landmarks: FaceMesh.NormalizedLandmarkList): boolean => {
    const UPPER_LIP_TOP = 13; 
    const LOWER_LIP_BOTTOM = 14; 
    const UPPER_LIP_INNER = 0; 
    const LOWER_LIP_INNER = 17; 

    const upperLipTop = landmarks[UPPER_LIP_TOP].y;
    const lowerLipBottom = landmarks[LOWER_LIP_BOTTOM].y;
    const upperLipInner = landmarks[UPPER_LIP_INNER].y;
    const lowerLipInner = landmarks[LOWER_LIP_INNER].y;

    const mouthOpening = (lowerLipBottom - upperLipTop) > 0.01; 
    const mouthInnerDistance = (lowerLipInner - upperLipInner) > 0.006;

    return mouthOpening && mouthInnerDistance;
  };



  const onHandsResults = (results: Hands.Results) => {
    const message = {
      function: 'recieve',
      args: [results, "record"],
    };
    socketRef.current?.send(JSON.stringify(message));
  
  };

  const handleClick = () => {
    if (isRecording && countdown == 0) {
      stopRecording();
    } else if (!isRecording && countdown === 0 && !isSaving) {
      setIsVideoVisible((prev) => !prev); 
    }
  };

  const handleRecordButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isRecording && countdown === 0) {
      setCountdown(3);
      setIsVideoVisible(true);
      
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isVideoVisible && !isRecording && !isSaving) {
      startRecording();
    }
  }, [countdown, isVideoVisible, isRecording, isSaving]);

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const message = {
        function: 'reset_data',
        args: [],
      };
      socketRef.current?.send(JSON.stringify(message));

      setIsRecording(true);
      console.log("set recording true")
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    console.log(isRecording);
    if (isRecordingRef.current){
      setIsSaving(true);
      setIsRecording(false);
      const message = {
        function: 'stop_recording',
        args: [],
      };
      socketRef.current?.send(JSON.stringify(message));
    }
  };

  const resetState = () => {
    setIsVideoVisible(false);
    setIsRecording(false);
    setCountdown(0);
    setIsSaving(false);
    setRecordName('');
    setRecordedChunks([]);
  };

  const handleSaveRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const newRecording = { name: recordName, url };
      const updatedRecordings = [...recordings, newRecording];
      setRecordings(updatedRecordings);
      localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
    }
    const message = {
      function: 'save',
      args: [recordName],
    };
    socketRef.current?.send(JSON.stringify(message));
    resetState();
  };

  const handleCancelSave = () => {
    resetState();
  };

  return (
    <div 
      className="record-container"
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        className={`video-element ${isVideoVisible ? 'visible' : 'blurred'}`}
        autoPlay
        playsInline 
        muted 
      />
      <img 
        src='/abc350image.png' 
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '80%', // Adjust this value as needed
          height: 'auto', // Maintain aspect ratio
          maxWidth: '100%', // Prevent overflow
          maxHeight: '100%' // Prevent overflow
        }} 
      />
      {!isVideoVisible && !isRecording && !isSaving && (
        <div className="overlay">
          <button
            onClick={handleRecordButtonClick}
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
          <button onClick={handleCancelSave}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Record;
