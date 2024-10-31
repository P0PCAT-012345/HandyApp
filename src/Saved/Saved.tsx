import React, { useState } from 'react';
import './Saved.css';
import { useTranslation } from 'react-i18next';

<<<<<<< Updated upstream
const Saved: React.FC = () => {
  const [recordings, setRecordings] = useState<{ name: string; url: string }[]>(() => {
    const savedRecordings = localStorage.getItem('recordings');
    return savedRecordings ? JSON.parse(savedRecordings) : [];
  });
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);

  const handleRecordingClick = (url: string) => {
    setSelectedRecording(url);
  };

  const handleDeleteRecording = (index: number) => {
    const updatedRecordings = recordings.filter((_, i) => i !== index);
    setRecordings(updatedRecordings);
    localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  };

  const handleDownloadRecording = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCloseVideo = () => {
    setSelectedRecording(null);
  };

  return (
    <div className="saved-container">
      <h1>Saved Recordings</h1>
      {recordings.length > 0 ? (
        <ul>
          {recordings.map((recording, index) => (
            <li key={index} className="recording-item">
              <span onClick={() => handleRecordingClick(recording.url)}>
                {recording.name}
              </span>
              <button className="delete-button" onClick={() => handleDeleteRecording(index)}>
                Delete
              </button>
              <button
                className="download-button"
                onClick={() => handleDownloadRecording(recording.url, recording.name)}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recordings saved.</p>
      )}
      {selectedRecording && (
        <div className="video-overlay" onClick={handleCloseVideo}>
          <div className="video-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseVideo}>
              X
            </button>
            {/* Flip the video content, but not the controls */}
            <div className="video-wrapper">
              <video src={selectedRecording} controls autoPlay className="video-content" />
            </div>
          </div>
        </div>
      )}
    </div>
=======
interface SavedItem {
  name: string;
  timestamp: string;
  video: string; 
}

interface SocketMessageProps {
  result: any; // Changed to 'any' to accommodate different structures
  function: string;
}

interface SavedProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
}

const Saved: React.FC<SavedProps> = ({ socketRef, socketMessage, isConnected }) => {
  const { t } = useTranslation();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isConnected) {
      hasInitialized.current = false;
    }
    if (!isConnected || !socketRef.current || hasInitialized.current) return;
  
    hasInitialized.current = true;
  
    const requestList = JSON.stringify({ function: 'list_saved' });
    socketRef.current.send(requestList);
  
    const newSavedItems: SavedItem[] = [];
    const chunks: { [key: string]: string[] } = {};
  
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data); // Debugging
      try {
        const data = JSON.parse(event.data);
        if (data.function === 'list_saved' && data.result) {
          if (data.result.finished === true) { // Ensure exact match
            setSavedItems(newSavedItems);
            setFilteredItems(newSavedItems);
            setIsLoading(false);
            console.log('Finished receiving saved items.');
          } else {
            const { name, timestamp, chunk } = data.result;
            const key = `${name}_${timestamp}`;
  
            if (!chunks[key]) {
              chunks[key] = [];
            }
  
            if (chunk === null) {
              const videoData = chunks[key].join('');
              const savedItem = {
                name,
                timestamp,
                video: videoData,
              };
  
              newSavedItems.push(savedItem);
              delete chunks[key];
              console.log(`Added saved item: ${name} at ${timestamp}`);
            } else {
              chunks[key].push(chunk);
              console.log(`Received chunk for ${name} at ${timestamp}: ${chunk}`);
            }
          }
        } else if (data.error) {
          setError(data.error);
          setIsLoading(false);
          console.error('Error from server:', data.error);
        }
      } catch (err) {
        console.error('Failed to parse message in Saved component:', err);
        setError(t('Failed to parse server response.'));
        setIsLoading(false);
      }
    };
  
    socketRef.current.removeEventListener('message', handleMessage);
    socketRef.current.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.removeEventListener('message', handleMessage);
      }
    };
  }, [isConnected, socketRef, t]);

  useEffect(() => {
    if (socketMessage) {
      if (socketMessage.function === 'list_saved') {
        // Already handled in the main message handler
      }
      // Add any additional message handling if necessary
    }
  }, [socketMessage]);

  const handleDelete = (item: SavedItem) => {
    if (window.confirm(`${item.name} ${t('Are you sure you want to delete it?')}`)) {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const deleteMessage = JSON.stringify({
          function: 'delete_saved',
          kwargs: {
            name: item.name,
            timestamp: item.timestamp,
          },
        });
        socketRef.current.send(deleteMessage);
        setSavedItems((prev) =>
          prev.filter(
            (i) => !(i.name === item.name && i.timestamp === item.timestamp)
          )
        );
        setFilteredItems((prev) =>
          prev.filter(
            (i) => !(i.name === item.name && i.timestamp === item.timestamp)
          )
        );
        console.log(`Deleted saved item: ${item.name} at ${item.timestamp}`);
      }
    }
  };

  const handleDownload = (item: SavedItem) => {
    const link = document.createElement('a');
    link.href = `data:video/webm;base64,${item.video}`;
    link.download = `${item.name}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Downloaded saved item: ${item.name}.webm`);
  };

  const openModal = (item: SavedItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    console.log(`Opened modal for: ${item.name} at ${item.timestamp}`);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
    console.log('Closed modal.');
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = (file: File) => {
    alert(t('Upload feature is currently not implemented.'));
    console.log('Attempted to upload file:', file.name);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, t]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(savedItems);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      setFilteredItems(
        savedItems.filter(item => item.name.toLowerCase().includes(lowerCaseQuery))
      );
    }
  }, [searchQuery, savedItems]);

  if (isLoading) {
    return (
      <Box className="saved-container loading-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
        <Typography variant="body1" style={{ marginLeft: '10px' }}>{t('Loading')}...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="saved-container error-container">
        <Typography variant="h6" color="error">
          {t('Error')}: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {!isConnected && <LoadingScreen />}
      <Box className="saved-container">
        <Box className="header">
          <Typography variant="h4" className="saved-title">
            {t('Saved')} {t('Sign Language')}
          </Typography>
          <Box className="upload-section">
            <input
              type="file"
              accept="video/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Tooltip title={t('Upload')}>
              <IconButton
                color="primary"
                onClick={handleUploadClick}
                className="upload-button"
                aria-label={t('Upload')}
              >
                <UploadIcon />
              </IconButton>
            </Tooltip>
            {isUploading && <CircularProgress size={24} className="upload-progress" />}
          </Box>
        </Box>
        <Box className="search-bar">
          <TextField
            placeholder={`${t('Search')}...`}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              style: { color: 'var(--text-color)' }, // Ensure text is visible in dark mode
            }}
            className="search-input"
            aria-label={t('Search')}
          />
        </Box>
        <TableContainer component={Paper} className="table-container">
          <Table aria-label={t('Saved Signs Table')}>
            <TableHead>
              <TableRow>
                <TableCell className="table-header-cell">{t('Name')}</TableCell>
                <TableCell className="table-header-cell action-header-cell" align="right">
                  {t('Action')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item, index) => (
                <TableRow key={`${item.name}-${item.timestamp}-${index}`} className="table-row">
                  <TableCell className="table-cell">
                    <Button
                      onClick={() => openModal(item)}
                      className="name-button"
                      aria-label={`${t('Preview')} ${item.name}`}
                    >
                      {item.name}
                    </Button>
                  </TableCell>
                  <TableCell className="table-cell action-cell" align="right">
                    <Tooltip title={t('Download')}>
                      <IconButton
                        aria-label={t('Download')}
                        onClick={() => handleDownload(item)}
                        className="action-button download-button"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Delete')}>
                      <IconButton
                        aria-label={t('Delete')}
                        onClick={() => handleDelete(item)}
                        className="action-button delete-button"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    <Typography variant="body1">{t('No Saved Signs')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={isModalOpen}
          onClose={closeModal}
          maxWidth="md"
          fullWidth
          aria-labelledby="video-preview-title"
        >
          <DialogTitle id="video-preview-title" className="dialog-title">
            {selectedItem?.name} - {t('Preview')}
            <IconButton
              aria-label={t('Close')}
              onClick={closeModal}
              className="close-button"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers className="dialog-content">
            {selectedItem && (
              <video controls className="preview-video">
                <source
                  src={`data:video/webm;base64,${selectedItem.video}`}
                  type="video/webm"
                />
                {t('Your browser does not support the video tag.')}
              </video>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal} color="primary" className="close-dialog-button">
              {t('Close')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
>>>>>>> Stashed changes
  );
};

export default Saved;
