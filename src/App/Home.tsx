// src/components/Home/Home.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  IconButton,
  Typography,
  Tooltip,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InfoIcon from '@mui/icons-material/Info';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import Webcam from 'react-webcam';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import Popup from '../components/Popup/Popup';
import './Home.css';
import { useTranslation } from 'react-i18next';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface SocketMessageProps {
  function: string;
  result?: string;
}

interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
  cameraId: string;
}

const Home: React.FC<HomeProps> = ({
  socketRef,
  socketMessage,
  isConnected,
  cameraId,
}) => {
  const { t } = useTranslation();
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
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const [hasVisitedHome, setHasVisitedHome] = useState<boolean>(
    localStorage.getItem('hasVisitedHome') ? true : false
  );

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

      const debouncedUpdate = debounce(updateWebcamDimensions, 200);
      debouncedUpdate();

      window.addEventListener('resize', debouncedUpdate);

      return () => {
        window.removeEventListener('resize', debouncedUpdate);
        debouncedUpdate.cancel();
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
          if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
          ) {
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
  }, [isVideoVisible, socketRef, cameraId]);

  useEffect(() => {
    if (
      socketMessage &&
      socketMessage.function === 'recieve' &&
      socketMessage.result
    ) {
      if (socketMessage.result === 'No match found') {
        setSubtitleText('');
      } else {
        setSubtitleText(socketMessage.result);
      }
    }
  }, [socketMessage]);

  const handleCloseInstructions = () => {
    setHasVisitedHome(true);
    localStorage.setItem('hasVisitedHome', 'true');
  };

  return (
    <div onClick={handleClick} className="video-container home-container">
      {!isConnected && <LoadingScreen />}
      <Webcam
        audio={false}
        ref={webcamRef}
        className={`video-element ${isVideoVisible ? 'visible' : 'blurred'}`}
        style={{
          objectFit: 'cover',
        }}
        videoConstraints={{
          deviceId: cameraId ? { exact: cameraId } : undefined,
        }}
      />

      {isVideoVisible && (
        <img
          src="/allenpic.png"
          className="overlay-image"
          alt="Overlay"
        />
      )}

      {/* Instruction Overlay for First-Time Users */}
      {!hasVisitedHome && (
        <div
          className="instruction-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="h5" className="instruction-text">
            {t('Start Signing Instruction')}
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
            {t('Instructions')}
          </Typography>
          <Typography variant="body1" className="help-text">
            {t('Start Signing Instruction')}
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

      {/* Subtitle */}
      {subtitleText && (
        <div className="subtitle-container">
          <Typography variant="h5" className="subtitle-text">
            {subtitleText}
          </Typography>
        </div>
      )}

      {/* Popup Toggle Button */}
      <Tooltip
        title={isPopupOpen ? t('Hide Translation') : t('Show Translation')}
        placement="left"
      >
        <IconButton
          className="popup-toggle-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPopupOpen(!isPopupOpen);
          }}
          aria-label="Toggle Translation Popup"
        >
          {isPopupOpen ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
        </IconButton>
      </Tooltip>

      {/* Popup for Translation Output */}
      <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)}>
        <div className="popup-content">
          <Typography variant="h6" gutterBottom>
            {t('Translation Output')}
          </Typography>
          <Typography variant="body1" className="popup-text">
            {subtitleText}
          </Typography>
          {/* Copy to Clipboard Button */}
          <Tooltip title={t('Copy to Clipboard')}>
            <IconButton
              color="primary"
              onClick={() => {
                navigator.clipboard.writeText(subtitleText);
                setSnackbarMessage(t('Copied to clipboard'));
                setOpenSnackbar(true);
              }}
              className="copy-button"
              aria-label="Copy to Clipboard"
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          <Snackbar
            open={openSnackbar}
            autoHideDuration={3000}
            onClose={() => setOpenSnackbar(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setOpenSnackbar(false)} severity="info" sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </div>
      </Popup>
    </div>
  );
};

function debounce(func: () => void, wait: number) {
  let timeout: NodeJS.Timeout;
  const debounced = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(), wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

export default Home;
