<<<<<<< Updated upstream
import React, { useEffect, useRef, useState } from 'react';
import { FaRecordVinyl } from 'react-icons/fa';
import './Record.css';
=======
// src/components/Record/Record.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  IconButton,
  Typography,
  Tooltip,
  Snackbar,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import SchoolIcon from '@mui/icons-material/School';
>>>>>>> Stashed changes
import Webcam from 'react-webcam';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import Popup from '../components/Popup/Popup';
import './Record.css';
import { useTranslation } from 'react-i18next';

// Alert Component for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

<<<<<<< Updated upstream
interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
}

const Record: React.FC<HomeProps> = ({ socketRef }) => {
=======
interface SocketMessageProps {
  function: string;
  result?: string;
}

interface RecordProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
  cameraId: string;
  currentTheme: 'light' | 'dark';
}

const Record: React.FC<RecordProps> = ({
  socketRef,
  socketMessage,
  isConnected,
  cameraId,
  currentTheme,
}) => {
  const { t } = useTranslation();
>>>>>>> Stashed changes
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [recordName, setRecordName] = useState('');
<<<<<<< Updated upstream
  const webcamRef = useRef<Webcam>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleClick = () => {
    if (!isRecording && !isSaving) {
      setIsVideoVisible(true);
      setCountdown(3);
=======
  const [subtitleText, setSubtitleText] = useState<string>('');
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTranslatePopupOpen, setIsTranslatePopupOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  // Show instructions only for first-time users
  const [hasVisitedRecord, setHasVisitedRecord] = useState<boolean>(
    localStorage.getItem('hasVisitedRecord') ? true : false
  );

  // Toggle for Overlay Image
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(true);

  const toggleOverlay = () => {
    setIsOverlayVisible((prev) => !prev);
  };

  const handleClick = () => {
    if (!isRecording && !isSaving && socketRef.current) {
      setCountdown(3);
      const message = JSON.stringify({
        function: 'reset_data',
      });

      socketRef.current.send(message);
      setSubtitleText('');
>>>>>>> Stashed changes
    } else if (isRecording) {
      stopRecording();
    }
  };

  useEffect(() => {
<<<<<<< Updated upstream
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
=======
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
  }, []);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
>>>>>>> Stashed changes
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (countdown === 0 && !isRecording && !isSaving) {
      startRecording();
      setCountdown(null);
    }
  }, [countdown, isRecording, isSaving]);

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
      console.log('Recording started.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsSaving(true);
      console.log('Recording stopped.');
    }
  };

  const handleSaveRecording = () => {
    if (recordName.trim() && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });

<<<<<<< Updated upstream
      // Save to localStorage for later use in Saved component
      const url = URL.createObjectURL(blob);
      const savedRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');
      savedRecordings.push({ name: recordName, url });
      localStorage.setItem('recordings', JSON.stringify(savedRecordings));

      resetState();
=======
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        const message = JSON.stringify({
          function: 'stop_recording',
          kwargs: {
            name: recordName.trim(),
            video_data: base64data,
          },
        });

        const socket = socketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(message);
          console.log('Save recording message sent.');
        } else {
          console.error('WebSocket is not connected.');
        }

        resetState();
      };

      reader.readAsDataURL(blob);
>>>>>>> Stashed changes
    }
  };

  const resetState = () => {
    setIsSaving(false);
    setRecordName('');
    setRecordedChunks([]);
    setSubtitleText('');
    setCountdown(null);
  };

<<<<<<< Updated upstream
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
=======
  useEffect(() => {
    if (isRecording && webcamRef.current && canvasRef.current) {
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
          if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
          ) {
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
  }, [isRecording, socketRef]);

  useEffect(() => {
    if (socketMessage) {
      if (
        socketMessage.function === 'record' &&
        socketMessage.result === 'MOUTH_OPEN_TRUE'
      ) {
        stopRecording();
      }

      // Handle subtitles if applicable (for translate mode)
      if (socketMessage.function === 'translate' && socketMessage.result) {
        if (socketMessage.result === 'No match found') {
          setSubtitleText('');
        } else {
          setSubtitleText(socketMessage.result);
        }
      }
    }
  }, [socketMessage]);

  // Handle Instruction Overlay Close
  const handleCloseInstructions = () => {
    setHasVisitedRecord(true);
    localStorage.setItem('hasVisitedRecord', 'true');
  };

  return (
    <div
      onClick={handleClick}
      className={`video-container record-container ${currentTheme}`}
    >
      {!isConnected && <LoadingScreen />}
      <Webcam
        audio={false}
        ref={webcamRef}
        className="video-element"
        videoConstraints={{
          deviceId: cameraId ? { exact: cameraId } : undefined,
        }}
      />

      {isOverlayVisible && (
        <img
          src="/allenpic.png"
          className="overlay-image"
          alt="Overlay"
        />
      )}

      {/* Instruction Overlay for First-Time Users */}
      {!hasVisitedRecord && (
        <div
          className="instruction-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="h5" className="instruction-text">
            {t('Instructions for Recording')}
          </Typography>
          <Typography variant="body1" className="instruction-details">
            {t('Click to start recording. A 3-second countdown will begin. Start your sign, and open your mouth to stop recording. Try to use both hands inside the frame. For one-hand signs, keep your hand in the default position around your stomach. You can turn on the outline for reference. After stopping, type the name of the sign and save it. See past signs in "Files".')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCloseInstructions}
            className="close-instruction-button"
          >
            {t('Close')}
          </Button>
        </div>
      )}

      {/* Help Button */}
      <Tooltip title={t('Instructions')} placement="top">
        <IconButton
          className="help-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsHelpOpen(true);
          }}
          aria-label="Help"
        >
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>

      {/* Help Popup */}
      <Popup isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)}>
        <div className="help-popup-content">
          <Typography variant="h6" gutterBottom>
            {t('Help and Instructions')}
          </Typography>
          <Typography variant="body1" className="help-text">
            {t('Click to start recording. A 3-second countdown will begin. Start your sign, and open your mouth to stop recording. Try to use both hands inside the frame. For one-hand signs, keep your hand in the default position around your stomach. You can turn on the outline for reference. After stopping, type the name of the sign and save it. See past signs in "Files".')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsHelpOpen(false)}
            className="close-help-button"
          >
            {t('Close')}
          </Button>
        </div>
      </Popup>

      {/* Toggle Overlay Button */}
      <Tooltip title={isOverlayVisible ? t('Hide Overlay') : t('Show Overlay')} placement="bottom">
        <IconButton
          className="toggle-overlay-button"
          onClick={(e) => {
            e.stopPropagation();
            toggleOverlay();
          }}
          aria-label="Toggle Overlay"
        >
          {isOverlayVisible ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
        </IconButton>
      </Tooltip>

      {/* Subtitle (Only for Translate Mode) */}
      {subtitleText && (
        <div className="subtitle-container">
          <Typography variant="h5" className="subtitle-text">
            {subtitleText}
          </Typography>
        </div>
      )}

      {/* Translate Popup Toggle Button */}
      <Tooltip
        title={isTranslatePopupOpen ? t('Hide Translation') : t('Show Translation')}
        placement="left"
      >
        <IconButton
          className="translate-popup-toggle-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsTranslatePopupOpen(!isTranslatePopupOpen);
          }}
          aria-label="Toggle Translation Popup"
        >
          {isTranslatePopupOpen ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
        </IconButton>
      </Tooltip>
>>>>>>> Stashed changes

      <Popup isOpen={isTranslatePopupOpen} onClose={() => setIsTranslatePopupOpen(false)}>
        <div className="popup-content">
          <Typography variant="h6" gutterBottom>
            {t('Translation Output')}
          </Typography>
          <Typography variant="body1" className="popup-text">
            {subtitleText}
          </Typography>
          {/* Learning Icon */}
          <Tooltip title={t('Learn More About Sign Language')}>
            <IconButton
              color="primary"
              onClick={() => {
                window.open('https://www.handspeak.com', '_blank');
                setSnackbarMessage(t('Redirecting to Handspeak...'));
                setOpenSnackbar(true);
              }}
              className="learn-button"
              aria-label="Learn More"
            >
              <SchoolIcon />
            </IconButton>
          </Tooltip>
          {/* Snackbar for Notifications */}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={3000}
            onClose={() => setOpenSnackbar(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setOpenSnackbar(false)}
              severity="success"
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </div>
      </Popup>

      {/* Recording Saving Overlay */}
      {isSaving && (
        <div className="saving-overlay" onClick={(e) => e.stopPropagation()}>
          <Typography variant="h6" gutterBottom>
            {t('Enter the name of the sign and save it')}
          </Typography>
          <TextField
            label={t('Sign Name')}
            variant="outlined"
            value={recordName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordName(e.target.value)}
            className="record-name-input"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveRecording}
            disabled={!recordName.trim()}
            className="save-recording-button"
          >
            {t('Save')}
          </Button>
        </div>
      )}
        </div>
      );
    };
    
    // Debounce function to optimize resize events
    function debounce(func: () => void, wait: number) {
      let timeout: NodeJS.Timeout;
      const debounced = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(), wait);
      };
      debounced.cancel = () => clearTimeout(timeout);
      return debounced;
    }
    
    export default Record;