// src/Record/Record.tsx

import React, { useEffect, useRef, useState } from 'react';
import './Record.css';
import Webcam from 'react-webcam';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translation';
import { FaEye, FaEyeSlash, FaQuestionCircle, FaGraduationCap } from 'react-icons/fa'; 

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
  const [subtitleText, setSubtitleText] = useState<string>(''); 
  const [isOverlayVisible, setIsOverlayVisible] = useState(true); 
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEduPopupOpen, setIsEduPopupOpen] = useState(false); 
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { language } = useLanguage(); 

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
    if (mediaRecorderRef.current && isRecording) {
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
        const base64data = (reader.result as string).split(',')[1]; 
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

      if (socketMessage.function === 'translate' && socketMessage.result) {
        if (socketMessage.result === 'No match found') {
          setSubtitleText('');
        } else {
          setSubtitleText(socketMessage.result);
        }
      }
    }
  }, [socketMessage]);

  const toggleOverlay = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation(); 
    setIsOverlayVisible((prev) => !prev);
  };

  const toggleHelp = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    setIsHelpOpen(true);
  };

  const closeHelp = () => {
    setIsHelpOpen(false);
  };

  const toggleEducation = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    setIsEduPopupOpen(true);
    setTimeout(() => setIsEduPopupOpen(false), 5000); 
  };

  return (
    <div onClick={handleClick} className="record-container">
      <button className="help-button" onClick={toggleHelp} aria-label={t('help', language)}>
        <FaQuestionCircle size={20} />
        {t('Help', language)}
      </button>
      <button 
        className="secondary-button" 
        onClick={toggleEducation} 
        aria-label={t('educational_resource', language)}
      >
        <FaGraduationCap size={20} />
        {t('Want to Learn?', language)}
      </button>

{isHelpOpen && (
  <div className="modal-overlay" onClick={closeHelp}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close-button" onClick={closeHelp} aria-label={t('Close Help Modal', language)}>
        &times;
      </button>

      <h2>{t('Recording Instructions', language)}</h2>
      <p>{t('This is the Record feature. Here’s how to use it:', language)}</p>

      <h3>{t('Starting the Recording', language)}</h3>
      <p>
        {t('Press anywhere on the screen to start. The blur will disappear, and after a 3-second countdown, you can begin signing. Make sure to adjust your position so your face and hands align with the person outline on the screen.', language)}
      </p>

      <h3>{t('Ending the Recording', language)}</h3>
      <p>
        {t('To end the recording, simply open your mouth. This will stop the recording automatically.', language)}
      </p>

      <h3>{t('Saving Your Sign', language)}</h3>
      <p>
        {t('Once the recording ends, enter a name for your sign and press "Save" to store it. You can view or delete past recordings in the "Files" section.', language)}
      </p>

      <h3>{t('Recording Tips', language)}</h3>
      <p>
        {t('keep_hands_in_frame', language)}<br />
        {t('one_hand_sign_tip', language)}
      </p>
    </div>
  </div>
)}

{isEduPopupOpen && (
  <div className="modal-overlay" onClick={() => setIsEduPopupOpen(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close-button" onClick={() => setIsEduPopupOpen(false)} aria-label={t('Close Education Popup', language)}>
        &times;
      </button>
      <p>
        {t('If you don’t know where to start, try learning 100 basic signs on Handspeak. Click the link below to visit the website. Once there, open any word, watch the video, and try recording it here!', language)}{' '}
        <a href="https://www.handspeak.com/word/most-used/" target="_blank" rel="noopener noreferrer">
          Handspeak.com
        </a>
      </p>
    </div>
  </div>
)}

      {!isConnected && <LoadingScreen />}
      
      <Webcam
        audio={false}
        ref={webcamRef}
        className={`record-video-element ${isVideoVisible ? 'visible' : 'blurred'}`}
      />

      {isVideoVisible && isOverlayVisible && (
        <img
          src="/greyperson.png"
          className="record-overlay-image"
          alt="Grey Person Overlay"
        />
      )}
    

      {countdown > 0 && <div className="countdown-overlay">{countdown}</div>}

      {isSaving && (
        <div className="save-overlay">
          <input
            type="text"
            placeholder={t('enter_sign_name', language)}
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            aria-label={t('enter_sign_name', language)}
          />
          <div>
            <button onClick={handleSaveRecording} aria-label={t('save_recording', language)}>{t('save', language)}</button>
            <button onClick={resetState} aria-label={t('cancel_saving', language)}>{t('cancel', language)}</button>
          </div>
        </div>
      )}

      {subtitleText && (
        <div className="subtitle-container">
          <p className="subtitle-text">{subtitleText}</p>
        </div>
      )}

      <button 
        className="toggle-overlay-button" 
        onClick={toggleOverlay}
        aria-label={isOverlayVisible ? t('hide_overlay', language) : t('show_overlay', language)}
      >
        {isOverlayVisible ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
      </button>
    </div>
  );
};

export default Record;
